import React, { useState } from 'react';
import { registerUser } from '../services/authService';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'volunteer' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const data = await registerUser(form);
    setLoading(false);
    if (data.token) {
      alert('Registered and logged in!');
      console.log(data);
    } else {
      alert(data.msg || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '16px auto', padding: 12 }}>
      <h2>Register</h2>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        required
        style={{ width: '100%', padding: 8, margin: '6px 0' }}
      />
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
      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        style={{ width: '100%', padding: 8, margin: '6px 0' }}
      >
        <option value="volunteer">Volunteer</option>
        <option value="organizer">Organizer</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" style={{ width: '100%', padding: 10 }}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
