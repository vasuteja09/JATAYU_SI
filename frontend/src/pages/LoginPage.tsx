import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { api, setAuthToken } from '../services/api';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.login(username.trim(), password);
      setAuthToken(result.access_token);
      onLogin(result.username);
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 aerospace-grid-bg">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Navy Header */}
        <div className="bg-aerospace-900 p-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-md overflow-hidden border border-white/20">
            <img src="/eagle.svg" alt="Jatayu Eagle" className="w-full h-full object-contain p-1" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Jatayu</h1>
          <div className="text-xs text-sky-300 font-medium"> Jatayu AI</div>
          <p className="text-[11px] text-slate-300 mt-1">
            Predictive Maintenance &amp; Fleet Availability Intelligence
          </p>
        </div>

        {/* Demo Notice */}
        <div className="bg-sky-50 px-6 py-2.5 border-b border-sky-100 flex items-center justify-between text-xs text-sky-900 font-medium">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span>Prototype Demonstration Environment</span>
          </div>
          <span className="font-mono text-[10px] bg-sky-200 text-sky-900 px-1.5 py-0.5 rounded font-bold">
            DEMO
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <label htmlFor="login-username" className="text-xs font-semibold text-slate-700 block mb-1">
              User Identifier
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="login-username"
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

          <div>
            <label htmlFor="login-password" className="text-xs font-semibold text-slate-700 block mb-1">
              Access Passcode
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-aerospace-600 disabled:opacity-60"
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
                maxLength={128}
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Demo hint */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600">
            <span className="font-bold text-slate-800">Quick Demo Access:</span>{' '}
            Username: <code className="bg-slate-200 px-1 rounded">demo</code> | Password:{' '}
            <code className="bg-slate-200 px-1 rounded">demo</code>
          </div>

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
                <span>Access Command Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400">
          Team TrackForce
        </div>
      </div>
    </div>
  );
};
