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





      </div>


    </main>
  )
}

export default Homepage
