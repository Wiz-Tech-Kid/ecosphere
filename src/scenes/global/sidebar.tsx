import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Home, Calculator, BarChart2, 
  Menu as MenuIcon, ChevronLeft, Activity 
} from "lucide-react";

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");

  return (
    <div className={`h-screen bg-gray-800 text-white transition-all duration-300 
      ${isCollapsed ? "w-20" : "w-64"} flex-shrink-0`}>
      <div className="p-4 flex flex-col h-full">
          {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <h1 className="text-xl font-bold truncate">Ecosphere</h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            {isCollapsed ? <MenuIcon /> : <ChevronLeft />}
          </button>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center mb-6">
          <img
            alt="profile"
            className="w-10 h-10 rounded-full mb-2"
            src="/tempsnip.png"
          />
          {!isCollapsed && (
            <p className="text-sm font-medium">Admin</p>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          <Link
            to="/dashboard"
            onClick={() => setSelected("Dashboard")}
            className={`flex items-center p-3 rounded-lg transition-colors
              ${selected === "Dashboard" ? "bg-[#374151] text-[#f9fafb]" : "hover:bg-[#374151] text-[#cbd5e1]"}`}
          >
            <Home className="w-6 h-6 mr-3" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>

          <Link
            to="/calculator"
            onClick={() => setSelected("Calculator")}
            className={`flex items-center p-3 rounded-lg transition-colors
              ${selected === "Calculator" ? "bg-[#374151] text-[#f9fafb]" : "hover:bg-[#374151] text-[#cbd5e1]"}`}
          >
            <Calculator className="w-6 h-6 mr-3" />
            {!isCollapsed && <span>Calculator</span>}
          </Link>

          <Link
            to="/analytics"
            onClick={() => setSelected("Analytics")}
            className={`flex items-center p-3 rounded-lg transition-colors
              ${selected === "Analytics" ? "bg-[#374151] text-[#f9fafb]" : "hover:bg-[#374151] text-[#cbd5e1]"}`}
          >
            <BarChart2 className="w-6 h-6 mr-3" />
            {!isCollapsed && <span>Analytics</span>}
          </Link>

          <Link
            to="/emission_tracker"
            onClick={() => setSelected("emission_tracker")}
            className={`flex items-center p-3 rounded-lg transition-colors
              ${selected === "emission_tracker" ? "bg-[#374151] text-[#f9fafb]" : "hover:bg-[#374151] text-[#cbd5e1]"}`}
          >
            <Activity className="w-6 h-6 mr-3" />
            {!isCollapsed && <span>emission_tracker</span>}
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;