#!/usr/bin/env python3
"""Parse dump1-4.json (API dumps, no correct answers) into intermediate JSON.

- Strips HTML, preserves line breaks, extracts base64 images -> images/<sha16>.png
- Handles composite (case-study) question groups
- Strips leading question numbering & answer letter prefixes
- Assigns exam numbers 22-25, deterministic UUIDv5 question ids
- Emits: parsed-dump-exams.json + answer batch files for LLM answering
"""
import json, re, html, hashlib, base64, uuid, os, sys

EXAMS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(EXAMS_DIR, 'images')
OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(EXAMS_DIR, 'cbap-scraper', 'dump-parse-output')
DUMP_TO_EXAM = {'dump1.json': 22, 'dump2.json': 23, 'dump3.json': 24, 'dump4.json': 25}

stats = {'images_saved': 0, 'images_failed': 0, 'numbering_stripped': 0,
         'prefix_stripped': 0, 'trailing_quote_stripped': 0}


def extract_images(raw_html):
    """Replace <img base64> with placeholder, save PNG named by sha256[:16]."""
    files = []

    def repl(m):
        b64 = m.group(1)
        try:
            data = base64.b64decode(b64, validate=False)
            name = 'img_' + hashlib.sha256(data).hexdigest()[:16] + '.png'
            path = os.path.join(IMAGES_DIR, name)
            if not os.path.exists(path):
                with open(path, 'wb') as fh:
                    fh.write(data)
            stats['images_saved'] += 1
            files.append(name)
            return f'\n[HÌNH ẢNH: {name}]\n'
        except Exception:
            stats['images_failed'] += 1
            return '\n[HÌNH ẢNH: không giải mã được]\n'

    out = re.sub(r'<img[^>]*src="data:image/[a-z]+;base64,([^"]+)"[^>]*>', repl, raw_html)
    return out, files


def strip_html(raw):
    s, files = extract_images(raw)
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'</p>\s*<p[^>]*>', '\n', s)
    s = re.sub(r'</(figure|div|li|tr)>', '\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s).replace('\xa0', ' ').replace('\r', '')
    lines = [re.sub(r'[ \t]+', ' ', ln).strip() for ln in s.split('\n')]
    text = '\n'.join(ln for ln in lines if ln)
    return text.strip(), files


def clean_question_text(text):
    m = re.match(r'^(\d{1,4})\.\s*(?=\S)', text)
    if m and text[m.end():].strip():
        stats['numbering_stripped'] += 1
        text = text[m.end():]
    # artifact nguồn ExamTopics: nhãn "CORRECT TEXT" dính đầu câu hỏi
    text = re.sub(r'^CORRECT TEXT\s+', '', text)
    return text.strip()


def clean_answers(answers):
    """answers: list of raw Key strings -> cleaned, letter prefixes stripped."""
    texts = []
    for a in answers:
        t, _ = strip_html(str(a))
        t = t.replace('\n', ' ').strip()
        texts.append(t)
    prefixed = [bool(re.match(r'^[A-Da-d][.)]\s', t)) for t in texts]
    if sum(prefixed) >= 3:  # consistent "A. xxx" style -> strip
        cleaned = []
        for t, p in zip(texts, prefixed):
            if p:
                t = re.sub(r'^[A-Da-d][.)]\s+', '', t)
                stats['prefix_stripped'] += 1
            cleaned.append(t)
        texts = cleaned
    # stray trailing quote with no opening quote (source escaping artifact)
    fixed = []
    for t in texts:
        if t.endswith('"') and t.count('"') == 1:
            t = t[:-1].rstrip()
            stats['trailing_quote_stripped'] += 1
        fixed.append(t)
    return fixed


def qid_for(exam_number, orig_id):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f'cbap-dump/{exam_number}/{orig_id}'))


def parse_dump(fname, exam_number):
    with open(os.path.join(EXAMS_DIR, fname)) as fh:
        data = json.load(fh)['Data']
    questions = []
    order = 0

    for q in (data['listQuestionFullByTopicSetID'] or []):
        order += 1
        text, files = strip_html(q['Question'])
        text = clean_question_text(text)
        qid = qid_for(exam_number, q['ID'])
        questions.append({
            'question_id': qid, 'orig_id': q['ID'], 'exam_number': exam_number,
            'question_order': order, 'group_id': qid, 'group_position': 1,
            'group_size': 1, 'is_case_study': False, 'context': '',
            'question_text': text, 'image_files': files,
            'options': clean_answers([a['Key'] for a in q['answers']]),
        })

    for comp in (data['listCompositeQuestionFullByTopicSetID'] or []):
        ctx, ctx_files = strip_html(comp['Question'])
        subs = comp['questions']
        group_id = qid_for(exam_number, subs[0]['ID'])
        for pos, sq in enumerate(subs, 1):
            order += 1
            text, files = strip_html(sq['Question'])
            text = clean_question_text(text)
            questions.append({
                'question_id': qid_for(exam_number, sq['ID']), 'orig_id': sq['ID'],
                'exam_number': exam_number, 'question_order': order,
                'group_id': group_id, 'group_position': pos, 'group_size': len(subs),
                'is_case_study': True, 'context': ctx,
                'question_text': text, 'image_files': ctx_files + files,
                'options': clean_answers([a['Key'] for a in sq['answers']]),
            })
    return questions


