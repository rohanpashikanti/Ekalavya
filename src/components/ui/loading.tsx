import React from 'react';
import '@dotlottie/player-component';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  };

  return (
    <div className={`fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className={sizeClasses[size]}>
        <dotlottie-player
          src="https://lottie.host/3904c832-4c9a-4f45-aaf3-5e3c4b8c89a3/eCsqTBuBp7.lottie"
          background="transparent"
          speed="1"
          loop
          autoplay
        />
      </div>
    </div>
  );
};

export default Loading; 