import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Package, Wrench, Lock, User, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Dept = 'commander' | 'spares' | 'technicians';

const DEPT_CONFIG: Record<Dept, {
  title: string;
  subtitle: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  accentBg: string;
  accentBorder: string;
  accentIcon: string;
  role: string;
  demoUser: string;
  demoPass: string;
  others: { label: string; path: string }[];
}> = {
  commander: {
    title: 'Commander Portal',
    subtitle: 'Fleet Command & Oversight',
    description: 'Sign in to review fleet health, maintenance priorities, and schedule status.',
    icon: Shield,
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentIcon: 'text-blue-600',
    role: 'commander',
    demoUser: 'commander',
    demoPass: 'commander123',
    others: [
      { label: 'Spare Parts Dept', path: '/login/spares' },
      { label: 'Technician Portal', path: '/login/technicians' },
    ],
  },
  spares: {
    title: 'Spare Parts Department',
    subtitle: 'Inventory & Logistics',
    description: 'Sign in to review inventory, component availability, and spare requirements.',
    icon: Package,
    accentBg: 'bg-cyan-50',
    accentBorder: 'border-cyan-200',
    accentIcon: 'text-cyan-600',
    role: 'spares',
    demoUser: 'spares',
    demoPass: 'spares123',
    others: [
      { label: 'Commander Portal', path: '/login/commander' },
      { label: 'Technician Portal', path: '/login/technicians' },
    ],
  },
  technicians: {
    title: 'Technician Portal',
    subtitle: 'Maintenance Workspace',
    description: 'Sign in to review assigned maintenance work and update task progress.',
    icon: Wrench,
    accentBg: 'bg-indigo-50',
    accentBorder: 'border-indigo-200',
    accentIcon: 'text-indigo-600',
    role: 'technician',
    demoUser: 'technician',
    demoPass: 'tech123',
    others: [
      { label: 'Commander Portal', path: '/login/commander' },
      { label: 'Spare Parts Dept', path: '/login/spares' },
    ],
  },
};

const ROLE_REDIRECT: Record<string, string> = {
  commander: '/app/commander',
  spares: '/app/spares-portal',
  technician: '/app/technicians',
  demo: '/app/overview',
};

export const DepartmentLoginPage: React.FC = () => {
  const { department } = useParams<{ department: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dept = DEPT_CONFIG[department as Dept];

  if (!dept) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Department</h1>
          <Link to="/" className="text-sm text-aerospace-600 hover:underline">← Return to Home</Link>
        </div>
      </div>
    );
  }

  const Icon = dept.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const { role } = await login(username.trim(), password);

      // Verify the returned role matches the selected portal
      // demo role gets full access from any portal
      if (role !== 'demo' && role !== dept.role) {
        setError(
          `Access denied. Your account (role: ${role}) does not have access to the ${dept.title}. ` +
          `Please use the correct portal for your role.`
        );
        return;
      }

      const redirectPath = ROLE_REDIRECT[role] || '/app/overview';
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Invalid credentials. Please check your username and password.');
      } else if (status === 429) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else if (err?.code === 'ECONNREFUSED' || err?.code === 'ERR_NETWORK') {
        setError('Unable to reach the server. Please ensure the backend is running.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 aerospace-grid-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-aerospace-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Department header */}
          <div className={`${dept.accentBg} ${dept.accentBorder} border-b px-6 py-6`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${dept.accentBg} border ${dept.accentBorder} flex items-center justify-center shadow-sm`}>
                <Icon className={`w-6 h-6 ${dept.accentIcon}`} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-base font-bold text-aerospace-900">{dept.title}</h1>
                <div className="text-xs text-slate-500">{dept.subtitle}</div>
              </div>
              <div className="ml-auto">
                <div className="w-8 h-8 rounded-lg bg-aerospace-900 flex items-center justify-center overflow-hidden">
                  <img src="/eagle.svg" alt="JATAYU" className="w-7 h-7 object-contain p-0.5" />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">{dept.description}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
            {/* Demo hint */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-[11px] text-amber-800">
              <span className="font-bold">Demo Access:</span>{' '}
              Username: <code className="bg-amber-100 px-1 rounded">{dept.demoUser}</code>{' '}
              Password: <code className="bg-amber-100 px-1 rounded">{dept.demoPass}</code>
            </div>

            {/* Username */}
            <div>
              <label htmlFor={`login-username-${department}`} className="text-xs font-semibold text-slate-700 block mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id={`login-username-${department}`}
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(null); }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-aerospace-600 disabled:opacity-60"
                  placeholder="Enter username"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                  maxLength={128}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor={`login-password-${department}`} className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id={`login-password-${department}`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-aerospace-600 disabled:opacity-60"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={loading}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-aerospace-900 hover:bg-aerospace-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Switch department */}
          <div className="px-6 pb-5 border-t border-slate-100 pt-4">
            <p className="text-[11px] text-slate-400 text-center mb-2">Not the correct portal?</p>
            <div className="flex justify-center gap-3">
              {dept.others.map((other) => (
                <Link
                  key={other.path}
                  to={other.path}
                  className="text-[11px] text-aerospace-600 hover:text-aerospace-800 font-medium hover:underline"
                >
                  {other.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Jatayu AI · Prototype demonstration environment
        </p>
      </div>
    </div>
  );
};
