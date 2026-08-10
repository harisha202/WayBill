import os

def fix_imports(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    imports_to_move = []
    new_lines = []
    
    for line in lines:
        if line.startswith("import BarChart from") or line.startswith("import StatusDonut from"):
            if line not in imports_to_move:
                imports_to_move.append(line)
        else:
            new_lines.append(line)
            
    # Put the specific imports at the top
    final_lines = imports_to_move + new_lines
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)

fix_imports(r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard\AdminFeatures.jsx")
fix_imports(r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard\DealerFeatures.jsx")
fix_imports(r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard\RetailFeatures.jsx")
print("Fixed imports in all features.")
