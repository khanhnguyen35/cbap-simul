import base64
import re

# Read questions.tsv
file_path = '/Users/khanhnguyen/Documents/CBAP simul/cbap-app/public/exams/questions.tsv'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
target_id = '019f43f6-a562-7f80-9460-4c97537364f9'
image_filename = f'img_{target_id}.jpg'
image_saved = False

for line in lines:
    if target_id in line and 'data:image/jpg;base64,' in line:
        # Extract base64
        match = re.search(r'data:image/jpg;base64,([^"]+)', line)
        if match:
            b64_data = match.group(1)
            # Remove the HTML tag from question_text
            # The line is tab separated. Let's split it.
            parts = line.split('\t')
            # question_text is parts[8]
            question_text = parts[8]
            # remove the HTML tag
            question_text = re.sub(r'&nbsp;<br><br><center><img src="data:image/jpg;base64,.*?"></center><br>', '', question_text).strip()
            
            parts[8] = question_text
            parts[9] = image_filename # image_files is parts[9]
            
            line = '\t'.join(parts)
            
            # Save the image
            image_path = f'/Users/khanhnguyen/Documents/CBAP simul/cbap-app/public/exams/images/{image_filename}'
            with open(image_path, 'wb') as img_f:
                img_f.write(base64.b64decode(b64_data))
            image_saved = True
            
    new_lines.append(line)

if image_saved:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Image saved and questions.tsv updated successfully.")
else:
    print("Could not find or process the image data.")

