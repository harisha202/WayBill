import { Logo } from '../../components/ui/Logo'

function Homepage({ onGuestEntry, onLoginClick, onSignupClick, isGuestView = false }) {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Background Glows (Disabled for no animations/cleaner look per request, but kept static if wanted. Removing to be safe and clean) */}
      
      <div style={{ maxWidth: '1000px', width: '100%', padding: '4rem 2rem', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Logo style={{ width: 120, height: 120 }} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 1rem 0', background: 'linear-gradient(to right, #34d399, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            WayBill
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            A unified supply chain network connecting Manufacturers, Transporters, Dealers, and Retailers through secure, immutable blockchain waybills and AI-driven insights.
          </p>
        </div>

        {/* Actions */}
        {!isGuestView ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={onLoginClick}
              style={{ background: '#3b82f6', color: 'white', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: 'none' }}
            >
              Sign In
            </button>
            <button 
              onClick={onSignupClick}
              style={{ background: '#10b981', color: 'white', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: 'none' }}
            >
              Sign Up
            </button>
            <button 
              onClick={onGuestEntry}
              style={{ background: '#475569', color: '#f8fafc', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Explore as Guest
            </button>
          </div>
        ) : (
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>Guest Mode Enabled</h3>
            <p style={{ margin: '0 0 15px 0', color: '#cbd5e1' }}>You are currently exploring the platform with read-only access. Full capabilities require an account.</p>
            <button 
              onClick={onLoginClick}
              style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 2rem', borderRadius: '6px', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Sign In Now
            </button>
          </div>
        )}
        
        {/* Role Cards */}
        <div style={{ marginTop: '5rem', width: '100%' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.75rem', color: '#f8fafc', fontWeight: 700 }}>Built for the Entire Supply Chain</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '2rem', borderTop: '4px solid #10b981' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
              <h3 style={{ fontSize: '1.25rem', color: '#10b981', marginBottom: '0.75rem', margin: 0 }}>Administrator</h3>
              <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>Oversee the complete network, manage N-tier supplier risk, and ensure regulatory compliance globally.</p>
            </div>
            
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '2rem', borderTop: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏭</div>
              <h3 style={{ fontSize: '1.25rem', color: '#3b82f6', marginBottom: '0.75rem', margin: 0 }}>Manufacturer</h3>
              <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>Seal digital waybills, dispatch shipments, and forecast future production demand with AI.</p>
            </div>

            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '2rem', borderTop: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚛</div>
              <h3 style={{ fontSize: '1.25rem', color: '#f59e0b', marginBottom: '0.75rem', margin: 0 }}>Transporter</h3>
              <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>Manage real-time logistics, visualize delay risks, and update custody chain upon handover.</p>
            </div>

            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '2rem', borderTop: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏢</div>
              <h3 style={{ fontSize: '1.25rem', color: '#8b5cf6', marginBottom: '0.75rem', margin: 0 }}>Dealer</h3>
              <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>Receive shipments, verify custody seals, log discrepancies, and route goods to final retailers.</p>
            </div>

          </div>
        </div>

      </div>
    </main>
  )
}

export default Homepage
