#!/usr/bin/env python3
"""Merge parsed-dump-exams.json + answers-batch-*.json -> TSV v3 rows.

Appends exams 22-25 to exams/questions.tsv & answers.tsv, syncs the pair
plus new images into cbap-app/public/exams/. data_quality = 'ai_answered'
(answers derived from BABOK v3 knowledge by LLM, not from source dump).
Low-confidence questions are appended to quality_report.tsv for review.
"""
import json, glob, os, shutil, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))       # exams/
APP_EXAMS = os.path.normpath(os.path.join(BASE, '..', 'cbap-app', 'public', 'exams'))
OUT = os.path.join(BASE, 'cbap-scraper', 'dump-parse-output')
LETTERS = 'abcd'


def esc(s):
    """TSV v3: one physical line per record, escape backslash, tab, newline."""
    return str(s).replace('\\', '\\\\').replace('\t', '\\t').replace('\n', '\\n')


def load_answers():
    answers = {}
    for f in sorted(glob.glob(os.path.join(OUT, 'answers-batch-*.json'))):
        for item in json.load(open(f)):
            answers[item['question_id']] = item
    return answers


def main():
    questions = json.load(open(os.path.join(OUT, 'parsed-dump-exams.json')))
    answers = load_answers()

    missing = [q['question_id'] for q in questions if q['question_id'] not in answers]
    if missing:
        sys.exit(f'ABORT: {len(missing)} questions without answer verdicts, e.g. {missing[:5]}')

    # duplicate-id guard against existing bank
    existing_ids = set()
    with open(os.path.join(BASE, 'questions.tsv')) as fh:
        next(fh)
        for line in fh:
            existing_ids.add(line.split('\t', 1)[0])
    dup = [q['question_id'] for q in questions if q['question_id'] in existing_ids]
    if dup:
        sys.exit(f'ABORT: duplicate question_id already in questions.tsv: {dup[:5]}')

    q_rows, a_rows, review_rows = [], [], []
    for q in questions:
        v = answers[q['question_id']]
        letter = v['correct_letter'].lower()
        assert letter in LETTERS, f'bad letter {letter} for {q["question_id"]}'
        q_rows.append('\t'.join([
            q['question_id'], str(q['exam_number']), str(q['question_order']),
            q['group_id'], str(q['group_position']), str(q['group_size']),
            'true' if q['is_case_study'] else 'false',
            esc(q['context']), esc(q['question_text']),
            ';'.join(q['image_files']), str(len(q['options'])),
            letter, 'ai_answered',
        ]))
        for i, opt in enumerate(q['options']):
            lt = LETTERS[i]
            fb = v['explanation'] if lt == letter else v.get('wrong_reasons', {}).get(lt, '')
            a_rows.append('\t'.join([
                q['question_id'], lt, esc(opt),
                'true' if lt == letter else 'false', esc(fb),
            ]))
        if v.get('confidence') == 'low':
            review_rows.append('\t'.join([
                q['question_id'], str(q['exam_number']), str(q['question_order']),
                'ai_answered_low_confidence', str(len(q['options'])),
                'Đáp án do AI suy luận với độ tin cậy thấp — nên đối chiếu lại BABOK v3',
            ]))

    def append(path, rows):
        with open(path, 'a') as fh:
            for r in rows:
                fh.write(r + '\n')

    append(os.path.join(BASE, 'questions.tsv'), q_rows)
    append(os.path.join(BASE, 'answers.tsv'), a_rows)
    append(os.path.join(BASE, 'quality_report.tsv'), review_rows)

    # sync to app public folder (TSVs + any missing images)
    for name in ('questions.tsv', 'answers.tsv', 'quality_report.tsv'):
        shutil.copy2(os.path.join(BASE, name), os.path.join(APP_EXAMS, name))
    copied = 0
    for img in os.listdir(os.path.join(BASE, 'images')):
        dst = os.path.join(APP_EXAMS, 'images', img)
        if not os.path.exists(dst):
            shutil.copy2(os.path.join(BASE, 'images', img), dst)
            copied += 1

    conf = {}
    for v in answers.values():
        conf[v.get('confidence', '?')] = conf.get(v.get('confidence', '?'), 0) + 1
    print(f'appended {len(q_rows)} questions, {len(a_rows)} answers, '
          f'{len(review_rows)} low-confidence review rows; images copied: {copied}')
    print('confidence distribution:', conf)


if __name__ == '__main__':
    main()
