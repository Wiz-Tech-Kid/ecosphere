import React, { useState } from "react";
import { Bar } from "@nivo/bar";
import { FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Updated emission factors with African regions (now using litres)
const ENTERPRISE_EMISSION_FACTORS = {
  diesel: 2.70, // kgCO2e/litre
  electricity: {
    SOUTHERN_AFRICA: 0.920,
    MIDDLE_AFRICA: 0.850,
    EASTERN_AFRICA: 0.740,
    WESTERN_AFRICA: 0.880,
    NORTHERN_AFRICA: 0.610,
  },
  flights: 0.18, // kgCO2e/km (short-haul)
  commuting: 0.12, // kgCO2e/km (car)
  waste: 0.1, // kgCO2e/kg (landfill)
  packaging: 0.25, // kgCO2e/kg (plastic/cardboard average)
};

type Region =
  | "SOUTHERN_AFRICA"
  | "MIDDLE_AFRICA"
  | "EASTERN_AFRICA"
  | "WESTERN_AFRICA"
  | "NORTHERN_AFRICA";

const data = [
  { month: 'January', value: 400 },
  { month: 'February', value: 300 },
  { month: 'March', value: 500 },
];

const Calculator: React.FC = () => {
  const [inputs, setInputs] = useState({
    scope1: { dieselLitres: 0, waterConsumption: 0 },
    scope2: { electricityKwh: 0, region: "SOUTHERN_AFRICA" as Region },
    scope3: {
      businessTravelKm: 0,
      employeeCommutingKm: 0,
      wasteKg: 0,
      packagingKg: 0,
    },
  });

  const [results, setResults] = useState<{
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
    breakdown: Record<string, number>;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [scope, field] = name.split(".") as [keyof typeof inputs, string];
    setInputs((prev) => ({
      ...prev,
      [scope]: { ...prev[scope], [field]: parseFloat(value) || 0 },
    }));
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInputs((prev) => ({
      ...prev,
      scope2: { ...prev.scope2, region: e.target.value as Region },
    }));
  };

  const calculateEmissions = () => {
    const scope1 =
      inputs.scope1.dieselLitres * ENTERPRISE_EMISSION_FACTORS.diesel +
      inputs.scope1.waterConsumption * 0.002;

    const scope2 =
      inputs.scope2.electricityKwh *
      ENTERPRISE_EMISSION_FACTORS.electricity[inputs.scope2.region];

    const scope3 =
      inputs.scope3.businessTravelKm * ENTERPRISE_EMISSION_FACTORS.flights +
      inputs.scope3.employeeCommutingKm * ENTERPRISE_EMISSION_FACTORS.commuting +
      inputs.scope3.wasteKg * ENTERPRISE_EMISSION_FACTORS.waste +
      inputs.scope3.packagingKg * ENTERPRISE_EMISSION_FACTORS.packaging;

    setResults({
      scope1,
      scope2,
      scope3,
      total: scope1 + scope2 + scope3,
      breakdown: {
        "Diesel Combustion": inputs.scope1.dieselLitres * ENTERPRISE_EMISSION_FACTORS.diesel,
        "Water Consumption": inputs.scope1.waterConsumption * 0.002,
        [`Electricity (${inputs.scope2.region})`]: scope2,
        "Business Travel": inputs.scope3.businessTravelKm * ENTERPRISE_EMISSION_FACTORS.flights,
        "Employee Commuting": inputs.scope3.employeeCommutingKm * ENTERPRISE_EMISSION_FACTORS.commuting,
        "Waste Generated": inputs.scope3.wasteKg * ENTERPRISE_EMISSION_FACTORS.waste,
        "Packaging Material": inputs.scope3.packagingKg * ENTERPRISE_EMISSION_FACTORS.packaging,
      },
    });
  };

  const exportToPDF = () => {
    alert("PDF report generated for audit compliance");
  };

  return (
    <div className="flex flex-col flex-1 bg-[#213448] text-white">
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Enterprise Carbon Calculator</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Scope 1 */}
          <div className="bg-gray-800 dark:bg-gray-800 shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Scope 1 (Direct)</h2>
            <input
              type="number"
              name="scope1.dieselLitres"
              placeholder="Diesel (litres)"
              onChange={handleInputChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="number"
              name="scope1.waterConsumption"
              placeholder="Water Consumption (litres)"
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Scope 2 */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Scope 2 (Indirect Energy)</h2>
            <input
              type="number"
              name="scope2.electricityKwh"
              placeholder="Electricity (kWh)"
              onChange={handleInputChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <select
              name="scope2.region"
              value={inputs.scope2.region}
              onChange={handleRegionChange}
              className="w-full p-2 border rounded"
            >
              <option value="SOUTHERN_AFRICA">Southern Africa</option>
              <option value="MIDDLE_AFRICA">Middle Africa</option>
              <option value="EASTERN_AFRICA">Eastern Africa</option>
              <option value="WESTERN_AFRICA">Western Africa</option>
              <option value="NORTHERN_AFRICA">Northern Africa</option>
            </select>
          </div>

          {/* Scope 3 */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Scope 3 (Value Chain)</h2>
            <input
              type="number"
              name="scope3.businessTravelKm"
              placeholder="Business Travel (km)"
              onChange={handleInputChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="number"
              name="scope3.employeeCommutingKm"
              placeholder="Employee Commuting (km)"
              onChange={handleInputChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="number"
              name="scope3.wasteKg"
              placeholder="Waste Generated (kg)"
              onChange={handleInputChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="number"
              name="scope3.packagingKg"
              placeholder="Packaging Material (kg)"
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <button
          onClick={calculateEmissions}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Calculate Emissions
        </button>

        {results && (
          <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Results</h2>
              <button
                onClick={exportToPDF}
                className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                <FileText className="w-5 h-5 mr-2" />
                Export Report
              </button>
            </div>
            <p className="text-xl font-bold mb-4">
              Total Emissions: {results.total.toFixed(2)} kg CO₂e
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
                Scope 1: {results.scope1.toFixed(2)} kg
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
                Scope 2: {results.scope2.toFixed(2)} kg
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
                Scope 3: {results.scope3.toFixed(2)} kg
              </div>
            </div>
            <div className="mt-6 h-64">
              <div style={{ height: "100%", width: "100%" }}>
                <Bar
                  data={Object.entries(results.breakdown).map(([key, value]) => ({
                    category: key,
                    emissions: value,
                  }))}
                  keys={["emissions"]}
                  indexBy="category"
                  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: "linear" }}
                  indexScale={{ type: "band", round: true }}
                  colors={{ scheme: "nivo" }}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Category",
                    legendPosition: "middle",
                    legendOffset: 32,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Emissions (kg CO₂e)",
                    legendPosition: "middle",
                    legendOffset: -40,
                  }}
                  height={256}
                  width={400}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Emission Trends</h2>
          <AreaChart
            width={500}
            height={300}
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </div>
      </main>
    </div>
  );
};

export default Calculator;
