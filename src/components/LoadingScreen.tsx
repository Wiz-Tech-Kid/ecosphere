import React from "react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-[#213448] text-white">
      <div className="text-center">
        <div className="loader mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
