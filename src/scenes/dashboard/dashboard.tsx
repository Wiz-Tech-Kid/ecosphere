import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { AlertCircle, TrendingUp, BarChart2 } from "lucide-react";
import { useEmissionsStore } from "../../stores/emissionsStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

// Register chart components
ChartJS.register(ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const [totalEmissions, setTotalEmissions] = useState<number>(0);
  const [percentChange] = useState<number>(4.2);
  const [topEmitter] = useState<string>("Energy Sector");
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [doughnutData, setDoughnutData] = useState<any>(null);

  const recentTrackerEntries = [
    { category: "Transportation", date: "2023-10-01", value: 120 },
    { category: "Industrial", date: "2023-10-02", value: 200 },
    { category: "Residential", date: "2023-10-03", value: 80 },
  ];

  const barChartData = [
    { name: "January", renewable: 400, nonRenewable: 300 },
    { name: "February", renewable: 300, nonRenewable: 200 },
    { name: "March", renewable: 500, nonRenewable: 400 },
  ];

  const emissionsStore = useEmissionsStore();

  useEffect(() => {
    // Fetch real-time emissions data from the store
    setRealTimeData(emissionsStore.scenarios[0]?.data || []);

    // Calculate total emissions
    const total = emissionsStore.scenarios.reduce(
      (sum, scenario) =>
        sum + scenario.data.reduce((acc, entry) => acc + entry.value, 0),
      0
    );
    setTotalEmissions(total);

    // Doughnut chart data
    setDoughnutData({
      labels: ["Residential", "Industrial", "Transportation"],
      datasets: [
        {
          data: [35, 45, 20],
          backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
          borderWidth: 0,
        },
      ],
    });
  }, [emissionsStore]);

  return (
    <div className="p-8 h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#f3f4f6]">Emissions Dashboard</h1>
        <p className="text-[#9ca3af] mt-2">
          Comprehensive overview of carbon emissions
        </p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#ffffff] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-[#1f2937]">
          <div className="flex items-center">
            <BarChart2 className="w-8 h-8 text-[#3b82f6] mr-4" />
            <div>
              <h3 className="text-sm font-medium text-[#6b7280]">
                Total Emissions
              </h3>
              <p className="text-2xl font-bold">
                {totalEmissions.toLocaleString()} tCO₂
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <TrendingUp
              className={`w-8 h-8 mr-4 ${
                percentChange > 0 ? "text-red-500" : "text-green-500"
              }`}
            />
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Monthly Change
              </h3>
              <p
                className={`text-2xl font-bold ${
                  percentChange > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {percentChange > 0 ? "+" : ""}
                {percentChange}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-yellow-500 mr-4" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Top Emitter Sector
              </h3>
              <p className="text-2xl font-bold">{topEmitter}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4">Emission Sources</h3>
          <div className="h-72">
            {doughnutData && (
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: {
                        color: "#6B7280",
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4">Real-Time Emissions</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={realTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-4">Recent Tracker Entries</h3>
            <div className="space-y-4">
              {recentTrackerEntries.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{entry.category}</p>
                    <p className="text-sm text-gray-500">{entry.date}</p>
                  </div>
                  <span className="text-lg font-semibold">{entry.value}tCO₂</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-4">Recent Calculator Scenarios</h3>
            <div className="space-y-4">
              {emissionsStore.manualOverrides.slice(-3).map((scenario, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{scenario.date}</p>
                    <p className="text-sm text-gray-500">Override</p>
                  </div>
                  <span className="text-lg font-semibold">{scenario.value}tCO₂</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
