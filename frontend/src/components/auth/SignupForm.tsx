import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card, CardBody, CardHeader } from '../common/Card';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

export const SignupForm: React.FC = () => {
  console.log('[SignupForm] Component mounted');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [verificationToken, setVerificationToken] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SignupForm] Submitting signup form', { email: formData.email, name: formData.name });
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.signup(formData);
      console.log('[SignupForm] Signup successful', { userId: response.userId });
      setVerificationToken(response.verificationToken);
      setShowVerification(true);
    } catch (err: any) {
      console.error('[SignupForm] Signup failed', err);
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.verify({ token: verificationToken });
      await login(response.userId);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Check your email for a verification code. For demo purposes, the code is displayed below.
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Demo verification token:
                </p>
                <code className="block mt-2 text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                  {verificationToken}
                </code>
              </div>

              <Input
                id="token"
                type="text"
                label="Verification Code"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                required
                placeholder="Enter verification code"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Verify Email
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sign Up for DawgPound
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join your university community
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg"
                role="alert"
              >
                {error}
              </div>
            )}

            <Input
              id="name"
              type="text"
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Jane Doe"
            />

            <Input
              id="email"
              type="email"
              label="University Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="jane@university.edu"
              helperText="Use your university email address"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Sign Up
            </Button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Log in
              </Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
