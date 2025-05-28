import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EndTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  attemptedQuestions: number;
  totalQuestions: number;
}

const EndTestDialog: React.FC<EndTestDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  attemptedQuestions,
  totalQuestions,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End Test?</DialogTitle>
          <DialogDescription>
            You have attempted {attemptedQuestions} out of {totalQuestions} questions.
            {attemptedQuestions < totalQuestions && (
              <p className="text-yellow-500 mt-2">
                You still have {totalQuestions - attemptedQuestions} questions left to attempt.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Continue Test
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            End Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndTestDialog; 