import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData, saveUserData } from '@/lib/userData';
import { updateProfile } from 'firebase/auth';

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onUpdate?: () => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ isOpen, onClose, currentUsername, onUpdate }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState(currentUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Update username in user data
      const userData = getUserData(user.uid);
      const updatedUserData = {
        ...userData,
        username
      };
      saveUserData(user.uid, updatedUserData);

      // Update display name in Firebase
      await updateProfile(user, {
        displayName: username
      });

      onUpdate?.();
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#F6F1EC] border-[#E1DDFC] text-[#000000]">
        <DialogHeader>
          <DialogTitle className="text-[#000000]">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[#5C5C5C]">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white border-[#E1DDFC] text-[#000000] focus:border-[#B6EADA]"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#E1DDFC] text-[#5C5C5C] hover:bg-[rgb(204,220,251)] hover:border-[rgb(204,220,251)] hover:text-[#000000]"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#B6EADA] to-[#F6C6EA] hover:from-[#A0E9CE] hover:to-[#F9D3F3] text-[#000000] font-semibold"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog; 