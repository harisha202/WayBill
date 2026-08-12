import { useState, useEffect, useRef } from 'react';

function resolveWsUrl(path) {
    if (path.startsWith('ws://') || path.startsWith('wss://')) {
        return path;
    }
    const isSecure = window.location.protocol === 'https:';
    const wsProtocol = isSecure ? 'wss:' : 'ws:';
    // If local dev environment, point directly to FastAPI backend on 8000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `${wsProtocol}//127.0.0.1:8000${path.startsWith('/') ? path : '/' + path}`;
    }
    // Production / Vercel / Heroku fallback
    return `${wsProtocol}//${window.location.host}${path.startsWith('/') ? path : '/' + path}`;
}

export function useWebSocket(urlPath) {
    const url = resolveWsUrl(urlPath);
    const [state, setState] = useState({
        status: 'CONNECTING',
        lastMessage: null,
        error: null
    });
    const ws = useRef(null);

    useEffect(() => {
        let reconnectTimeout;
        
        const connect = () => {
            console.log("Connecting WebSocket to:", url);
            ws.current = new WebSocket(url);
            
            ws.current.onopen = () => {
                setState(s => ({ ...s, status: 'CONNECTED', error: null }));
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setState(s => ({ ...s, lastMessage: data }));
                } catch (e) {
                    console.error('Failed to parse WebSocket message', e);
                }
            };

            ws.current.onclose = (event) => {
                setState(s => ({ ...s, status: 'DISCONNECTED' }));
                reconnectTimeout = setTimeout(() => {
                    setState(s => ({ ...s, status: 'RECONNECTING' }));
                    connect();
                }, 3000);
            };

            ws.current.onerror = (error) => {
                setState(s => ({ ...s, status: 'SERVER_ERROR', error: 'WebSocket error occurred' }));
            };
        };

        connect();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            clearTimeout(reconnectTimeout);
        };
    }, [url]);

    const sendMessage = (message) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        }
    };

    return { ...state, sendMessage };
}
