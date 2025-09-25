import React, { useState } from 'react';
import { loginUser } from '../services/authService';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const data = await loginUser(form);
    setLoading(false);
    if (data.token) {
      alert('Logged in!');
      console.log(data);
    } else {
      alert(data.msg || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '16px auto', padding: 12 }}>
      <h2>Login</h2>
      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        type="email"
        required
        style={{ width: '100%', padding: 8, margin: '6px 0' }}
      />
      <input
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Password"
        type="password"
        required
        style={{ width: '100%', padding: 8, margin: '6px 0' }}
      />
      <button type="submit" style={{ width: '100%', padding: 10 }}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
