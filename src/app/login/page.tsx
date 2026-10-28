'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sprout, Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ForestBackground } from '@/components/ForestBackground';
import { MouseTrail } from '@/components/MouseTrail';
import { checkRateLimit } from '@/lib/rateLimit';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic client validation
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    // Client-side rate limiting per email/session attempt
    const rateCheck = checkRateLimit(`login_client_${email.trim().toLowerCase()}`, 5, 60);
    if (!rateCheck.allowed) {
      setErrorMessage(
        `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(email, password, rememberMe);
      if (res.success) {
        window.location.href = redirectPath;
      } else {
        setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card glass-panel">
      {/* Brand Header */}
      <div className="auth-header">
        <div className="auth-brand-badge">
          <Sprout size={28} color="#74c69d" />
        </div>
        <h1 className="auth-title">Welcome to Rootwise</h1>
        <p className="auth-subtitle">Sign in to monitor living soil telemetry and automate irrigation</p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="auth-error-banner" role="alert" aria-live="polite">
          <AlertCircle size={16} className="auth-error-icon" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Email Address */}
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">
            Email address
          </label>
          <div className="form-input-wrapper">
            <Mail size={16} className="input-leading-icon" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="grower@rootwise.local"
              className="form-input with-leading-icon"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <div className="label-row">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
          </div>
          <div className="form-input-wrapper">
            <Lock size={16} className="input-leading-icon" />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="form-input with-leading-icon with-trailing-action"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle-btn"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember me option */}
        <div className="auth-options-row">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="auth-checkbox"
            />
            <span className="checkbox-label">Keep me logged in on this device</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Footer Switcher */}
      <div className="auth-footer-prompt">
        <span>New to Rootwise?</span>{' '}
        <Link
          href={`/signup${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
          className="auth-link"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <MouseTrail />
      <ForestBackground />
      <main className="auth-page-container">
        <Suspense
          fallback={
            <div className="auth-card glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <div className="auth-spinner" />
              <p style={{ color: 'var(--brand-sage)', marginTop: 12 }}>Loading portal...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
