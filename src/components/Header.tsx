
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
        <div >
          <Link to="/" >Volunteer App</Link>
          <nav >
            <NavLink to="/" className={({isActive}) => isActive ? "font-medium" : "opacity-70 hover:opacity-100"}>Home</NavLink>
            <NavLink to="/volunteer-matching" className={({isActive}) => isActive ? "font-medium" : "opacity-70 hover:opacity-100"}>Volunteer Matching</NavLink>

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
