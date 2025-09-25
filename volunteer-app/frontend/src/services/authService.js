const API_BASE = 'http://localhost:5000/api/auth';

export async function registerUser({ name, email, password, role }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await res.json();
  if (res.ok && data.token) localStorage.setItem('token', data.token);
  return data;
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (res.ok && data.token) localStorage.setItem('token', data.token);
  return data;
}
