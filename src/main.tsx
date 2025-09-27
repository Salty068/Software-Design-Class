import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Outlet, Link } from "react-router-dom";
import Header from './components/Header.tsx';
import './index.css'
import App from './App.tsx'
import ProfilePage from './ProfilePage'
import VolunteerMatchingDemo from './components/VolunteerMatching.tsx';
import { NotificationProvider } from "./components/NotificationProvider.tsx";

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
      { path: "/profile-page", element: <ProfilePage/>}
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  </StrictMode>
);
