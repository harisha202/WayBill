# WayBill — Feature Meaning, Business Logic & Decision Guide

## 1. Dashboard KPI Cards

| KPI | What it indicates | Why needed | Logic / Source |
|---|---|---|---|
| **Total Orders** | Number of orders created | Measures overall demand | `COUNT(orders)` |
| **Active Shipments** | Shipments currently moving | Shows current logistics workload | `shipments.status IN (ASSIGNED, IN_TRANSIT)` |
| **Delivered** | Successfully completed shipments | Measures fulfillment | `COUNT(status=DELIVERED)` |
| **On-Time %** | Percentage delivered within planned ETA | Measures transporter performance | `on_time / total_delivered * 100` |
| **Delay Risk** | Probability/score of delay | Identifies shipments needing intervention | `GPS + ETA + route + historical data` |
| **Inventory Value** | Monetary value of current inventory | Shows capital tied up in stock | `available_qty × unit_cost` |
| **Backorders** | Orders that cannot currently be fulfilled | Shows supply shortage | `ordered_qty - received/fulfilled_qty` |
| **Gross Margin** | Revenue remaining after COGS | Measures profitability | `revenue - COGS` |
| **Critical Alerts** | Number of unresolved critical problems | Shows operational risk | `COUNT(alerts WHERE severity=CRITICAL AND status != RESOLVED)` |

---

## 2. Admin Charts

### Revenue vs Cost
**Indicates:** Whether the company is generating enough revenue compared with operational expenditure.
**Why:** Admin needs to know whether increasing shipment volume is actually profitable.
**Logic:**
```text
Revenue
- Transport Cost
- Storage Cost
- Handling Cost
- Production Cost
- Penalty
= Operating Profit
```
**Chart:** Use a Line chart or grouped bar chart.
```text
Revenue ─────────────
Cost    ────────
Profit  ─────
```

### 3. Profit Trend
**Indicates:** How profitability changes over time.
**Why:** A company can have increasing sales but decreasing profit.
**Logic:** `Profit = Revenue - Total Cost`
**Group by:** Day, Week, Month, Quarter

---

## 4. Order Pipeline
**Indicates:** Where orders are currently stuck.
**Why:** It immediately identifies bottlenecks.

**Pipeline:**
Created → Confirmed → Processing → QA → Dispatched → In Transit → Delivered

**Logic:** Count orders by current status.
*Example:*
- Created: 50
- Confirmed: 35
- Processing: 20
- Dispatched: 15
- Transit: 10
- Delivered: 80

*(If many orders are stuck at QA, the problem is probably manufacturing/quality capacity.)*

---

## 5. Supplier Risk Chart
**Indicates:** Which suppliers are creating the greatest supply-chain risk.
**Why:** Admin needs to identify suppliers that can cause production delays.
**Logic:** Supplier risk can combine various factors.

*Example:*
Supplier Risk = 
`30% Delivery + 25% Quality + 20% Lead-time + 15% Discrepancy + 10% Dependency`
*(The exact weights should be configurable rather than hardcoded.)*

---

## 6. Inventory Health Chart
**Indicates:** Whether inventory is Healthy, Low, Critical, Overstocked, or Out of stock.
**Logic:**
- `Available Stock <= Reorder Point` → LOW STOCK
- `Available Stock <= Safety Stock` → CRITICAL
- `Available Stock > Maximum Stock` → OVERSTOCK

*(This logic should be in the backend inventory service, not React.)*

---

## 7. Manufacturer — Production vs Demand
**Indicates:** Whether manufacturing capacity can satisfy expected demand.
**Why:** Prevents future stockouts.
**Logic:** `Demand Forecast` vs `Production Capacity`
*Example:* 
- Demand = 10,000
- Production = 7,000
- Gap = 3,000

*The UI should show: Production Shortfall = 3,000. This can trigger an AI/reorder recommendation.*

---

## 8. Manufacturer — QA Pass/Fail
**Indicates:** Production quality.
**Why:** A high failure rate means defective products are entering the supply chain.
**Logic:**
- `QA Pass % = Passed Units / Tested Units × 100`
- `Defect % = Failed Units / Tested Units × 100`
**Chart:** Use Stacked bar or donut chart.

---

## 9. Manufacturer — Production Cost
**Indicates:** How much it costs to produce products.
**Logic:**
`Production Cost = Raw Material + Labour + Energy + Packaging + Other Manufacturing Cost`
Then:
`Cost Per Unit = Total Production Cost / Produced Quantity`
*(This should connect directly to the financial ledger.)*

---

