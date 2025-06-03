import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface TabSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  remainingAttempts: number;
  onConfirm: () => void;
}

const TabSwitchDialog: React.FC<TabSwitchDialogProps> = ({
  isOpen,
  onClose,
  remainingAttempts,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-black">Warning: Tab Switch Detected</DialogTitle>
          <DialogDescription className="text-black">
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-black">
                You have switched tabs/windows. This is not allowed during the exam.
                {remainingAttempts > 0 ? (
                  <p className="mt-2 text-black">
                    You have {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.
                    After {remainingAttempts} more {remainingAttempts === 1 ? 'switch' : 'switches'}, your exam will be automatically submitted.
                  </p>
                ) : (
                  <p className="mt-2 font-bold text-black">
                    This was your last attempt. Your exam will be submitted now.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Return to Exam
          </Button>
          {remainingAttempts === 0 && (
            <Button variant="destructive" onClick={onConfirm}>
              Submit Exam
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TabSwitchDialog; 