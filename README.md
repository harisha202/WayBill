# WayBill - Global Supply Chain & Traceability Platform

WayBill is a comprehensive, multi-role supply chain management and traceability platform. It is designed to track products from manufacturing to retail, ensuring transparency, integrity, and efficiency at every step. 

The platform provides dedicated dashboards for different stakeholders (Admin, Manufacturer, Transporter, Dealer, and Retail Shop) with advanced features like AI-powered demand forecasting, route optimization, blockchain-inspired seal verification, and real-time inventory management.

## 🚀 Features

- **Multi-Role Access Control:** Customized dashboards and tools for Admins, Manufacturers, Transporters, Dealers, and Retailers.
- **End-to-End Traceability:** Track product batches from raw materials to final retail point, with custody timelines and QR code verification.
- **AI Forecasting & Analytics:** Demand forecasting, auto-reorder recommendations, and comprehensive KPIs.
- **Transporter & Fleet Management:** Live GPS map integrations, route optimization, fleet utilization metrics, and delay risk analysis.
- **Blockchain-Inspired Integrity:** Cryptographic hashing for waybills and ledger events to prevent data tampering.
- **Financial Ledger & Auditing:** Transparent tracking of operational costs, penalties, and transactions at every supply chain node.
- **Alert & Dispute Center:** Automated alerting for delays or discrepancies and a dedicated dispute resolution workflow.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Data Visualization:** Chart.js, Recharts
- **Mapping:** Leaflet, React Leaflet
- **QR Code Tools:** html5-qrcode, qrcode.react
- **E2E Testing:** Playwright
- **Linting:** ESLint

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (local.db) via SQLAlchemy ORM
- **Migrations:** Alembic
- **AI Integration:** Anthropic Claude / Google Gemini (via API)
- **Authentication:** JWT (JSON Web Tokens)
- **Testing:** Pytest

## 📂 Project Structure

- `/backend` - FastAPI server, REST endpoints, services, database models, and Pytest suites.
- `/frontend` - React application, modular components per role, store management, and Playwright E2E tests.
- `/docs` - Contains project decision guides, architecture details, and logic references (e.g., `WAYBILL_DECISION_GUIDE.md`).

## 💻 Running Locally

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Environment Variables:
   Copy `.env.example` to `.env` and fill in necessary values (e.g., JWT secret, AI API keys if using AI forecasting).
   ```bash
   cp .env.example .env
   ```
5. Run the server:
   ```bash
   python run.py
   # Or using uvicorn directly
   uvicorn app.api.__init__:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Variables:
   Copy `.env.example` to `.env.development` and configure the backend API URL.
   ```bash
   cp .env.example .env.development
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 🧪 Testing

- **Backend:** Run `python -m pytest` from the `backend` directory.
- **Frontend E2E:** Run `npm run test:e2e` from the `frontend` directory.
