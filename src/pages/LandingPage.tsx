import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2000); // Redirect after 2 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#213448] text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">PulaSafe</h1>
        <p className="text-lg mt-2">Disaster Response Platform</p>
      </div>
    </div>
  );
};

export default LandingPage;
