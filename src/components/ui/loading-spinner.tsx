import React from 'react';
import '@dotlottie/player-component';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-[300px] h-[300px]">
        <dotlottie-player
          src="https://lottie.host/1f08fbc2-75d8-4660-8d9f-7e8ffdb91acf/pDJ0uMRJIu.lottie"
          background="transparent"
          speed="1"
          style={{ width: '300px', height: '300px' }}
          loop
          autoplay
        />
      </div>
    </div>
  );
};

export default LoadingSpinner; 