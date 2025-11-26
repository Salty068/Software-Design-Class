import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import RoleBasedHeader from './components/RoleBasedHeader.tsx';
import './index.css'
import App from './App.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import FindEvents from './pages/FindEvents.tsx';
import VolunteerMatching from './pages/VolunteerMatching.tsx';
import EventManage from './pages/event_manage.tsx';
import VolunteerHistory from './pages/volunteer_history.tsx';
import ManageUsers from './pages/ManageUsers.tsx';
import Reports from './pages/Reports.tsx';
import { NotificationProvider } from "./components/NotificationProvider.tsx";
import { ToastProvider } from "./components/ToastProvider.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";

function LayoutContent() {


  return (
    <>
      <RoleBasedHeader />
      <Outlet />
    </>
  );
}

function Layout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <LayoutContent />
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  );
}



const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <App /> },
      { path: "/find-events", element: <FindEvents /> },
      { path: "/volunteer-matching", element: <VolunteerMatching /> },
      { path: "/profile-page", element: <ProfilePage/>},
      { path: "/profile", element: <ProfilePage/>},
      { path: "/login", element: <Login />},
      { path: "/register", element: <Register />},
      { path: "/event-manage", element:<EventManage/>},
      { path: "/volunteer-history", element: <VolunteerHistory/>},
      { path: "/admin/users", element: <ManageUsers/>},
      { path: "/reports", element: <Reports/>}
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);