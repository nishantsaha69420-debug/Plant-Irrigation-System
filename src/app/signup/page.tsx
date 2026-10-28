'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sprout, Eye, EyeOff, Lock, Mail, User, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ForestBackground } from '@/components/ForestBackground';
import { MouseTrail } from '@/components/MouseTrail';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Realtime password checks
  const hasMinLength = password.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Please enter your name or grower handle.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter carefully.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signup(name.trim(), email.trim(), password);
      if (res.success) {
        window.location.href = redirectPath;
      } else {
        setErrorMessage(res.error || 'Failed to create account. Please try again.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during signup.');
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
        <h1 className="auth-title">Create Rootwise Account</h1>
        <p className="auth-subtitle">Set up your smart soil irrigation and greenhouse monitoring profile</p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="auth-error-banner" role="alert" aria-live="polite">
          <AlertCircle size={16} className="auth-error-icon" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="signup-name" className="form-label">
            Your Name / Grower Handle
          </label>
          <div className="form-input-wrapper">
            <User size={16} className="input-leading-icon" />
            <input
              id="signup-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nishant"
              className="form-input with-leading-icon"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="form-group">
          <label htmlFor="signup-email" className="form-label">
            Email address
          </label>
          <div className="form-input-wrapper">
            <Mail size={16} className="input-leading-icon" />
            <input
              id="signup-email"
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
          <label htmlFor="signup-password" className="form-label">
            Password
          </label>
          <div className="form-input-wrapper">
            <Lock size={16} className="input-leading-icon" />
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
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

        {/* Password Requirements Hint */}
        {password.length > 0 && (
          <div className="password-rules-box">
            <div className={`rule-item ${hasMinLength ? 'valid' : ''}`}>
              <CheckCircle2 size={12} />
              <span>At least 8 characters</span>
            </div>
            <div className={`rule-item ${hasNumberOrSymbol ? 'valid' : ''}`}>
              <CheckCircle2 size={12} />
              <span>Contains number or symbol</span>
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="signup-confirm-password" className="form-label">
            Confirm Password
          </label>
          <div className="form-input-wrapper">
            <Lock size={16} className="input-leading-icon" />
            <input
              id="signup-confirm-password"
              name="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="form-input with-leading-icon with-trailing-action"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle-btn"
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {confirmPassword.length > 0 && (
          <div className="password-rules-box">
            <div className={`rule-item ${passwordsMatch ? 'valid' : ''}`}>
              <CheckCircle2 size={12} />
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match yet'}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating your profile...</span>
            </>
          ) : (
            <>
              <span>Create Account & Continue</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Footer Switcher */}
      <div className="auth-footer-prompt">
        <span>Already have an account?</span>{' '}
        <Link
          href={`/login${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
          className="auth-link"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
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
          <SignupForm />
        </Suspense>
      </main>
    </>
  );
}
