import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar: string;
  onAvatarChange: (avatarUrl: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatar, onAvatarChange }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Here you would typically upload the file to your storage service
    // For now, we'll use a local URL
    const imageUrl = URL.createObjectURL(file);
    onAvatarChange(imageUrl);
  };

  return (
    <div 
      className="relative w-32 h-32 rounded-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentAvatar ? (
        <img 
          src={currentAvatar} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-[#B6EADA] to-[#F6C6EA] flex items-center justify-center text-2xl text-[#5C5C5C]">
          R
        </div>
      )}
      
      <label 
        className={`absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Camera className="w-8 h-8 text-white" />
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default AvatarUpload; 