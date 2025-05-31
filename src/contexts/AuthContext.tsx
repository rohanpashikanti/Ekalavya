import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  reload,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';
import { saveUserData } from '@/lib/userData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<{ error: string | null }>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  sendVerificationEmail: () => Promise<{ error: string | null }>;
  checkEmailVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Initialize user data
      const initialUserData = {
        totalQuizzes: 0,
        totalScore: 0,
        avgScore: 0,
        avgTime: 0,
        bestScore: 0,
        currentStreak: 0,
        bestStreak: 0,
        accuracy: 0,
        username: email.split('@')[0],
        lastQuizDate: '',
        weeklyProgress: {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false
        },
        quizHistory: []
      };
      saveUserData(user.uid, initialUserData);

      // Send verification email
      await sendEmailVerification(user, {
        url: window.location.origin + '/login',
        handleCodeInApp: true
      });
      return { error: null };
    } catch (error: any) {
      console.error('Registration error:', error);
      // Handle specific Firebase error codes
      switch (error.code) {
        case 'auth/email-already-in-use':
          return { error: 'This email is already registered' };
        case 'auth/invalid-email':
          return { error: 'Invalid email address' };
        case 'auth/operation-not-allowed':
          return { error: 'Email/password accounts are not enabled' };
        case 'auth/weak-password':
          return { error: 'Password is too weak' };
        default:
          return { error: error.message || 'Failed to register. Please try again.' };
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // First, try to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Force reload the user to get the latest verification status
      await user.reload();
      
      if (!user.emailVerified) {
        // Send verification email if not verified
        await sendEmailVerification(user, {
          url: window.location.origin + '/login',
          handleCodeInApp: true
        });
        return { error: 'Please verify your email. A new verification email has been sent.' };
      }

      // If we get here, the user is verified and logged in
      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      // Handle specific Firebase error codes
      switch (error.code) {
        case 'auth/invalid-email':
          return { error: 'Invalid email address' };
        case 'auth/user-disabled':
          return { error: 'This account has been disabled' };
        case 'auth/user-not-found':
          return { error: 'No account found with this email' };
        case 'auth/wrong-password':
          return { error: 'Incorrect password' };
        case 'auth/too-many-requests':
          return { error: 'Too many failed attempts. Please try again later' };
        case 'auth/invalid-credential':
          // Try to handle invalid credential by attempting to re-authenticate
          try {
            const user = auth.currentUser;
            if (user) {
              await user.reload();
              return { error: null };
            }
            return { error: 'Invalid credentials. Please try again.' };
          } catch (reloadError) {
            return { error: 'Invalid credentials. Please try again.' };
          }
        default:
          return { error: error.message || 'Failed to login. Please try again.' };
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error: any) {
      console.error('Password reset error:', error);
      switch (error.code) {
        case 'auth/invalid-email':
          return { error: 'Invalid email address' };
        case 'auth/user-not-found':
          return { error: 'No account found with this email' };
        default:
          return { error: error.message || 'Failed to send password reset email. Please try again.' };
      }
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (!user) {
        console.error('No user found');
        return { error: 'No user found' };
      }

      if (user.emailVerified) {
        console.log('Email already verified');
        return { error: 'Email already verified' };
      }

      await sendEmailVerification(user, {
        url: window.location.origin + '/login',
        handleCodeInApp: true
      });
      return { error: null };
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      return { error: error.message || 'Failed to send verification email. Please try again.' };
    }
  };

  const checkEmailVerification = async () => {
    try {
      if (!user) {
        console.error('No user found');
        return false;
      }

      // Reload user to get latest email verification status
      await user.reload();
      return user.emailVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    signOut,
    resetPassword,
    sendVerificationEmail,
    checkEmailVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
