import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

type Role = 'volunteer' | 'organizer' | 'admin';
type RegisterForm = { name: string; email: string; password: string; role: Role };

export default function Register() {
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    role: 'volunteer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: form.email, 
          password: form.password 
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Registration successful! You can now login.');
        console.log('User registered:', data.data.userId);
        setForm({ name: '', email: '', password: '', role: 'volunteer' });
      } else {
        setError(data.errors?.join(', ') || data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '16px auto', padding: 12 }}>
      <h2>Register</h2>
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
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        type="text"
        required
        style={{ width: '100%', padding: 8, margin: '6px 0' }}
      />
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
        placeholder="Password (min 8 characters)"
        type="password"
        required
        minLength={8}
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
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
