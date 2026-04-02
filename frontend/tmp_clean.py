import re
import os

path = "c:/ottobon/Ottobon-Projects/Course_Platform_Test/frontend/src/pages/LandingPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

start_pattern = r"const painItems = \[\n  \"Watching tutorials without building\","
end_pattern = r"    </section>\n  );\n};\n\nconst CareerPath: React\.FC = \(\) => {"

# We can find the start and end indices using the string directly
start_idx = text.find('const painItems = [\n  "Watching tutorials without building"')
end_idx = text.find('const CareerPath: React.FC = () => {')

if start_idx != -1 and end_idx != -1:
    new_text = text[:start_idx] + text[end_idx:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_text)
    print("Cleaned up successfully.")
else:
    print(f"Bounds not found: {start_idx}, {end_idx}")
