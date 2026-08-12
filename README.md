# WayBill

Welcome to the WayBill repository!

## Documentation

- **[WayBill — Feature Meaning, Business Logic & Decision Guide](./docs/WAYBILL_DECISION_GUIDE.md)**: A comprehensive guide on the business logic, UI charts, decisions, and system architecture for WayBill.

## Design Rule: What Every Chart Must Answer

Before adding any new chart or dashboard metric to the WayBill UI, it **must** be able to answer the following five questions:

1. What does this chart tell me?
2. Why do I need to know it?
3. What decision can I make from it?
4. Where does the data come from?
5. What backend logic calculates it?
6. What happens if there is no data?

If a chart cannot answer those questions clearly, do not add it just for visual appearance. See the full [Decision Guide](./docs/WAYBILL_DECISION_GUIDE.md) for more details.
