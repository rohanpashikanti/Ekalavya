import React from 'react';
import '@dotlottie/player-component';

interface GeneratingQuestionsProps {
  className?: string;
}

const GeneratingQuestions: React.FC<GeneratingQuestionsProps> = ({ className = '' }) => {
  return (
    <div className={`fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 ${className}`}>
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
      <p className="text-[#000000] text-lg font-medium mt-4">Generating questions...</p>
    </div>
  );
};

export default GeneratingQuestions; 