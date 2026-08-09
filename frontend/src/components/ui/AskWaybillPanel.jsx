
import React, { useState } from 'react';
export const AskWaybillPanel = () => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button 
                onClick={() => setOpen(!open)}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    width: '50px', height: '50px', borderRadius: '25px',
                    background: '#0B1B2E', color: 'white', border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 9998
                }}
            >
                AI
            </button>
            {open && (
                <div style={{
                    position: 'fixed', bottom: '84px', right: '24px',
                    width: '320px', height: '400px', background: 'white',
                    borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    display: 'flex', flexDirection: 'column', zIndex: 9998,
                    border: '1px solid #d9e2ef'
                }}>
                    <div style={{padding: '12px', background: '#0B1B2E', color: 'white', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', fontWeight: 'bold'}}>
                        Ask Waybill
                    </div>
                    <div style={{flex: 1, padding: '12px', overflowY: 'auto', fontSize: '14px', color: '#0F6E56'}}>
                        How can I help you today?
                    </div>
                    <div style={{padding: '12px', borderTop: '1px solid #d9e2ef'}}>
                        <input type="text" placeholder="Type a message..." style={{
                            width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9e2ef'
                        }} />
                    </div>
                </div>
            )}
        </>
    );
};
