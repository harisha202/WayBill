import os
import glob

features_dir = r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard"
files = glob.glob(os.path.join(features_dir, "*Features.jsx"))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Fix .client.get -> .get
    content = content.replace(".client.get(", ".get(")
    
    # 2. Fix res.data.data -> res.data inside the then(res => ...) blocks of the new charts
    # Only replace it if it's part of the chart loading logic
    content = content.replace("res.data.data", "res.data")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed API calls in all Features files.")
