import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useNotify, useNotificationCenter } from "./NotificationProvider";
import { useState, useMemo } from "react";
import NotificationPanel from "./NotificationPanel";

export default function RoleBasedHeader() {
  const { user, isAuthenticated, isAdmin, isVolunteer, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const { notices } = useNotificationCenter();
  const [open, setOpen] = useState(false);
  const count = notices.length;
  
  const badge = useMemo(() => count > 0 ? (
    <span>
      {Math.min(count, 99)}
    </span>
  ) : null, [count]);

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home page after logout
  };

  const getNavigationItems = () => {
    if (isLoading) {
      return [
        { to: "/", label: "Home" }
      ];
    }
    
    if (!isAuthenticated) {
      return [
        { to: "/", label: "Home" },
        { to: "/login", label: "Login" },
        { to: "/register", label: "Register" }
      ];
    }

    if (isAdmin()) {
      return [
        { to: "/", label: "Home" },
        { to: "/admin/users", label: "Manage Users" },
        { to: "/event-manage", label: "Event Management" },
        { to: "/volunteer-matching", label: "Volunteer Matching" },
        { to: "/reports", label: "Reports" }
      ];
    }

    if (isVolunteer()) {
      return [
        { to: "/", label: "Home" },
        { to: "/find-events", label: "Find Events" },
        { to: "/profile-page", label: "My Profile" },
        { to: "/volunteer-history", label: "My History" }
      ];
    }

    return [];
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <header className="w-full">
        <div className="flex items-center justify-between gap-6 py-4 px-6">
          <nav className="flex items-center gap-4 px-5 py-3 rounded-lg bg-gradient-to-r from-gray-50 via-white to-gray-50 shadow-sm">
            {isLoading ? (
              <span className="text-black opacity-70 px-3 py-2">
                Volunteer Management System
              </span>
            ) : (
              navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive
                      ? "text-black font-medium px-3 py-2 rounded-md bg-gradient-to-r from-orange-100 to-orange-50"
                      : "text-black opacity-70 hover:opacity-100 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 whitespace-nowrap"
                  }
                >
                  {item.label}
                </NavLink>
              ))
            )}
          </nav>

          <div className="flex items-center gap-4">
            {isLoading && (
              <span className="text-sm text-gray-600 animate-pulse">
                Verifying authentication...
              </span>
            )}
            
            {!isLoading && isAuthenticated && (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {user?.name}
                  {isAdmin() && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Admin
                    </span>
                  )}
                </span>

                <button
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  onClick={() => setOpen(o => !o)}
                  aria-haspopup="dialog"
                  aria-expanded={open}
                >
                  🔔
                  {badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {Math.min(count, 99)}
                    </span>
                  )}
                </button>

                <button
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}

            {!isLoading && !isAuthenticated && (
              <button
                className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200"
                onClick={() =>
                  notify({ title: "New Notification", body: "This is a test!", type: "success" })
                }
              >
                Add Notification
              </button>
            )}
          </div>
        </div>
      </header>

      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}