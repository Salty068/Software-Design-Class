import React from 'react';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';

function App() {
  return (
    <div>
      <Navbar />
      <div style={{ display: 'flex', gap: '16px', padding: '12px', flexWrap: 'wrap' }}>
        <Register />
        <Login />
      </div>
    </div>
  );
}

export default App;
