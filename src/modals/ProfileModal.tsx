import React from "react";
import { FiX } from "react-icons/fi";
import Profile from "../pages/Profile"; // Adjusted import path

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#021526] text-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#81d4fa] hover:text-[#e1f5fe]"
        >
          <FiX className="w-6 h-6" />
        </button>
        <Profile />
      </div>
    </div>
  );
};

export default ProfileModal;
