import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({ isOpen, onClose, email }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const { sendVerificationEmail, checkEmailVerification } = useAuth();
  const navigate = useNavigate();

  // Check verification status periodically
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(checkVerificationStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const checkVerificationStatus = async () => {
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        setIsVerified(true);
        setTimeout(() => {
          onClose();
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const { error } = await sendVerificationEmail();
      if (error) {
        setError(error);
      } else {
        setSuccess(true);
        setError('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifiedClick = async () => {
    setLoading(true);
    setError('');
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        setIsVerified(true);
        setTimeout(() => {
          onClose();
          navigate('/login');
        }, 2000);
      } else {
        setError('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check verification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl">Email Verified!</DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Your email has been successfully verified
            </DialogDescription>
          </DialogHeader>
          <p className="text-gray-300 text-center">
            Redirecting to login...
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">Verify Your Email</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Please check your email for a verification link
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-500 bg-green-500/10">
            <AlertDescription className="text-green-400">
              Verification email sent! Please check your inbox.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <p className="text-gray-300 text-center">
            We've sent a verification email to {email}. Please click the link in the email to verify your account.
          </p>
          
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleResendVerification}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </Button>

            <Button
              onClick={handleVerifiedClick}
              variant="outline"
              className="w-full border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              I've Verified My Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog; 