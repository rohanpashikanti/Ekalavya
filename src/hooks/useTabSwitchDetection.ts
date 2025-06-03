import { useState, useEffect } from 'react';

interface UseTabSwitchDetectionProps {
  onMaxAttemptsReached: () => void;
  maxAttempts?: number;
}

const useTabSwitchDetection = ({ onMaxAttemptsReached, maxAttempts = 3 }: UseTabSwitchDetectionProps) => {
  const [remainingAttempts, setRemainingAttempts] = useState(maxAttempts);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setRemainingAttempts(prev => {
          const newAttempts = prev - 1;
          if (newAttempts <= 0) {
            onMaxAttemptsReached();
          }
          setShowDialog(true);
          return newAttempts;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onMaxAttemptsReached]);

  const closeDialog = () => {
    setShowDialog(false);
  };

  return {
    remainingAttempts,
    showDialog,
    closeDialog,
  };
};

export default useTabSwitchDetection; 