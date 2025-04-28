import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "./utils/supabaseClient";
import { Session } from "@supabase/supabase-js";
import Dashboard from "./scenes/dashboard/dashboard";
import Analytics from "./scenes/analytics";
import Calculator from "./scenes/calculator";
import Topbar from "./scenes/global/topbar";
import Sidebar from "./scenes/global/sidebar";
import EmissionTracker from "./scenes/emission_tracker";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import PasswordReset from "./pages/PasswordReset";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setIsLoading(false); // Set loading to false after fetching session
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    // Show a loading indicator while checking the session
    return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex w-full h-full bg-[#213448] text-[#e5e7eb]">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Topbar />
                  <main className="flex-1 flex flex-col overflow-auto">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/calculator" element={<Calculator />} />
                      <Route path="/emission_tracker" element={<EmissionTracker />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
