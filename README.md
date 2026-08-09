# WayBill - Global Supply Chain Management

WayBill is a comprehensive, real-time Global Supply Chain Management (GSCM) platform designed to orchestrate and optimize the entire lifecycle of a product—from raw material sourcing at the manufacturer to the final sale at retail shops. It provides an interconnected dashboard system tailored to the specific needs of Admins, Manufacturers, Transporters, Dealers, and Retailers.

## Scope of the Project

The scope of WayBill spans across multiple critical tiers of the global supply chain:
- **Role-Based Portals**: Custom interfaces and data access points for Admins (oversight), Manufacturers (production), Transporters (logistics), Dealers (distribution), and Retailers (sales).
- **Real-Time GPS Tracking**: WebSockets integration for live map tracking of shipments in transit, visualizing truck locations and traffic/congestion delays.
- **AI Forecasting & Route Optimization**: Predictive analytics for manufacturing demand (SARIMA models) and AI-driven route optimization for logistics to reduce transit times and emissions.
- **Supplier Risk Management**: Intelligent scoring algorithms that evaluate supplier reliability based on history, news, and financial health.
- **Blockchain Traceability (Simulated)**: End-to-end product journey tracking ensuring transparency and authenticity of goods.

## Why is it used?

Modern supply chains are often fragmented, relying on siloed software for manufacturing, separate tools for logistics, and disconnected ERPs for retail. This fragmentation leads to blind spots, inefficiencies, and delayed responses to global disruptions (like port congestion or material shortages). 

WayBill is used to unify these disparate systems into a single, cohesive ecosystem. By centralizing the data, it ensures that when a manufacturer delays a batch, the transporter is automatically alerted, and the dealer can instantly adjust their inventory expectations.

## Real-World Usefulness

In the real world, WayBill solves multi-million dollar inefficiencies for global enterprises:
1. **Cost Reduction**: By utilizing AI route optimization, logistics companies drastically cut down fuel consumption and vehicle wear-and-tear.
2. **Proactive Disruption Management**: With live GPS mapping and supplier risk scoring, admins can foresee port congestions or high-risk suppliers and pivot to alternatives *before* a crisis occurs.
3. **Inventory Efficiency**: Dealers and Retailers no longer have to guess when stock will arrive. Predictive forecasting prevents stockouts during peak seasons and minimizes warehouse holding costs for unsold goods.
4. **Transparency & Trust**: Consumers and stakeholders can verify the ethical sourcing and exact journey of a product from the factory floor to the store shelf.

## Key Features Implemented

- **Unified Premium UI/UX**: A clean, modern SaaS aesthetic with distinct color-coded themes for different user roles (e.g., Blue for Login, Amber for Signup, Fuchsia for Guest).
- **Interactive Live Map Tracking**: A dynamic `react-leaflet` map integrated via WebSockets (`/ws/gps`) that visually plots live GPS coordinates of moving trucks in real-time.
- **Secure Authentication & OTP**: Robust email-based OTP verification and role-based access control (RBAC) ensuring users only access their designated portals.
- **Automated Fallback Mechanisms**: Intelligent backend failovers (e.g., automatically switching to a local SQLite database if the primary cloud PostgreSQL database is unreachable).
- **Background Simulation Engine**: Python-based daemons that autonomously simulate truck movements and continuously update backend coordinates for demonstration and testing.

## Technology Stack

- **Frontend**: React.js, Vite, React-Leaflet (Mapping), Chart.js (Analytics), pure CSS for modern styling.
- **Backend**: Python, FastAPI (Async APIs and WebSockets), Pydantic (Data Validation), SQLAlchemy (ORM).
- **Real-Time Data**: WebSockets for live GPS and notification streaming.
- **Security**: JWT (JSON Web Tokens) for stateless authentication.
