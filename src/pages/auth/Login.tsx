import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Loading from '@/components/ui/loading';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: loginError } = await login(email, password);
      if (loginError) {
        // Handle specific error cases
        if (loginError.includes('email')) {
          setError('Invalid email address');
        } else if (loginError.includes('password')) {
          setError('Invalid password');
        } else if (loginError.includes('verify')) {
          setError('Please verify your email before logging in');
        } else if (loginError.includes('Invalid credentials')) {
          setError('Invalid credentials. Please try again.');
          setPassword('');
        } else {
          setError(loginError);
        }
      } else {
        // Add a minimum loading time of 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1EC] flex items-center justify-center p-4">
      {loading && <Loading />}
      <Card className="w-full max-w-md bg-white border-[#E1DDFC] rounded-2xl">
        <CardHeader className="text-center">
          <img 
            src="https://res.cloudinary.com/dcoijn5mh/image/upload/v1748758164/ChatGPT_Image_Jun_1_2025_11_38_47_AM_ua430e.png"
            alt="Ekalavya Logo"
            className="w-16 h-16 mx-auto mb-4"
          />
          <CardTitle className="text-[#000000] text-2xl font-bold">Welcome to Ekalavya</CardTitle>
          <CardDescription className="text-[#5C5C5C]">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertDescription className="text-red-500">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#5C5C5C]" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white border-[#E1DDFC] text-[#000000] placeholder-[#5C5C5C] focus:border-[#B6EADA]"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#5C5C5C]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white border-[#E1DDFC] text-[#000000] placeholder-[#5C5C5C] focus:border-[#B6EADA]"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#5C5C5C] hover:text-[#000000]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#B6EADA] to-[#F6C6EA] hover:from-[#A0E9CE] hover:to-[#F9D3F3] text-[#000000] font-semibold rounded-xl shadow-none border-none"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <Link
              to="/forgot-password"
              className="text-sm text-[#7C6FF6] hover:text-[#5C5C5C] transition-colors"
            >
              Forgot your password?
            </Link>
            <p className="text-sm text-[#5C5C5C]">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-[#7C6FF6] hover:text-[#5C5C5C] transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
