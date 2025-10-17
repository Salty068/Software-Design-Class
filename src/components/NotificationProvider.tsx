import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type Notice = { id: string; title: string; body?: string; type?: "info"|"success"|"warn"|"error"; timeoutMs?: number };

type Ctx = {
  notify: (n: Omit<Notice,"id">) => void;      // client-made notices
  ingest: (n: Notice) => void;                  // server-sent notices (SSE/API)
  remove: (id: string) => void;
  clear: () => void;
  notices: Notice[];
};
const C = createContext<Ctx | null>(null);

export function useNotify() {
  const c = useContext(C); if (!c) throw new Error("Wrap in <NotificationProvider/>"); return c.notify;
}
export function useNotificationCenter() {
  const c = useContext(C); if (!c) throw new Error("Wrap in <NotificationProvider/>"); return c;
}

/** Open an SSE stream for a volunteer and pipe notices into the provider. */
export function useServerNotifications(volunteerId?: string) {
  const { ingest } = useNotificationCenter();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!volunteerId) return;
    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    const es = new EventSource(`/api/notifications/stream/${encodeURIComponent(volunteerId)}`);
    es.addEventListener("notice", (ev: MessageEvent) => {
      try { ingest(JSON.parse(ev.data)); } catch {}
    });
    es.onerror = () => { /* keep alive or reconnect as needed */ };

    esRef.current = es;
    return () => { es.close(); esRef.current = null; };
  }, [volunteerId, ingest]);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);

  const remove = useCallback((id:string)=>setNotices(xs=>xs.filter(x=>x.id!==id)),[]);
  const clear  = useCallback(()=>setNotices([]),[]);
  const notify = useCallback((n: Omit<Notice,"id">)=>{
    const id = crypto.randomUUID();
    setNotices(xs=>[{ id, timeoutMs: undefined, type:"info", ...n }, ...xs]);
  },[]);
  const ingest = useCallback((n: Notice)=>{
    setNotices(xs => xs.some(x => x.id === n.id) ? xs : [n, ...xs]);
  },[]);

  return (
    <C.Provider value={{ notify, ingest, remove, clear, notices }}>
      {children}
    </C.Provider>
  );
}
