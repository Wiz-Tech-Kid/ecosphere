// src/scenes/analytics.tsx
import { useState, useEffect } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
  LabelList,
  Line,
} from "recharts";
import { Slider } from "@mui/material";
import Header from "../components/header";

import BW_2023 from "../data/BW_2023_monthly.json";
import ZA_2023 from "../data/ZA_2023_monthly.json";
import BW_2024 from "../data/BW_2024_monthly.json";
import ZA_2024 from "../data/ZA_2024_monthly.json";

// helper to average an array of numbers
const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

export default function Analytics() {
  const [year, setYear] = useState<"2023" | "2024">("2023");
  const [factor, setFactor] = useState(1);

  // pick the right dataset based on year selection
  const dataSets = year === "2023"
    ? { bw: BW_2023, za: ZA_2023 }
    : { bw: BW_2024, za: ZA_2024 };

  // 1) HeatMap Data — carbon intensity by month for each country
  const heatmapData = dataSets.bw.map((bwEntry, i) => {
    const month = new Date(bwEntry["Datetime (UTC)"]).toLocaleString("en-US", { month: "short" });
    return {
      month,
      Botswana: bwEntry["Carbon intensity gCO₂eq"]["kWh (direct)"] * factor,
      "South Africa": dataSets.za[i]?.["Carbon intensity gCO₂eq"]["kWh (direct)"] * factor,
    };
  });

  // 2) Bar chart — average carbon intensity per country
  const barData = [
    {
      name: "Botswana",
      intensity: avg(dataSets.bw.map(e => e["Carbon intensity gCO₂eq"]["kWh (direct)"])) * factor,
    },
    {
      name: "South Africa",
      intensity: avg(dataSets.za.map(e => e["Carbon intensity gCO₂eq"]["kWh (direct)"])) * factor,
    },
  ];

  // 3) Pie chart — renewable vs non-renewable mix
  const zaRE = avg(dataSets.za.map(e => e["Renewable energy percentage (RE%)"]));
  const bwRE = avg(dataSets.bw.map(e => e["Renewable energy percentage (RE%)"]));
  const pieData = [
    { name: "ZA Renewable", value: zaRE },
    { name: "ZA Non-Renewable", value: 100 - zaRE },
    { name: "BW Renewable", value: bwRE },
    { name: "BW Non-Renewable", value: 100 - bwRE },
  ];
  const PIE_COLORS = ["#0088FE","#00C49F","#FFBB28","#FF8042"];

  // 4) Area chart — carbon‐free energy % 
  const areaData = dataSets.za.map((zaEntry, i) => {
    const month = new Date(zaEntry["Datetime (UTC)"]).toLocaleString("en-US", { month: "short" });
    return {
      month,
      "ZA CFE%": zaEntry["Carbon-free energy percentage (CFE%)"],
      "BW CFE%": dataSets.bw[i]?.["Carbon-free energy percentage (CFE%)"] ?? 0,
    };
  });

  return (
    <div className="flex flex-col flex-1 p-6 space-y-12 bg-[#021526] text-white">
      <Header title="Analytics" subtitle="Analyze your energy & carbon data" />

      {/* Year / Sensitivity Controls */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <label className="mr-2 text-[#e1f5fe]">Year:</label>
          <select
            className="p-2 border rounded bg-[#0B192C] text-[#e1f5fe] border-[#1B262C] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
            value={year}
            onChange={e => setYear(e.target.value as any)}
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </select>
        </div>
        <div className="w-1/3">
          <label className="block mb-1 text-[#e1f5fe]">Sensitivity Factor: {factor.toFixed(1)}</label>
          <Slider
            value={factor}
            min={0.5}
            max={1.5}
            step={0.1}
            onChange={(_, v) => setFactor(v as number)}
            valueLabelDisplay="auto"
            sx={{
              color: "#4fc3f7",
              "& .MuiSlider-thumb": { backgroundColor: "#1B262C" },
              "& .MuiSlider-track": { backgroundColor: "#4fc3f7" },
              "& .MuiSlider-rail": { backgroundColor: "#152A38" },
            }}
          />
        </div>
      </div>

      {/* Bar Chart - Carbon Intensity */}
      <section className="bg-[#03346E] p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Carbon Intensity by Month</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={heatmapData}
              style={{ backgroundColor: "#021526" }} // Keep background as it is
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#152A38" />
              <XAxis dataKey="month" stroke="#FFEB3B" />
              <YAxis stroke="#FFEB3B" />
              <RechartsTooltip contentStyle={{ backgroundColor: "#1B262C", color: "#FFFFFF" }} />
              <RechartsLegend wrapperStyle={{ color: "#FFFFFF" }} />
              <Bar dataKey="Botswana" fill="#4CAF50" /> {/* Green for Botswana */}
              <Bar dataKey="South Africa" fill="#F44336" /> {/* Red for South Africa */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 2) Bar Chart */}
      <section className="bg-[#03346E] p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Avg Carbon Intensity by Country</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip formatter={(v) => (typeof v === "number" ? `${v.toFixed(1)} gCO₂eq/kWh` : v)} />
            <RechartsLegend />
            <Bar dataKey="intensity" fill="#8884D8">
              {/* show exact number above each bar */}
              <LabelList dataKey="intensity" position="top" formatter={(v: number) => v.toFixed(1)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* 3) Pie Chart */}
      <section className="bg-[#03346E] p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-[#e1f5fe]">Energy Mix Composition</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart style={{ backgroundColor: "#021526" }}> {/* Set chart background color */}
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: "#1B262C", color: "#FFFFFF" }} />
            <RechartsLegend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ backgroundColor: "#021526", color: "#e1f5fe" }} />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* 4) Area Chart */}
      <section className="bg-[#03346E] p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-[#e1f5fe]">Carbon-Free Energy % Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={areaData}
            style={{ backgroundColor: "#021526" }} // Keep background as it is
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#152A38" />
            <XAxis dataKey="month" stroke="#FFFFFF" />
            <YAxis stroke="#FFFFFF" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
            <RechartsTooltip contentStyle={{ backgroundColor: "#1B262C", color: "#FFFFFF" }} />
            <RechartsLegend wrapperStyle={{ backgroundColor: "#021526", color: "#e1f5fe" }} />
            <Area type="monotone" dataKey="ZA CFE%" stroke="#FF5722" fill="#FF5722" fillOpacity={0.4} />
            <Area type="monotone" dataKey="BW CFE%" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.4} />
          </AreaChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
