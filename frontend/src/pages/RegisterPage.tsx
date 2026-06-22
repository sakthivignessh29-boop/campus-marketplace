import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, ArrowRight, User, Mail, Lock, GraduationCap } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    department: '',
    year: 1,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Clientside college domain check
    const emailLower = formData.email.toLowerCase();
    if (!emailLower.endsWith('.edu') && !emailLower.endsWith('.ac.in') && !emailLower.includes('college') && !emailLower.includes('univ')) {
      setError('Please register with your official college email ending in .edu or .ac.in');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative py-12">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 -z-10"></div>
      
      <div className="w-full max-w-lg glass border border-primary/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white mx-auto shadow-md shadow-primary/20 animate-float">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="font-poppins text-2xl font-bold text-gray-900 mt-4">Join Campus Circulate</h2>
          <p className="text-xs text-gray-500">Sign up using your college email to verify credentials</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 text-xs p-3.5 rounded-xl text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 border border-green-200 text-xs p-3.5 rounded-xl text-center font-semibold">
            Registration successful! Redirecting to login page...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">College Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rollno@college.edu"
                  className="w-full pl-11 pr-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password (min 6 characters)"
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 block">College / University Name</label>
            <div className="relative">
              <GraduationCap className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="e.g. National Institute of Technology"
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Branch / Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full px-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Academic Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                required
              >
                <option value={1}>1st Year (Freshman)</option>
                <option value={2}>2nd Year (Sophomore)</option>
                <option value={3}>3rd Year (Junior)</option>
                <option value={4}>4th Year (Senior)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register Now'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-xs text-center text-gray-500">
          Already verified?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Log In Here
          </Link>
        </p>
      </div>
    </div>
  );
};