# ── Phát hiện case study "ngầm" trong list câu đơn ───────────────────────────
# Dump lặp nguyên văn context ở nhiều câu (có thể không liền kề). Nhóm các câu
# có tiền tố chung >= MIN_SHARED_PREFIX ký tự, tách context/câu hỏi con,
# và xếp các câu cùng nhóm đứng liền nhau như trải nghiệm đề thi gốc.
MIN_SHARED_PREFIX = 200

# Câu hỏi con "mồ côi" (không kèm context trong dump) → gắn tay vào nhóm:
# orig_id của câu mồ côi -> orig_id của một câu thuộc nhóm đích
MANUAL_GROUP_ATTACH = {
    9426: 9422,  # đề 22 "What kind of analysis... the systems" -> case bảo hiểm claims
    9283: 9423,  # đề 22 "parcel tracking solution" -> case công ty chuyển phát
}

# Ảnh của cả case study (bảng dữ liệu dùng chung) → chuyển vào context.
# Đã kiểm tra bằng mắt từng ảnh: 'drop' là các bản crop trùng/cụt của cùng một bảng.
# key: orig_id của một thành viên nhóm. Nhóm payment (9427) KHÔNG có ở đây vì
# 2 ảnh của nó là sơ đồ phương án trả lời A-D của riêng một câu hỏi.
GROUP_CONTEXT_IMAGES = {
    9421: {'context_image': 'img_a23379f836472605.png',              # mortgage: 3 crop cùng 1 bảng
           'drop': ['img_6183caeba64f4061.png', 'img_a7b1b93699423199.png']},
    9422: {'context_image': 'img_3745ab60183f3fbc.png',              # insurance: 2 crop cụt header, 1 bảng đủ
           'drop': ['img_032c8634a374d079.png', 'img_39d36a7ede96cb7a.png']},
    9423: {'context_image': 'img_6901541cabe19c5c.png', 'drop': []},  # courier: ảnh đã nằm trong context
}

IMG_PLACEHOLDER = re.compile(r'\[HÌNH ẢNH: ([^\]]+)\]')


def refit_group_images(members):
    """Chuyển ảnh dùng chung vào context của nhóm, tính lại image_files từ placeholder."""
    ctx = members[0]['context']
    policy = next((GROUP_CONTEXT_IMAGES[m['orig_id']] for m in members
                   if m['orig_id'] in GROUP_CONTEXT_IMAGES), None)
    if policy:
        remove = set(policy['drop']) | {policy['context_image']}

        def strip_ph(text, names):
            text = IMG_PLACEHOLDER.sub(
                lambda m: '' if m.group(1).strip() in names else m.group(0), text)
            return re.sub(r'\n{2,}', '\n', text).strip()

        for m in members:
            m['question_text'] = strip_ph(m['question_text'], remove)
        ctx = strip_ph(ctx, set(policy['drop']))
        if policy['context_image'] not in [n.strip() for n in IMG_PLACEHOLDER.findall(ctx)]:
            ctx += f"\n[HÌNH ẢNH: {policy['context_image']}]"

    # image_files = ảnh trong context (chung) + ảnh riêng trong câu hỏi con
    ctx_imgs = [n.strip() for n in IMG_PLACEHOLDER.findall(ctx)]
    for m in members:
        m['context'] = ctx
        own = [n.strip() for n in IMG_PLACEHOLDER.findall(m['question_text'])]
        m['image_files'] = list(dict.fromkeys(ctx_imgs + own))


def common_prefix_len(a, b):
    n = min(len(a), len(b))
    i = 0
    while i < n and a[i] == b[i]:
        i += 1
    return i


# Bản sao context giữa các câu có sai khác OCR nhỏ (vd "onvolved"/"involved",
# "\n" vs " ") → dùng fuzzy alignment: bỏ qua khác biệt <= FUZZY_TOLERANCE ký tự,
# chỉ coi là phân kỳ thực sự (hết context chung) khi khác biệt lớn hơn.
FUZZY_TOLERANCE = 12


def fuzzy_divergence(a, b):
    """Vị trí (trong a, trong b) nơi a và b bắt đầu khác nhau đáng kể."""
    import difflib
    da = db = 0
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == 'equal':
            da, db = i2, j2
        elif max(i2 - i1, j2 - j1) > FUZZY_TOLERANCE:
            break
    return da, db


def map_pos(a, m, pos_a):
    """Ánh xạ vị trí pos_a (toạ độ a) sang toạ độ của m qua alignment."""
    import difflib
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, m, autojunk=False).get_opcodes():
        if i2 >= pos_a:
            if tag == 'equal':
                return j1 + (pos_a - i1)
            return j2
    return len(m)


