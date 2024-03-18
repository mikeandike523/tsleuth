import { useState, useEffect, useCallback } from 'react';
export default function useWssOpenFileVscode() {
  const [wssUri, setWssUri] = useState<string | null>(null);
  const [wss, setWss] = useState<WebSocket | null>(null);
  const [wssReady, setWssReady] = useState<boolean>(false);

  useEffect(() => {
    if (wssUri === null) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      setWssUri(`${protocol}//${window.location.host}/open-file-vscode`);
    }
  }, [wssUri]);

  useEffect(() => {
    if (wssUri !== null && wss === null) {
      const ws = new WebSocket(wssUri);
      ws.onopen = () => {
        setWssReady(true);
      };
      setWss(ws);
    }
  }, [wssUri]);

  useEffect(() => {
    return () => {
      if (wss) wss.close();
    };
  }, [wss]);

  return useCallback(
    (relpath: string, line: number, column: number) => {
      if (wssUri === null) {
        throw new Error('WSS URI not available');
      }
      if (wss === null) {
        throw new Error('WSS not available');
      }
      if (!wssReady) {
        throw new Error('WSS was not ready');
      }
      wss.send(JSON.stringify({ relpath, line, column }));
    },
    [wssUri, wss, wssReady]
  );
}
