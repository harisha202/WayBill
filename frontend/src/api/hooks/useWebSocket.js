import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url, onMessageCallback) {
    const [status, setStatus] = useState('CONNECTING');
    const ws = useRef(null);

    const connect = useCallback(() => {
        setStatus('CONNECTING');
        try {
            ws.current = new WebSocket(url);
            
            ws.current.onopen = () => {
                setStatus('CONNECTED');
            };
            
            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                // First event might be {"status": "CONNECTED"} from the backend manager
                if (data.status === 'CONNECTED') {
                    setStatus('LIVE');
                    return;
                }
                
                if (onMessageCallback) {
                    onMessageCallback(data);
                }
            };
            
            ws.current.onclose = () => {
                setStatus('DISCONNECTED');
                // Reconnect logic
                setTimeout(() => {
                    setStatus('RECONNECTING');
                    connect();
                }, 3000);
            };
            
            ws.current.onerror = (err) => {
                console.error("WebSocket Error:", err);
                setStatus('ERROR');
            };
        } catch (e) {
            setStatus('ERROR');
        }
    }, [url, onMessageCallback]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) {
                // Ensure we don't trigger reconnect loop on unmount
                ws.current.onclose = null;
                ws.current.close();
            }
        };
    }, [connect]);

    const send = useCallback((message) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(typeof message === 'string' ? message : JSON.stringify(message));
        }
    }, []);

    return { status, send };
}
