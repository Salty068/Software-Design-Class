
import { Link, NavLink } from "react-router-dom";
import { useNotify, useNotificationCenter } from "./NotificationProvider";
import { useState, useMemo } from "react";
import NotificationPanel from "./NotificationPanel";

export default function Header() {
  const notify = useNotify();
  const { notices } = useNotificationCenter();
  const [open, setOpen] = useState(false);
  const count = notices.length;
  const badge = useMemo(()=> count > 0 ? (
    <span >
      {Math.min(count, 99)}
    </span>
  ) : null, [count]);

  return (
    <>
      <header >
        <div className="space-y-2 flex items-center gap-6">
          <nav className="space-y-2 flex items-center gap-6">
            <NavLink to="/" className={({isActive}) => isActive ? "font-medium" : "opacity-70 hover:opacity-100"}>Home</NavLink>
            <NavLink to="/volunteer-matching" className={({isActive}) => isActive ? "font-medium" : "opacity-70 hover:opacity-100"}>Volunteer Matching</NavLink>
            <NavLink to="/login" className={({isActive}) => isActive ? "font-medium" : "opacity-70 hover:opacity-100"}>Login</NavLink>
            <NavLink to="/register" className={({isActive}) => isActive ? "font-medium" : "opacity-70 hover:opacity-100"}>Register</NavLink>
            <NavLink to="/profile-page" className={({isActive}) => isActive ? "font-medium" : "opacity-70 hover:opacity-100"}>Profile Page</NavLink>
            <NavLink to="/event-manage" className={({isActive}) => isActive ? "font-medium" : "opacity-70 hover:opacity-100"}>Event Manage</NavLink>
            <NavLink to="/volunteer-history" className={({isActive}) => isActive ? "font-medium" : "opacity-70 hover:opacity-100"}>Volunteer History</NavLink>

            <button
              
              onClick={() => setOpen(o => !o)}
              aria-haspopup="dialog" aria-expanded={open}
            >
              🔔
              {badge}
            </button>

            <button
              onClick={() =>
                notify({ title: "New Notification", body: "This is a test!", type: "success" })
              }
            >
              Add Notification
            </button>
          </nav>
        </div>
      </header>

      <NotificationPanel open={open} />
    </>
  );
}
