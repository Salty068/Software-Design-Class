import { useNotificationCenter } from "./NotificationProvider";

export default function NotificationPanel({ open }: { open: boolean }) {
  const { notices, remove, clear } = useNotificationCenter();
  if (!open) return null;

  return (
    <div
        className="
            fixed right-4 top-16
            w-96 max-w-[95vw]
            z-50 border bg-white
        "
    >
      <div
        className="
            flex items-center justify-between
            p-3 border-b border-orange-500
        "
      >
        <h3>Notifications</h3>
        <div>
          {notices.length > 0 && (
            <button onClick={clear} className="text-sm underline">Clear all</button>
          )}
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="p-6 text-sm opacity-70">No notifications</div>
      ) : (
        <ul className="max-h-96 text-sm opacity-70">
          {notices.map(n => (
            <li key={n.id} className="p-3 flex gap-3">
              <TypeDot t={n.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                <p className="truncate">{n.title}</p>
                  <button onClick={()=>remove(n.id)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">✕</button>
                </div>
                {n.body && <p className="text-sm opacity-80 break-words mt-1">{n.body}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TypeDot({ t }: { t?: "info"|"success"|"warn"|"error" }) {
  const c = t === "success" ? "bg-green-500" : t === "warn" ? "bg-yellow-500" : t === "error" ? "bg-red-500" : "bg-sky-500";
  return <span className={` ${c}`} />;
}
