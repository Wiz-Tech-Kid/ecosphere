import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./scenes/dashboard/dashboard";
import Analytics from "./scenes/analytics";
import Calculator from "./scenes/calculator";
import Topbar from "./scenes/global/topbar";
import Sidebar from "./scenes/global/sidebar";
import EmissionTracker from "./scenes/emission_tracker";

function App() {
  return (
    <Router>
      <div className="flex w-full h-full bg-[#213448] text-[#e5e7eb]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 flex flex-col overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/emission_tracker" element={<EmissionTracker />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
