import os
import glob

features_dir = r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard"
files = glob.glob(os.path.join(features_dir, "*Features.jsx"))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace empty catch blocks with console.error
    content = content.replace(".catch(() => {})", ".catch(err => console.error('Failed to load chart analytics:', err))")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Replaced empty catch functions.")
