import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Header from './components/Header.tsx';
import './index.css'
import App from './App.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import VolunteerMatchingDemo from './pages/VolunteerMatching.tsx';
import EventManage from './pages/event_manage.tsx';
import VolunteerHistory from './pages/volunteer_history.tsx';
import { NotificationProvider } from "./components/NotificationProvider.tsx";
import { ToastProvider } from "./components/ToastProvider.tsx";

function Layout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}



const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <App /> },
      { path: "/volunteer-matching", element: <VolunteerMatchingDemo /> },
      { path: "/profile-page", element: <ProfilePage/>},
      { path: "/login", element: <Login />},
      { path: "/register", element: <Register />},
      { path: "/event-manage", element:<EventManage/>},
      { path: "/volunteer-history", element: <VolunteerHistory/>}
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </ToastProvider>
  </StrictMode>
);