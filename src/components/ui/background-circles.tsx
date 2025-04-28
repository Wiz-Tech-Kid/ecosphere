import React from "react";
import { motion } from "framer-motion";

const BackgroundCircles: React.FC = () => {
  return (
    <div className="absolute inset-0 flex justify-center items-center">
      <motion.div
        className="absolute border border-blue-500 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0.1, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
        }}
        style={{ width: 300, height: 300 }}
      />
      <motion.div
        className="absolute border border-blue-300 rounded-full"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: "easeInOut",
        }}
        style={{ width: 500, height: 500 }}
      />
    </div>
  );
};

export default BackgroundCircles;
