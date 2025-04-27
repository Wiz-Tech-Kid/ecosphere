// EmissionTracker.tsx
import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Header from "../components/header";
import BED_DATA from "../data/B_E_D.json"; // Import BED dataset

interface ChartData {
  time: string;
  emissions: number;
}

const EmissionTracker: React.FC = () => {
  const [realTimeData, setRealTimeData] = useState<ChartData[]>([]);
  const [historicalData, setHistoricalData] = useState<ChartData[]>([]);
  const [intervalType, setIntervalType] = useState<"seconds" | "minutes" | "hours" | "days">("seconds");
  const [regionData, setRegionData] = useState<any[]>([]); // Regional comparison data
  const [energyMixData, setEnergyMixData] = useState<any[]>([]); // Energy source breakdown

  useEffect(() => {
    // Determine interval duration based on selected interval type
    const intervalDuration = {
      seconds: 1000,
      minutes: 60000,
      hours: 3600000,
      days: 86400000,
    }[intervalType];

    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData((prevData) => {
        const newTime = new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: intervalType === "seconds" ? "2-digit" : undefined,
        });
        const newEmissions = Math.random() * (965 - 20) + 20; // Random emissions value between 20 and 965
        const newData = [...prevData, { time: newTime, emissions: newEmissions }];

        // Keep only the last 20 data points
        return newData.length > 20 ? newData.slice(1) : newData;
      });
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [intervalType]);

  useEffect(() => {
    // Update historical data whenever real-time data changes
    if (realTimeData.length > 0) {
      setHistoricalData((prevData) => [...prevData, ...realTimeData]);
    }
  }, [realTimeData]);

  useEffect(() => {
    // Process BED dataset for regional comparisons and energy mix
    const regions = BED_DATA.reduce((acc: any, entry: any) => {
      const { Region, CarbonIntensity_gCO2eq_kWh, RE_Percentage } = entry;
      if (!acc[Region]) {
        acc[Region] = { region: Region, emissions: 0, renewable: 0, nonRenewable: 0 };
      }
      acc[Region].emissions += CarbonIntensity_gCO2eq_kWh;
      acc[Region].renewable += (RE_Percentage / 100) * CarbonIntensity_gCO2eq_kWh;
      acc[Region].nonRenewable += ((100 - RE_Percentage) / 100) * CarbonIntensity_gCO2eq_kWh;
      return acc;
    }, {});

    const regionComparison = Object.values(regions).map((region: any) => ({
      region: region.region,
      emissions: region.emissions,
    }));

    const energyMix = Object.values(regions).map((region: any) => ({
      name: region.region,
      renewable: region.renewable,
      nonRenewable: region.nonRenewable,
    }));

    setRegionData(regionComparison);
    setEnergyMixData(energyMix);
  }, []);

  return (
    <div className="flex flex-col flex-1 p-6 space-y-10">
      {/* Page Header */}
      <Header
        title="Emission Tracker"
        subtitle="Real-Time Simulation, Historical Analysis, and Comparative Analysis of Emissions Data"
      />

      {/* Interval Toggle */}
      <div className="flex justify-end mb-4">
        <select
          value={intervalType}
          onChange={(e) => setIntervalType(e.target.value as "seconds" | "minutes" | "hours" | "days")}
          className="p-2 border rounded"
        >
          <option value="seconds">Seconds</option>
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </select>
      </div>

      {/* Real-Time Emissions Line Chart */}
      <section className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Real-Time Emissions</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={realTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Time",
                  position: "insideBottom",
                  offset: -5,
                  style: { textAnchor: "middle" },
                }}
              />
              <YAxis
                domain={[0, 1000]} // Set Y-axis range to 0-1000
                tick={{ fontSize: 12 }}
                label={{
                  value: "Emissions (gCO₂)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(2)} gCO₂`}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="emissions"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false} // Smooth line
                name="Emissions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Historical Data Analysis */}
      <section className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Historical Emissions Analysis</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Time",
                  position: "insideBottom",
                  offset: -5,
                  style: { textAnchor: "middle" },
                }}
              />
              <YAxis
                domain={[0, 1000]} // Set Y-axis range to 0-1000
                tick={{ fontSize: 12 }}
                label={{
                  value: "Emissions (gCO₂)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(2)} gCO₂`}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="stepAfter" // Sharp edges for discrete signal
                dataKey="emissions"
                stroke="#FF8042" // Bright orange for visibility
                strokeWidth={2}
                dot={{ stroke: "#FF8042", strokeWidth: 2 }} // Highlight points
                name="Historical Emissions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Regional Comparison */}
      <section className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Regional Emissions Comparison</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value.toFixed(2)} gCO₂`} />
              <Bar dataKey="emissions" fill="#82ca9d" name="Emissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Energy Mix Breakdown */}
      <section className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Energy Mix Breakdown</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={energyMixData}
                dataKey="renewable"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#82ca9d"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {energyMixData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#82ca9d" : "#8884d8"} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${value.toFixed(2)} gCO₂`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default EmissionTracker;
