import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url, onMessageCallback) {
    const [status, setStatus] = useState('CONNECTING');
    const ws = useRef(null);

    const onMessageCallbackRef = useRef(onMessageCallback);
    useEffect(() => {
        onMessageCallbackRef.current = onMessageCallback;
    }, [onMessageCallback]);

    useEffect(() => {
        let isMounted = true;
        
        function connect() {
            setStatus('CONNECTING');
            try {
                ws.current = new WebSocket(url);
                ws.current.onopen = () => { if (isMounted) setStatus('CONNECTED'); };
                ws.current.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.status === 'CONNECTED') {
                        if (isMounted) setStatus('LIVE');
                        return;
                    }
                    if (onMessageCallbackRef.current) onMessageCallbackRef.current(data);
                };
                ws.current.onclose = () => {
                    if (isMounted) setStatus('DISCONNECTED');
                    setTimeout(() => {
                        if (isMounted) {
                            setStatus('RECONNECTING');
                            connect();
                        }
                    }, 3000);
                };
                ws.current.onerror = (err) => {
                    console.error("WebSocket Error:", err);
                    if (isMounted) setStatus('ERROR');
                };
            } catch (_err) {
                console.error("WebSocket connection error:", _err);
                if (isMounted) setStatus('ERROR');
            }
        }
        
        connect();
        
        return () => {
            isMounted = false;
            if (ws.current) {
                ws.current.onclose = null;
                ws.current.close();
            }
        };
    }, [url]);

    const send = useCallback((message) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(typeof message === 'string' ? message : JSON.stringify(message));
        }
    }, []);

    return { status, send };
}