## 10. Transporter — Delay Risk
**Indicates:** How likely a shipment is to arrive late.
**Why:** Allows the transporter to intervene before the shipment becomes late.
**Inputs:** Current GPS, Planned Route, Actual Route, ETA, Planned ETA, Traffic, Route Deviation, Historical Delivery Performance.
**Logic:** Conceptually:
`Risk = f(ETA deviation, route deviation, historical delay, traffic, current speed, remaining distance)`
*(Do not generate this with Math.random(). The backend should produce the score.)*

---

## 11. Transporter — ETA vs Actual
**Indicates:** How accurate delivery predictions are.
**Logic:** `ETA Error = Actual Arrival Time - Predicted ETA`
*Example:* 
- Predicted: 4:00 PM
- Actual: 4:25 PM
- ETA Error = +25 min
*(This can also be used to evaluate the prediction system.)*

---

## 12. Transporter — Route Deviation
**Indicates:** Whether the vehicle has moved away from its planned route.
**Why:** Potential reasons include: Traffic, Wrong navigation, Unauthorized stop, Road closure, Driver deviation.
**Logic:** `Actual GPS path` vs `Planned route`. Then calculate deviation distance/percentage.

---

## 13. Transporter — Fleet Utilization
**Indicates:** How effectively vehicles are being used.
**Logic:** `Fleet Utilization = Used Capacity / Available Capacity × 100`
*Example:* 
- Truck Capacity = 10 tons
- Current Load = 8 tons
- Utilization = 80%
*(This helps avoid empty trucks, overloaded trucks, and poor fleet planning.)*

---

## 14. Driver Performance
**Indicates:** How reliably each driver performs.
**Metrics:** On-time %, Route compliance, Incident count, Deliveries, Average delay, Fuel efficiency.
*Example score:*
`Driver Score = 40% On-Time + 25% Route Compliance + 20% Safety + 15% Efficiency`
*(Again, make the weights configurable.)*

---

## 15. Dealer — Discrepancy Trend
**Indicates:** Whether receiving problems are increasing.
**Logic:** Track Ordered Quantity, Received Quantity, Damaged Quantity, Missing Quantity, Wrong SKU.
*Example:* Ordered = 1,000, Received = 950 → Discrepancy = 50

---

## 16. Dealer — Backorder Trend
**Indicates:** How much demand cannot currently be fulfilled.
**Logic:** `Backorder = Ordered Quantity - Fulfilled Quantity`
*(Track by SKU, Supplier, Manufacturer, Time)*

---

## 17. Dealer — Fulfillment Rate
**Indicates:** How successfully dealer demand is being fulfilled.
**Logic:** `Fulfillment Rate = Fulfilled Quantity / Ordered Quantity × 100`
*Example:* 800 / 1,000 × 100 = 80%

---

## 18. Retail — POS Sales Trend
**Indicates:** Actual customer demand.
**Why:** This becomes an important input for forecasting and automatic replenishment.
**Logic:** Daily Sales, Weekly Sales, Monthly Sales (Filter by SKU, Category, Store, Time).

---

## 19. Retail — Inventory vs Reorder Point
*This is one of the most important charts.*
**Indicates:** When the retailer should replenish inventory.
**Example:**
```text
Inventory
│
│       █
│       █
│       █
│------- Reorder Point
│    █
│    █
│---- Safety Stock
│ █
└──────────────── Time
```
**Logic:** `Current Inventory <= Reorder Point` → Reorder Recommendation

---

## 20. Demand Forecast
**Indicates:** Expected future demand.
**Why:** Allows the system to order before stock runs out.
**Logic:** 
- **Historical:** Sales, Inventory, Seasonality, Promotions, Lead Time → Forecast model
- **Output:** Next 7 days, Next 30 days, Next 90 days
- **Show:** Forecast, Actual, Confidence Interval

---

## 21. Forecast Accuracy
**Indicates:** Whether the AI forecasting system is actually reliable.
*(Do not show only the forecast. Show MAE, MAPE, RMSE.)*
*Example:* MAPE = 8.5% (Lower is generally better).

---

## 22. Auto-Reorder Recommendation
**Indicates:** What quantity the system recommends ordering.
**Basic logic:**
A configurable safety-stock policy can use:
`Recommended Order Qty = Expected Demand During Lead Time + Safety Stock - Available Inventory - Incoming Inventory`
Then apply: Minimum Order Quantity, Pack Size, Supplier Constraints.
*(The result should never blindly create an order without the configured approval policy.)*

---

## 23. Supply Chain Network Graph
**Indicates:** How entities are connected.
`Supplier → Manufacturer → Transporter → Dealer → Retail`
**Why:** Useful for discovering single-source dependencies, bottlenecks, high-risk suppliers, concentration risk.

---

