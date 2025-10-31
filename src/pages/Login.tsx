import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

type LoginForm = { email: string; password: string };

export default function Login() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: form.email, 
          password: form.password 
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Logged in successfully!');
        console.log('User:', data.data.userId);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '16px auto', padding: 12 }}>
      <h2>Login</h2>
      {error && (
        <div style={{ 
          padding: '8px 12px', 
          marginBottom: '12px', 
          backgroundColor: '#fee', 
          color: '#c33', 
          borderRadius: '4px',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}
      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email or User ID"
        type="text"
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
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}