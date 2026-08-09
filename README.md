# Waybill

Track it. Trust it. Trace it.

Waybill is a full-stack supply chain visibility and risk platform for the five roles that move a product from raw material to shelf: Admin, Manufacturer, Transporter, Dealer, Retail Shop. It replaces disconnected spreadsheets and phone calls with one system of record — real-time GPS tracking, blockchain-style shipment verification, AI-driven demand forecasting, and multi-tier supplier risk scoring.

## The problem

- **Visibility gaps** — companies see tier-1 suppliers and nothing past them.
- **Demand forecasting failures** — historical data alone doesn't catch sudden shifts, causing overstock or stockouts.
- **Single points of failure** — over-reliance on one supplier or region turns a local disruption into a global one.
- **Inventory inefficiency** — no reorder discipline means wasted capital or empty shelves.
- **Logistics bottlenecks** — port/route congestion with no early warning system.
- **Data fragmentation** — every partner runs on a different system, no shared source of truth.

Waybill is built to answer all six directly.

## Features

### Core
- Multi-role JWT authentication with brute-force lockout protection
- Real-time GPS shipment tracking
- Blockchain-style ledger for product journey verification (hash-chained events, no external blockchain network needed)
- Role-based dashboards for all 5 roles
- WebSocket-driven live alerts and notifications

### AI / Analytics
- Demand forecasting — baseline and SARIMA models with confidence bands, per SKU
- Supplier risk scoring — financial, geopolitical, operational, delivery, and ESG dimensions, with red flags and alternative-supplier suggestions
- Delay-risk prediction — auto-computed on every GPS update from distance, weather, and traffic
- Shipment anomaly detection — flags irregular tracking patterns against expected delivery
- AI executive summary — natural-language insight card generated from live inventory, shipment, and supplier data
- Ask Waybill — in-app streaming AI assistant for natural-language queries ("which supplier is highest risk this week?")
- Route optimization — sequenced delivery stops with distance/time/cost savings

### Visibility
- Supply Chain Depth — multi-tier supplier network diagram (tier-1 → tier-2 → tier-3) with drill-down into risk and order history per node
- Control Tower — single Admin landing page pulling one KPI row from every role
- Activity log — full audit trail of who changed what, when

### Inventory
- Configurable JIT vs. safety-stock reorder policy per SKU
- Persisted reorder points with live WebSocket alerts on threshold cross
- CSV/Excel export on every data table

## The five dashboards

| Dashboard | Pages | Highlights |
| --- | --- | --- |
| **Admin** | Dashboard, Analytics, Blockchain Monitor, System Report, Supply Chain Depth (new), Supplier Risk (new), Activity Log (new) | Control Tower, tier-network diagram, supplier risk radar |
| **Manufacturer** | Dashboard, Analytics, Inventory, Production, Blockchain Register | JIT/reorder toggle, SARIMA forecasting |
| **Transporter** | Dashboard, GPS Map, Fleet Manager, Shipment, Analytics, Route Optimizer (new) | Delay-risk gauge, congestion-aware map, route savings |
| **Dealer** | Dashboard, Orders, Arrivals, Inventory, Analytics | Shared reorder-point tooling with Manufacturer |
| **Retail Shop** | Dashboard, POS, Scanner, Inventory, Sales | QR-scan blockchain product journey lookup |

## Tech stack

- **Frontend**: React (Vite), Chart.js / react-chartjs-2, react-leaflet, WebSockets
- **Backend**: FastAPI, SQLAlchemy, SQLite (dev) / PostgreSQL-ready, JWT auth
- **AI**: Claude / Gemini API integration with graceful degradation when no key is configured
- **Forecasting**: statsmodels (SARIMA), baseline statistical fallback

## Design system

- **Brand**: Waybill — a real logistics term (the document that travels with and verifies a shipment), not an invented tech name
- **Logo**: a circular tracking seal — a rotating dashed ring carrying three checkpoint nodes around a central document-and-checkmark icon
- **Palette**: teal `#0F6E56` (primary), amber `#BA7517` (reserved strictly for risk/alert/verification), navy `#0B1B2E` (headings), green `#059669` / red `#DC2626` (status states)
- **Component library**: `StatCard`, `StatusPill`, `RiskBadge`, `DataTable`, `AlertToast`, `AskWaybillPanel` — shared across every dashboard so no page invents its own styling

## Architecture notes

- Every chart and map runs on libraries already in the stack (Chart.js, react-leaflet) — no new charting dependency required except a small tree-layout helper for the supplier network diagram.
- Six AI functions (`analyse_supplier_risk`, `optimise_delivery_route`, `detect_shipment_anomalies`, `get_dashboard_insights`, `stream_chat_response`, `check_inventory_alerts`) are implemented server-side and power the features above.
- Demo data is seeded server-side through real models and real endpoints — no hardcoded fallback data lives in the client bundle.

## Getting started

```bash
# clone
git clone https://github.com/<your-username>/waybill.git
cd waybill

# backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# frontend
cd ../frontend
npm install
npm run dev
```

Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill in your database URL and (optionally) an Anthropic or Gemini API key — the platform runs in a reduced-functionality mode without one.

## Roadmap

- [x] Core role-based platform, GPS tracking, blockchain-style ledger, demand forecasting
- [x] Multi-tier supplier visibility + risk scoring (Supply Chain Depth, Supplier Risk)
- [x] Persisted reorder points + live inventory alerts
- [x] Automatic delay-risk scoring + congestion-aware map
- [x] Control Tower + AI executive summary
- [x] Ask Waybill assistant, anomaly detection, route optimizer
- [x] Activity log, CSV/Excel export, shared component library consolidation