def split_context(members):
    """Trả về (context, [vị trí cắt của từng member]) dựa trên fuzzy alignment."""
    base = members[0]['question_text']
    boundary = len(base)
    for m in members[1:]:
        da, _ = fuzzy_divergence(base, m['question_text'])
        boundary = min(boundary, da)
    # lùi về ranh giới dòng (hoặc cuối câu) gần nhất trong base
    ctx = base[:boundary]
    cut = ctx.rfind('\n')
    if cut < MIN_SHARED_PREFIX // 2:
        cut = ctx.rfind('. ')
        cut = cut + 1 if cut > 0 else len(ctx)
    cuts = [cut] + [map_pos(base, m['question_text'], cut) for m in members[1:]]
    return base[:cut].strip(), cuts


def group_implicit_case_studies(questions):
    """Nhận list câu của 1 đề (sau parse), trả về list đã nhóm + đánh số lại."""
    items = sorted(questions, key=lambda q: q['question_order'])
    n = len(items)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    idx_by_orig = {q['orig_id']: i for i, q in enumerate(items)}
    for i in range(n):
        for j in range(i + 1, n):
            if items[i]['is_case_study'] or items[j]['is_case_study']:
                continue  # nhóm composite từ nguồn đã xử lý sẵn
            if common_prefix_len(items[i]['question_text'],
                                 items[j]['question_text']) >= MIN_SHARED_PREFIX:
                parent[find(j)] = find(i)
    for orphan, target in MANUAL_GROUP_ATTACH.items():
        if orphan in idx_by_orig and target in idx_by_orig:
            parent[find(idx_by_orig[orphan])] = find(idx_by_orig[target])

    clusters = {}
    for i in range(n):
        clusters.setdefault(find(i), []).append(i)

    # tách context cho các cụm nhiều câu (chỉ tính tiền tố trên câu không mồ côi)
    for root, idxs in clusters.items():
        if len(idxs) < 2:
            continue
        members = [items[i] for i in idxs]
        sharers = [m for m in members if m['orig_id'] not in MANUAL_GROUP_ATTACH]
        if len(sharers) >= 2:
            ctx, cuts = split_context(sharers)
            rests = {id(m): m['question_text'][c:].strip() for m, c in zip(sharers, cuts)}
        else:
            # nhóm chỉ tồn tại nhờ gắn tay: context = phần bài dẫn của câu sharer,
            # câu hỏi con = dòng cuối cùng (câu hỏi thực sự)
            full = sharers[0]['question_text']
            cut = max(full.rfind('\n'), 0)
            ctx = full[:cut].strip()
            rests = {id(sharers[0]): full[cut:].strip()}
        group_id = members[0]['question_id']
        for pos, m in enumerate(members, 1):
            m.update({
                'group_id': group_id, 'group_position': pos,
                'group_size': len(members), 'is_case_study': True,
                'context': ctx,
                'question_text': rests.get(id(m), m['question_text']),
            })
        stats['implicit_groups'] = stats.get('implicit_groups', 0) + 1

    # xếp lại: các câu cùng nhóm đứng liền nhau tại vị trí câu đầu tiên của nhóm
    emitted, ordered = set(), []
    for i in range(n):
        root = find(i)
        if root in emitted:
            continue
        emitted.add(root)
        ordered.extend(items[k] for k in clusters[root])
    for order, q in enumerate(ordered, 1):
        q['question_order'] = order
    return ordered


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(IMAGES_DIR, exist_ok=True)
    all_questions = []
    for fname, exam in DUMP_TO_EXAM.items():
        qs = group_implicit_case_studies(parse_dump(fname, exam))
        n_cs = sum(1 for q in qs if q['is_case_study'])
        print(f'{fname} -> exam {exam}: {len(qs)} questions ({n_cs} in case-study groups)')
        all_questions.extend(qs)

    # ảnh dùng chung của case study → context; tính lại image_files từ placeholder
    groups = {}
    for q in all_questions:
        if q['is_case_study']:
            groups.setdefault(q['group_id'], []).append(q)
    for members in groups.values():
        members.sort(key=lambda m: m['group_position'])
        refit_group_images(members)

    with open(os.path.join(OUT_DIR, 'parsed-dump-exams.json'), 'w') as fh:
        json.dump(all_questions, fh, ensure_ascii=False, indent=1)

    # batches for LLM answer determination
    BATCH = 30
    letters = 'abcd'
    for i in range(0, len(all_questions), BATCH):
        batch = []
        for q in all_questions[i:i + BATCH]:
            batch.append({
                'question_id': q['question_id'],
                'context': q['context'],
                'question': q['question_text'],
                'options': {letters[j]: opt for j, opt in enumerate(q['options'])},
                'image_paths': [os.path.join(IMAGES_DIR, f) for f in q['image_files']],
            })
        with open(os.path.join(OUT_DIR, f'batch-{i // BATCH + 1:02d}.json'), 'w') as fh:
            json.dump(batch, fh, ensure_ascii=False, indent=1)

    print('total:', len(all_questions), '| batches:', (len(all_questions) + BATCH - 1) // BATCH)
    print('stats:', stats)


if __name__ == '__main__':
    main()