## 24. Batch Traceability Graph
**Indicates:** Where a particular product batch came from and where it went.
`Raw Material → Production Batch → QA → Waybill → Transport → Dealer → Retail`
**Why:** Critical for Recall, Quality investigation, Disputes, Regulatory audit, Customer complaints.

---

## 25. Custody Timeline
**Indicates:** Who possessed the goods at each point.
`Manufacturer → Transporter → Dealer → Retailer`
**Each event should show:** Who, When, Where, Quantity, Waybill, Hash, Previous Event.
**Why:** Creates an auditable chain of custody.

---

## 26. Seal Verification
**Indicates:** Whether the Waybill/document has remained intact.
**Logic:** `Original Hash` vs `Current Hash`
- If `Original Hash == Current Hash` → Valid
- If `Original Hash != Current Hash` → Integrity Failure

---

## 27. QR Verification Rate
**Indicates:** How often QR verification succeeds or fails.
**Logic:** `Successful Scans / Total Scans × 100`
*(Also show: Invalid, Expired, Tampered, Not Found. This is useful for Retail and Admin.)*

---

## 28. Financial Ledger
*The ledger should not simply display numbers. It should answer: Where did this money come from, where did it go, and which business event created it?*
**Each transaction should link to:** Order, Waybill, Shipment, Invoice, Payment, User, Timestamp, Currency, Hash.
*Example:*
```text
WAYBILL WB-00125
Transport Cost: ₹8,500
Fuel: ₹3,200
Handling: ₹1,000
Penalty: ₹500
Total: ₹13,200
```

---

## 29. Ledger Integrity
**Each financial event can have an integrity reference/hash.**
`Transaction → Previous Ledger Hash → Current Ledger Hash`
This helps detect unauthorized modification. The UI should show:
`✓ Ledger Verified` or `⚠ Ledger Integrity Issue`

---

## 30. Currency Dashboard
**Indicates:** Financial exposure across currencies.
**Show:** INR, USD, EUR, GBP...
And: Original Amount, Exchange Rate, Base Currency, Converted Amount.
*(For an India-first system, use INR (₹) as the default base currency, while retaining multi-currency support if international operations are planned.)*

---

## 31. Cost Breakdown
**Indicates:** Where money is being spent.
*Example:* 
- Transport: ₹50,000
- Storage: ₹20,000
- Handling: ₹10,000
- Production: ₹90,000
- Penalty: ₹5,000
**Why:** Management can identify the biggest cost drivers.

---

## 32. Alerts
*Each alert should explain why it exists.*
**Bad:** `⚠ High Risk`
**Better:**
```text
⚠ High Delay Risk
Shipment WB-00125 is currently 32 minutes behind planned ETA.
Risk: 82%
Route deviation: 14 km
Recommended action: Contact transporter.
```
*(This is much more useful.)*

---

## 33. AI Explainability
*Every AI recommendation should answer: What happened? Why? What does the system predict? What should I do? How confident is it?*
**Example:**
```text
AI REORDER RECOMMENDATION
SKU: ABC-100
Recommended Quantity: 500

Why:
• Average daily demand increased 18%
• Current inventory is below reorder point
• Supplier lead time = 7 days
• Safety stock = 120 units

Confidence: 91%
[Approve Order]
```

---

## 34. Logs
*Logs should not just be developer logs. The application needs separate operational logs.*

| Log | Indicates | Why |
|---|---|---|
| Audit Log | Who changed what | Accountability |
| Custody Log | Who possessed goods | Traceability |
| GPS Log | Vehicle movement | Tracking |
| QR Log | Verification activity | Security |
| Ledger Log | Financial transactions | Financial audit |
| API Log | API activity | Debugging |
| Error Log | Failures | Reliability |
| AI Log | AI decisions | Explainability |

---

## 35. What Every Chart Must Answer
*This should be a design rule in your README.*
Before adding any chart, ask:
1. What does this chart tell me?
2. Why do I need to know it?
3. What decision can I make from it?
4. Where does the data come from?
5. What backend logic calculates it?
6. What happens if there is no data?

If a chart cannot answer those five questions, don't add it just for visual appearance.

---

## 36. Recommended Chart → Decision Architecture
The complete architecture should look like:
```text
DATABASE
   ↓
BACKEND SERVICE
   ↓
BUSINESS LOGIC
   ↓
API
   ↓
FRONTEND
   ↓
CHART / MAP / GRAPH
   ↓
USER DECISION
   ↓
ACTION
   ↓
DATABASE
```

**Example:**
```text
Inventory DB
     ↓
Inventory Service
     ↓
Current Qty < Reorder Point
     ↓
Reorder API
     ↓
Retail Dashboard
     ↓
Inventory Chart
     ↓
"Stock is low"
     ↓
AI Recommendation
     ↓
Approve Reorder
     ↓
Dealer Order
```
