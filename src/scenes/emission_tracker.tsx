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
import Header from "../components/header"; // Fixed import path
import BED_DATA from "../data/B_E_D.json"; // Import BED dataset

interface ChartData {
  time: string;
  emissions: number;
}

const EmissionTracker: React.FC = () => {
  const [realTimeData, setRealTimeData] = useState<ChartData[]>([]);
  const [historicalData, setHistoricalData] = useState<ChartData[]>([]);
  const [intervalType, setIntervalType] = useState<"seconds" | "minutes" | "hours" | "days">("minutes"); // Updated interval types
  const [regionData, setRegionData] = useState<any[]>([]);
  const [energyMixData, setEnergyMixData] = useState<any[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [chartType, setChartType] = useState<"pie" | "line">("pie"); // Toggle for chart type

  const saveTrackerEntry = (entry: { category: string; value: number; date: string }) => {
    const existingEntries = JSON.parse(localStorage.getItem("trackerEntries") || "[]");
    const updatedEntries = [entry, ...existingEntries].slice(0, 5); // Keep only the last 5 entries
    localStorage.setItem("trackerEntries", JSON.stringify(updatedEntries));
  };

  // Example of saving a tracker entry
  const trackEmission = (category: string, value: number) => {
    saveTrackerEntry({
      category,
      value,
      date: new Date().toLocaleString(),
    });
  };

  useEffect(() => {
    // Determine interval duration based on selected interval type
    const intervalDuration = {
      seconds: 1000, // Added seconds
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
          second: intervalType === "seconds" ? "2-digit" : undefined, // Show seconds if intervalType is seconds
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

      // Sum all CarbonIntensity_gCO2eq_kWh values for each region
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
      emissions: region.emissions, // Use the summed emissions for the chart
    }));

    const energyMix = Object.values(regions).map((region: any) => ({
      name: region.region,
      renewable: region.renewable,
      nonRenewable: region.nonRenewable,
    }));

    setRegionData(regionComparison);
    setEnergyMixData(energyMix);
  }, []);

  const handleRegionSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedRegions((prev) =>
      prev.includes(value) ? prev.filter((region) => region !== value) : [...prev, value]
    );
  };

  const filteredEnergyMixData = energyMixData.filter((region) =>
    selectedRegions.includes(region.name)
  );

  return (
    <div className="h-full p-6 bg-secondary text-text"> {/* Full-screen layout */}
      <Header
        title="Emission Tracker"
        subtitle="Real-Time Simulation, Historical Analysis, and Comparative Analysis of Emissions Data"
      />

      {/* Interval Toggle */}
      <div className="flex justify-end mb-4 space-x-4">
        <select
          value={intervalType}
          onChange={(e) => setIntervalType(e.target.value as "seconds" | "minutes" | "hours" | "days")}
          className="p-2 border rounded bg-[#0B192C] text-[#e1f5fe] border-[#1B262C] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
        >
          <option value="seconds">Seconds</option> {/* Added seconds option */}
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </select>
      </div>

      <div className="space-y-6">
        {/* Real-Time Emissions */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Real-Time Emissions</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={realTimeData} style={{ backgroundColor: "#021526" }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#152A38" />
                <XAxis dataKey="time" stroke="#FFFFFF" />
                <YAxis stroke="#FFFFFF" />
                <Tooltip contentStyle={{ backgroundColor: "#1B262C", color: "#FFFFFF" }} />
                <Line type="monotone" dataKey="emissions" stroke="#4CAF50" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Historical Emissions */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Historical Emissions Analysis</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} style={{ backgroundColor: "#021526" }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#152A38" />
                <XAxis dataKey="time" stroke="#FFFFFF" />
                <YAxis stroke="#FFFFFF" />
                <Tooltip contentStyle={{ backgroundColor: "#1B262C", color: "#FFFFFF" }} />
                <Line type="monotone" dataKey="emissions" stroke="#FF5722" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Regional Comparison */}
      <section className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Regional Emissions Comparison</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={regionData}
              style={{ backgroundColor: "#021526" }} // Set chart background color
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#152A38" />
              <XAxis dataKey="region" stroke="#FFFFFF" />
              <YAxis
                domain={[18000, 21000]} // Adjusted domain to match the range of values
                tickCount={7} // Set tick intervals to show more granularity
                stroke="#FFFFFF"
              />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(2)} gCO₂`}
                contentStyle={{ backgroundColor: "#1B262C", color: "#FFFFFF" }}
              />
              <Bar dataKey="emissions" name="Emissions">
                {regionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index % 2 === 0
                        ? "#FFEB3B" // Yellow for even bars
                        : "#F44336" // Red for odd bars
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Energy Mix Breakdown with Filters */}
      <section className="bg-[#03346E] shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#e1f5fe]">Energy Mix Breakdown</h2>

        {/* Region Selection */}
        <div className="flex items-center space-x-4 mb-4">
          <select
            multiple
            value={selectedRegions}
            onChange={handleRegionSelection}
            className="p-2 border rounded bg-[#0B192C] text-[#e1f5fe] border-[#1B262C] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
          >
            {energyMixData.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as "pie" | "line")}
            className="p-2 border rounded bg-[#0B192C] text-[#e1f5fe] border-[#1B262C] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
          >
            <option value="pie">Pie Chart</option>
            <option value="line">Line Chart</option>
          </select>
        </div>

        {/* Energy Mix Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Chart */}
          <div className="space-y-4">
            {energyMixData.map((region: any, index: number) => (
              <div key={index} className="space-y-2">
                <h3 className="text-lg font-medium text-[#e1f5fe]">{region.name}</h3>
                <div className="relative w-full h-6 bg-[#1B262C] rounded">
                  {/* Renewable Energy */}
                  <div
                    className="absolute top-0 left-0 h-full bg-[#4caf50] rounded-l"
                    style={{
                      width: `${(region.renewable / (region.renewable + region.nonRenewable)) * 100}%`,
                    }}
                  ></div>
                  {/* Non-Renewable Energy */}
                  <div
                    className="absolute top-0 right-0 h-full bg-[#f44336] rounded-r"
                    style={{
                      width: `${(region.nonRenewable / (region.renewable + region.nonRenewable)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-[#81d4fa]">
                  <span>Renewable: {region.renewable.toFixed(2)} gCO₂</span>
                  <span>Non-Renewable: {region.nonRenewable.toFixed(2)} gCO₂</span>
                </div>
              </div>
            ))}
          </div>

          {/* Filtered Chart */}
          {selectedRegions.length > 0 && (
            <div className="space-y-4">
              {chartType === "pie" ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart style={{ backgroundColor: "#021526" }}>
                    <Pie
                      data={filteredEnergyMixData.map((region) => ({
                        name: region.name,
                        value: region.renewable,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {filteredEnergyMixData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index % 2 === 0
                              ? "#4CAF50" // Green for even slices
                              : "#FF5722" // Orange for odd slices
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `${value.toFixed(2)} gCO₂`}
                      contentStyle={{ backgroundColor: "#1B262C", color: "#FFFFFF" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical" // Rotate the chart 90 degrees anticlockwise
                    data={filteredEnergyMixData}
                    style={{ backgroundColor: "#021526" }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#152A38" />
                    <XAxis type="number" stroke="#FFFFFF" />
                    <YAxis type="category" dataKey="name" stroke="#FFFFFF" />
                    <Tooltip contentStyle={{ backgroundColor: "#1B262C", color: "#FFFFFF" }} />
                    <Bar dataKey="renewable" fill="#4caf50" name="Renewable" />
                    <Bar dataKey="nonRenewable" fill="#f44336" name="Non-Renewable" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EmissionTracker;
