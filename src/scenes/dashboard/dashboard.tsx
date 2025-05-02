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
import emissionsData from "../../data/ZA_2023_yearly.json";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell } from 'recharts';
import Header from "../../components/header"; // Fixed import path

// Register chart components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

interface CalculatorScenario {
  name: string;
  date: string;
}

const Dashboard: React.FC = () => {
  const [totalEmissions, setTotalEmissions] = useState<number>(0);
  const [percentChange] = useState<number>(4.2);
  const [topEmitter] = useState<string>("Energy Sector");

  const [doughnutData, setDoughnutData] = useState<any>(null);
  const [recentCalculatorScenarios, setRecentCalculatorScenarios] = useState<CalculatorScenario[]>([]);
  interface TrackerEntry {
    category: string;
    date: string;
    value: number;
  }

  const [recentTrackerEntries, setRecentTrackerEntries] = useState<TrackerEntry[]>([]);

  const barChartData = [
    { name: 'January', renewable: 400, nonRenewable: 300 },
    { name: 'February', renewable: 300, nonRenewable: 200 },
    { name: 'March', renewable: 500, nonRenewable: 400 },
  ];

  useEffect(() => {
    // Calculate total emissions
    const total = emissionsData.reduce(
      (sum: number, entry: any) => sum + (entry["CO2_emissions"] || 0),
      0
    );
    setTotalEmissions(total);

    // Doughnut chart data
    setDoughnutData({
      labels: ["Residential", "Industrial", "Transportation"],
      datasets: [
        {
          data: [35, 45, 20],
          backgroundColor: ["#4CAF50", "#FF5722", "#FFEB3B"], // Green, Orange, Yellow
          borderWidth: 0,
        },
      ],
    });

    // Fetch recent calculator scenarios
    const scenarios = JSON.parse(localStorage.getItem("calculatorScenarios") || "[]");
    setRecentCalculatorScenarios(scenarios);

    // Generate dummy tracker entries with recent dates if none exist
    const existingEntries = JSON.parse(localStorage.getItem("trackerEntries") || "[]");
    if (existingEntries.length === 0) {
      const dummyEntries = [
        { category: "Transportation", value: 120, date: "2024-10-01 10:00 AM" },
        { category: "Residential Energy", value: 80, date: "2024-09-15 02:00 PM" },
        { category: "Industrial Processes", value: 200, date: "2023-12-20 09:30 AM" },
        { category: "Waste Management", value: 50, date: "2023-11-05 01:15 PM" },
        { category: "Agriculture", value: 90, date: "2024-01-10 11:45 AM" },
      ];
      localStorage.setItem("trackerEntries", JSON.stringify(dummyEntries));
      setRecentTrackerEntries(dummyEntries);
    } else {
      setRecentTrackerEntries(existingEntries);
    }
  }, []);

  return (
    <div className="p-8 h-full bg-[#021526] text-white">
      <Header title="Emissions Dashboard" subtitle="Comprehensive overview of carbon emissions" />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#03346E] p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <BarChart2 className="w-8 h-8 mr-4 text-[#FFEB3B]" /> {/* Yellow icon */}
            <div>
              <h3 className="text-sm font-medium text-[#81d4fa]">Total Emissions</h3>
              <p className="text-2xl font-bold text-[#4CAF50]">
                {totalEmissions.toLocaleString()} tCO₂
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#03346E] p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 mr-4 text-[#FF5722]" /> {/* Orange icon */}
            <div>
              <h3 className="text-sm font-medium text-[#81d4fa]">Monthly Change</h3>
              <p className="text-2xl font-bold text-[#FFEB3B]">~
                {percentChange > 0 ? "+" : ""}
                {percentChange}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#03346E] p-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 mr-4 text-[#F44336]" /> {/* Red icon */}
            <div>
              <h3 className="text-sm font-medium text-[#81d4fa]">Top Emitter Sector</h3>
              <p className="text-2xl font-bold text-[#FF5722]">{topEmitter}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0B192C] p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Emission Sources</h3>
          <div className="h-98"> {/* Enlarged chart height */}
            {doughnutData && (
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: { color: "#FFFFFF" },
                    },
                  },
                  layout: {
                    padding: 20,
                  },
                  backgroundColor: "#021526", // Set chart background color
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-[#0B192C] p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Energy Comparison</h3>
          <div className="h-72">
            <BarChart
              width={500}
              height={300}
              data={barChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              style={{ backgroundColor: "#021526" }} // Set chart background color
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#152A38" />
              <XAxis dataKey="name" stroke="#FFFFFF" />
              <YAxis stroke="#FFFFFF" />
              <RechartsTooltip contentStyle={{ backgroundColor: "#1B262C", color: "#FFFFFF" }} />
              <RechartsLegend wrapperStyle={{ color: "#FFFFFF" }} />
              <Bar dataKey="renewable" stackId="a">
                {barChartData.map((_, index) => (
                  <Cell
                    key={`renewable-cell-${index}`}
                    fill={index % 2 === 0 ? "#4CAF50" : "#81C784"} // Different shades of green
                  />
                ))}
              </Bar>
              <Bar dataKey="nonRenewable" stackId="a">
                {barChartData.map((_, index) => (
                  <Cell
                    key={`nonRenewable-cell-${index}`}
                    fill={index % 2 === 0 ? "#F44336" : "#E57373"} // Different shades of red
                  />
                ))}
              </Bar>
            </BarChart>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0B192C] p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Recent Tracker Entries</h3>
            <div className="space-y-4">
              {recentTrackerEntries.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#03001C] rounded-lg"
                >
                  <div>
                    <p className="font-medium">{entry.category}</p>
                    <p className="text-sm">{entry.date}</p>
                  </div>
                  <span className="text-lg font-semibold">{entry.value}tCO₂</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0B192C] p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Recent Calculator Scenarios</h3>
            <div className="space-y-4">
              {recentCalculatorScenarios.map((scenario, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#03001C] rounded-lg"
                >
                  <div>
                    <p className="font-medium">{scenario.name}</p>
                    <p className="text-sm">{scenario.date}</p>
                  </div>
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
