import os
import re

EMOJI_MAP = {
    "Flagship Tier-Tree Diagram": "🌳",
    "AI Supplier Risk Scoring": "⚠️",
    "Blockchain Document Monitor": "🔗",
    "Admin Control Tower": "🗼",
    "Revenue vs Cost": "💵",
    "Order Pipeline": "📈",
    "Order Fulfillment Pipeline": "📦",
    "Pending Orders": "⏳",
    "Partner Network Grid": "🤝",
    "Order vs Received Discrepancy": "⚖️",
    "Backorder Trend": "📉",
    "Margin (%)": "💰",
    "Real-Time Master Inventory": "🏭",
    "Production Controls": "⚙️",
    "Raw Material Sourcing": "🪨",
    "Quality Assurance & Handoff": "✅",
    "POS Sales by Demographic": "🛒",
    "AI Auto-Reorder Recommendations": "🤖",
    "QR Scanner Verification": "📱",
    "Ledger Verification Success Rate": "🧾",
    "Inventory vs Reorder Point": "📊",
    "Route Cost Optimization": "🛣️",
    "Fleet Utilization": "🚛",
    "Delay Risk Distribution": "⏱️",
    "AI Route Optimizer": "🗺️"
}

def add_emojis_to_titles(directory):
    for filename in os.listdir(directory):
        if not filename.endswith("Features.jsx"):
            continue
        
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        def replacer(match):
            title_text = match.group(1)
            emoji = EMOJI_MAP.get(title_text, "✨")
            
            # Use a dark mode friendly badge style for the emoji
            span = f'<span className="kpi-icon" style={{{{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#1e293b", width: "28px", height: "28px", borderRadius: "6px", marginRight: "12px", fontSize: "14px", border: "1px solid #334155" }}}}>{emoji}</span>'
            
            return f'<h2 className="card-title" style={{{{ display: "flex", alignItems: "center" }}}}>\n        {span}\n        {title_text}\n      </h2>'

        # Regex to find <h2 className="card-title">Some Title</h2>
        # (It ignores cases where it's already multi-line like the Live Map)
        new_content = re.sub(r'<h2 className="card-title"[^>]*>([^<]+)</h2>', replacer, content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

add_emojis_to_titles(r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard")
print("Done adding emojis to titles.")
