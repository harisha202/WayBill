
import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../api/axiosInstance';


export const AskWaybillPanel = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'assistant', text: 'How can I help you today?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Note: chatStream uses a manual fetch to handle the stream instead of axios
            const response = await fetch(`http://localhost:8000/api/ai/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMsg, context_data: {} })
            });

            if (!response.ok) throw new Error("Network response was not ok");
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let assistantText = '';
            
            setMessages(prev => [...prev, { role: 'assistant', text: '' }]);
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        assistantText += line.replace('data: ', '');
                        setMessages(prev => {
                            const newMsgs = [...prev];
                            newMsgs[newMsgs.length - 1].text = assistantText;
                            return newMsgs;
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', text: 'Error connecting to AI assistant.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setOpen(!open)}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    width: '60px', height: '60px', borderRadius: '30px',
                    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: 'white', border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer', zIndex: 9998,
                    fontSize: '24px'
                }}
            >
                💬
            </button>
            {open && (
                <div style={{
                    position: 'fixed', bottom: '90px', right: '24px',
                    width: '350px', height: '500px', background: 'white',
                    borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', zIndex: 9998,
                    border: '1px solid #e2e8f0', overflow: 'hidden'
                }}>
                    <div style={{padding: '16px', background: '#1e3a8a', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between'}}>
                        <span>Ask WayBill AI</span>
                        <button onClick={() => setOpen(false)} style={{background: 'transparent', border: 'none', color: 'white', cursor: 'pointer'}}>✖</button>
                    </div>
                    <div style={{flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc'}}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                background: m.role === 'user' ? '#3b82f6' : '#e2e8f0',
                                color: m.role === 'user' ? 'white' : '#0f172a',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                maxWidth: '85%',
                                fontSize: '14px',
                                lineHeight: '1.4'
                            }}>
                                {m.text}
                            </div>
                        ))}
                        {loading && <div style={{ fontSize: '12px', color: '#64748b' }}>AI is thinking...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    <div style={{padding: '12px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: '8px'}}>
                        <input 
                            type="text" 
                            placeholder="Ask about shipments, risks, or stock..." 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={loading}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none'
                            }} 
                        />
                        <button 
                            onClick={handleSend} 
                            disabled={loading || !input.trim()}
                            style={{
                                padding: '0 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
