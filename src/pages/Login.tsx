import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

type LoginForm = { email: string; password: string };

export default function Login() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const data = { token: '1212414214' };
    setLoading(false);
    if (data.token) {
      alert('Logged in!');
      console.log(data);
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
