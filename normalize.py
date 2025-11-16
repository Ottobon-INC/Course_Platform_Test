from pathlib import Path
path=Path('frontend/src/pages/CoursePlayerPage.tsx')
text=path.read_text(encoding='utf-8')
if '\xa0' in text:
    text=text.replace('\xa0',' ')
    path.write_text(text,encoding='utf-8')
