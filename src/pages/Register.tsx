import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

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
  const { register } = useAuth();
  const navigate = useNavigate();

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
      const success = await register(form.email, form.password, form.name, form.role as 'volunteer' | 'admin');
      
      if (success) {
        // Redirect based on user role
        if (form.role === 'admin') {
          // Admins go straight to admin dashboard
          navigate('/');
        } else {
          // Volunteers/organizers go to profile page to complete their profile
          navigate('/profile');
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 relative overflow-hidden">
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 left-16 w-28 h-28 bg-white rounded-full"></div>
          <div className="absolute top-16 right-24 w-36 h-36 bg-white rounded-full"></div>
          <div className="absolute bottom-40 left-24 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-16 right-32 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-white rounded-full"></div>
        </div>
        
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Join Our Community
            </h1>
            <p className="text-xl text-orange-100 leading-relaxed mb-6">
              Start your volunteer journey today and connect with meaningful opportunities in your area.
            </p>
          </div>
          
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-orange-100">Match with perfect volunteer opportunities</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-orange-100">Build your volunteer portfolio</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-orange-100">Make lasting community connections</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-orange-100">Flexible scheduling that works for you</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12" style={{ backgroundColor: '#f5efe6' }}>
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Join thousands making a difference in their communities.</p>
          </div>

          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a strong password (min 8 characters)"
                type="password"
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to join as a
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
              >
                <option value="volunteer">Volunteer - Find and join volunteer opportunities</option>
                <option value="organizer">Organizer - Create and manage volunteer events</option>
                <option value="admin">Admin - Platform administration</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
