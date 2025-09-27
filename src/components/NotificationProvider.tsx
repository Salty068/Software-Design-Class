import React, { createContext, useCallback, useContext, useState } from "react";

export type Notice = { id: string; title: string; body?: string; type?: "info"|"success"|"warn"|"error"; timeoutMs?: number };

type Ctx = {
  notify: (n: Omit<Notice,"id">) => void;
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const remove = useCallback((id:string)=>setNotices(xs=>xs.filter(x=>x.id!==id)),[]);
  const clear  = useCallback(()=>setNotices([]),[]);
  const notify = useCallback((n: Omit<Notice,"id">)=>{
    const id = crypto.randomUUID();
    setNotices(xs=>[{ id, timeoutMs: undefined, type:"info", ...n }, ...xs]); // panel: no auto-timeout
  },[]);
  return (
    <C.Provider value={{ notify, remove, clear, notices }}>
      {children}
    </C.Provider>
  );
}
