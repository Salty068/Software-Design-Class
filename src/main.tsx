import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";
import './index.css'
import App from './App.tsx'

const router = createBrowserRouter([
    { path: "/", element: <App /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <nav className="p-4 space-x-4">
      <Link to="/">Home</Link><Link to="/">About</Link>
    </nav>
    <RouterProvider router={router} />
  </StrictMode>
);
