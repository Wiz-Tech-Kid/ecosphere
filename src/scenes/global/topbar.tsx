import React from "react";
import { Bell, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Topbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-[#213448] text-white p-4 shadow-md flex items-center justify-between">
      <h1 className="text-xl font-bold">GREEN-LOOP</h1>
      <nav className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-700 rounded">
          <Bell className="w-5 h-5" />
        </button>
        <button
          className="p-2 hover:bg-gray-700 rounded"
          onClick={() => navigate("/settings")} // Navigate to Settings Page
        >
          <Settings className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <User className="w-5 h-5" />
        </button>
      </nav>
    </header>
  );
};

export default Topbar;
