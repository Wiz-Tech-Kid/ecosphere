import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Calculator,
  BarChart2,
  Menu as MenuIcon,
  ChevronLeft,
  Activity,
  LogOut,
} from "lucide-react";
import supabase from "../../utils/supabaseClient";

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate("/login"); // Redirect to login after logout
    } else {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <div
      className={`h-screen bg-gray-800 text-white transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      } flex-shrink-0`}
    >
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
            className="w-16 h-16 rounded-full mb-2"
            src="/assets/tempsnip.png" // Updated to use the provided image path
          />
          {!isCollapsed && <p className="text-sm font-medium">Admin</p>}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          <Link
            to="/dashboard"
            onClick={() => setSelected("Dashboard")}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              selected === "Dashboard"
                ? "bg-[#374151] text-[#f9fafb]"
                : "hover:bg-[#374151] text-[#cbd5e1]"
            }`}
          >
            <Home className="w-6 h-6 mr-3" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>

          <Link
            to="/calculator"
            onClick={() => setSelected("Calculator")}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              selected === "Calculator"
                ? "bg-[#374151] text-[#f9fafb]"
                : "hover:bg-[#374151] text-[#cbd5e1]"
            }`}
          >
            <Calculator className="w-6 h-6 mr-3" />
            {!isCollapsed && <span>Calculator</span>}
          </Link>

          <Link
            to="/analytics"
            onClick={() => setSelected("Analytics")}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              selected === "Analytics"
                ? "bg-[#374151] text-[#f9fafb]"
                : "hover:bg-[#374151] text-[#cbd5e1]"
            }`}
          >
            <BarChart2 className="w-6 h-6 mr-3" />
            {!isCollapsed && <span>Analytics</span>}
          </Link>

          <Link
            to="/emission_tracker"
            onClick={() => setSelected("emission_tracker")}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              selected === "emission_tracker"
                ? "bg-[#374151] text-[#f9fafb]"
                : "hover:bg-[#374151] text-[#cbd5e1]"
            }`}
          >
            <Activity className="w-6 h-6 mr-3" />
            {!isCollapsed && <span>Emission Tracker</span>}
          </Link>
        </nav>

        {/* Logout Button */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg hover:bg-[#374151] text-[#cbd5e1]"
          >
            <LogOut className="w-6 h-6 mr-3" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;