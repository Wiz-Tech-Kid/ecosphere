import React from "react";
import { Bell, Settings, User } from "lucide-react";

const Topbar: React.FC = () => {
  return (
    <header className="w-full bg-[#213448] text-white p-4 shadow-md flex items-center justify-between">
      <h1 className="text-xl font-bold">GREEN-LOOP</h1>
      <nav className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-700 rounded">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
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
