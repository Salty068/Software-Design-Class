
import { NavLink } from "react-router-dom";
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
      <header className="w-full">
        <div className="flex items-center justify-between gap-6 py-4 px-6">
          {/* Main Navigation */}
          <nav className="flex items-center gap-4 px-5 py-3 rounded-lg bg-gradient-to-r from-gray-50 via-white to-gray-50 shadow-sm">
            <NavLink to="/" className={({isActive}) => isActive ? "text-black font-medium px-3 py-2 rounded-md bg-gradient-to-r from-orange-100 to-orange-50" : "text-black opacity-70 hover:opacity-100 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 whitespace-nowrap"}>Home</NavLink>
            <NavLink to="/volunteer-matching" className={({isActive}) => isActive ? "text-black font-medium px-3 py-2 rounded-md bg-gradient-to-r from-orange-100 to-orange-50" : "text-black opacity-70 hover:opacity-100 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 whitespace-nowrap"}>Volunteer Matching</NavLink>
            <NavLink to="/login" className={({isActive}) => isActive ? "text-black font-medium px-3 py-2 rounded-md bg-gradient-to-r from-orange-100 to-orange-50" : "text-black opacity-70 hover:opacity-100 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 whitespace-nowrap"}>Login</NavLink>
            <NavLink to="/register" className={({isActive}) => isActive ? "text-black font-medium px-3 py-2 rounded-md bg-gradient-to-r from-orange-100 to-orange-50" : "text-black opacity-70 hover:opacity-100 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 whitespace-nowrap"}>Register</NavLink>
            <NavLink to="/profile-page" className={({isActive}) => isActive ? "text-black font-medium px-3 py-2 rounded-md bg-gradient-to-r from-orange-100 to-orange-50" : "text-black opacity-70 hover:opacity-100 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 whitespace-nowrap"}>Profile Page</NavLink>
            <NavLink to="/event-manage" className={({isActive}) => isActive ? "text-black font-medium px-3 py-2 rounded-md bg-gradient-to-r from-orange-100 to-orange-50" : "text-black opacity-70 hover:opacity-100 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 whitespace-nowrap"}>Event Management</NavLink>
            <NavLink to="/volunteer-history" className={({isActive}) => isActive ? "text-black font-medium px-3 py-2 rounded-md bg-gradient-to-r from-orange-100 to-orange-50" : "text-black opacity-70 hover:opacity-100 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 whitespace-nowrap"}>Volunteer History</NavLink>
          </nav>

          {/* Notification Controls */}
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              onClick={() => setOpen(o => !o)}
              aria-haspopup="dialog" aria-expanded={open}
            >
              🔔
              {badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {Math.min(count, 99)}
                </span>
              )}
            </button>

            <button
              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200"
              onClick={() =>
                notify({ title: "New Notification", body: "This is a test!", type: "success" })
              }
            >
              Add Notification
            </button>
          </div>
        </div>
      </header>

      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
