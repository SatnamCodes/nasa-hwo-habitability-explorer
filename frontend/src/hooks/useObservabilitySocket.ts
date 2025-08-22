import { useEffect, useRef, useState } from 'react';

export interface ObservabilityMessage {
  telescope_diameter_m?: number;
  wavelength_band?: string;
  inner_working_angle_mas?: number;
  timestamp?: string;
}

export function useObservabilitySocket() {
  const [lastMessage, setLastMessage] = useState<ObservabilityMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const path = `/api/v1/observability/ws/params`;
    const url = `${protocol}://${host}${path}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          setLastMessage(data);
        } catch (e) {
          console.error('Invalid WS data', e);
        }
      };
      ws.onopen = () => {
        console.debug('Observability WS open');
      };
      ws.onclose = () => {
        console.debug('Observability WS closed');
      };
      ws.onerror = (e) => console.error('Observability WS error', e);
    } catch (e) {
      console.error('Failed to open WS', e);
    }

    return () => {
      try {
        wsRef.current && wsRef.current.close();
      } catch (e) {
        /* no-op */
      }
    };
  }, []);

  return { lastMessage };
}
