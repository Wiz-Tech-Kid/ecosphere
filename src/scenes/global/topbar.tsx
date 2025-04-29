import React, { useState } from "react";
import { Bell, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SettingsModal from "../modals/SettingsModal"; // Fixed import path
import ProfileModal from "../../modals/ProfileModal"; // Updated import path

const Topbar: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="w-full bg-[#213448] text-white p-4 shadow-md flex items-center justify-between">
      <h1 className="text-xl font-bold">GREEN-LOOP</h1>
      <nav className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-700 rounded">
          <Bell className="w-5 h-5" />
        </button>
        <button
          className="p-2 hover:bg-gray-700 rounded"
          onClick={() => setIsSettingsOpen(true)} // Open Settings Modal
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          className="p-2 hover:bg-gray-700 rounded"
          onClick={() => setIsProfileOpen(true)} // Open Profile Modal
        >
          <User className="w-5 h-5" />
        </button>
      </nav>

      {/* Modals */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {isProfileOpen && (
        <ProfileModal
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </header>
  );
};

export default Topbar;
