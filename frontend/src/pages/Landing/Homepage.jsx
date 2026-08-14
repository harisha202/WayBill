import { Logo } from '../../components/ui/Logo'

function Homepage({ onLoginClick }) {
  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)', 
      color: 'var(--text)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      fontFamily: 'var(--app-font-normal)' 
    }}>
      


      <div style={{ maxWidth: '1200px', width: '100%', padding: '4rem 2rem', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* --- 3. HERO SECTION --- */}
        <section style={{ textAlign: 'center', marginBottom: '6rem', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Logo style={{ width: 120, height: 120 }} />
          </div>
          <h3 style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--text)', margin: '0 0 0.5rem 0', letterSpacing: '0.1em' }}>
            WAYBILL
          </h3>
          <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--primary)', margin: '0 0 2rem 0', letterSpacing: '-0.01em' }}>
            Connected Supply Chain Operations
          </h2>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text)', margin: '0 auto 3rem auto', maxWidth: '700px', lineHeight: '1.6' }}>
            <strong>One connected supply chain. One operational view.</strong><br/><br/>
            WayBill connects orders, inventory, manufacturing, transportation, waybills, traceability and financial operations into one platform.
          </p>

          <button 
            onClick={onLoginClick}
            style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '1rem 3rem', 
              borderRadius: '8px', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              border: 'none', 
              cursor: 'pointer', 
              boxShadow: '0 4px 6px -1px rgba(15, 110, 86, 0.2)' 
            }}
          >
            System Login
          </button>
        </section>

        {/* --- 4. CORE FEATURES --- */}
        <section style={{ width: '100%', marginBottom: '6rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--dashboard-heading)' }}>Everything Connected in One Platform</h2>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid var(--transporter)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--dashboard-heading)', fontSize: '1.2rem' }}>Real-Time Logistics</h3>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: '1.5' }}>Track shipments, vehicle movement, ETA and route risks.</p>
            </div>
            
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid var(--dealer)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--dashboard-heading)', fontSize: '1.2rem' }}>Inventory Control</h3>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: '1.5' }}>Monitor available, reserved, incoming stock, discrepancies and reorder requirements.</p>
            </div>
            
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid var(--manufacturer)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--dashboard-heading)', fontSize: '1.2rem' }}>Digital Waybills</h3>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: '1.5' }}>Manage waybill creation, sealing, dispatch, custody transfer, receiving and verification.</p>
            </div>
            
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid var(--primary)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--dashboard-heading)', fontSize: '1.2rem' }}>QR Traceability</h3>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: '1.5' }}>Verify shipment and waybill identity using secure QR verification.</p>
            </div>

            <div style={{ gridColumn: '2', background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid var(--retail)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--dashboard-heading)', fontSize: '1.2rem' }}>Financial Traceability</h3>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: '1.5' }}>Connect financial transactions with orders, shipments, waybills and operational events.</p>
            </div>
            
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid var(--admin)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--dashboard-heading)', fontSize: '1.2rem' }}>Operational Control</h3>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: '1.5' }}>Give each supply-chain participant the tools required for their role.</p>
            </div>

          </div>
        </section>

        {/* --- 5. CONNECTED SUPPLY CHAIN --- */}
        <section style={{ width: '100%', marginBottom: '6rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '3rem' }}>One Connected Supply Chain</h3>
          
          <div style={{ background: 'var(--surface)', padding: '3rem 2rem', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--dashboard-heading)', marginBottom: '2.5rem', minWidth: '600px', gap: '1rem' }}>
              <span>RETAIL SHOP</span>
              <span style={{ color: 'var(--primary)', opacity: 0.5 }}>→</span>
              <span>DEALER</span>
              <span style={{ color: 'var(--primary)', opacity: 0.5 }}>→</span>
              <span>MANUFACTURER</span>
              <span style={{ color: 'var(--primary)', opacity: 0.5 }}>→</span>
              <span>TRANSPORTER</span>
              <span style={{ color: 'var(--primary)', opacity: 0.5 }}>→</span>
              <span>DELIVERY / RECEIVING</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--muted)', minWidth: '800px', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span>ORDER</span> <span>→</span>
              <span>INVENTORY</span> <span>→</span>
              <span>PRODUCTION</span> <span>→</span>
              <span>WAYBILL</span> <span>→</span>
              <span>TRANSPORT</span> <span>→</span>
              <span>GPS</span> <span>→</span>
              <span>RECEIVING</span> <span>→</span>
              <span>LEDGER</span> <span>→</span>
              <span>AUDIT</span>
            </div>
          </div>
        </section>

        {/* --- 6. ROLE SECTION --- */}
        <section style={{ width: '100%', marginBottom: '6rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--dashboard-heading)' }}>Built for Every Supply Chain Role</h2>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1.5rem',
            justifyContent: 'center'
          }}>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--manufacturer)', fontSize: '1.1rem' }}>MANUFACTURER</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Manage production, demand, raw materials, quality and supplier operations.</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--transporter)', fontSize: '1.1rem' }}>TRANSPORTER</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Manage vehicles, GPS tracking, ETA, routes, delays and shipment interventions.</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--dealer)', fontSize: '1.1rem' }}>DEALER</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Manage orders, inventory, receiving, discrepancies, backorders and shipments.</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--retail)', fontSize: '1.1rem' }}>RETAIL SHOP</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Manage sales, inventory, incoming shipments, reorders and QR verification.</p>
            </div>
          </div>
        </section>

        {/* --- 7. TRACEABILITY SECTION --- */}
        <section style={{ width: '100%', marginBottom: '6rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--dashboard-heading)', marginBottom: '3rem' }}>From Business Event to Verified Record</h2>
          
          <div style={{ background: 'var(--surface)', padding: '2.5rem', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', minWidth: '800px' }}>
                <span style={{ fontWeight: 'bold' }}>Order</span>
                <span style={{ color: 'var(--primary)' }}>↓</span>
                <span style={{ fontWeight: 'bold' }}>Waybill</span>
                <span style={{ color: 'var(--primary)' }}>↓</span>
                <span style={{ fontWeight: 'bold' }}>Seal</span>
                <span style={{ color: 'var(--primary)' }}>↓</span>
                <span style={{ fontWeight: 'bold' }}>Dispatch</span>
                <span style={{ color: 'var(--primary)' }}>↓</span>
                <span style={{ fontWeight: 'bold' }}>Custody Transfer</span>
                <span style={{ color: 'var(--primary)' }}>↓</span>
                <span style={{ fontWeight: 'bold' }}>Transport</span>
                <span style={{ color: 'var(--primary)' }}>↓</span>
                <span style={{ fontWeight: 'bold' }}>Receiving</span>
                <span style={{ color: 'var(--primary)' }}>↓</span>
                <span style={{ fontWeight: 'bold' }}>Inventory</span>
                <span style={{ color: 'var(--primary)' }}>↓</span>
                <span style={{ fontWeight: 'bold' }}>Ledger</span>
                <span style={{ color: 'var(--primary)' }}>↓</span>
                <span style={{ fontWeight: 'bold' }}>Audit</span>
             </div>
          </div>
        </section>



      </div>


    </main>
  )
}

export default Homepage
