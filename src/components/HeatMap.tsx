import React from "react";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface HeatMapProps {
  data: { month: string; [key: string]: number | string }[];
  xAxis: { dataKey: string; tickLine?: boolean };
  yAxis: { type: "number" | "category"; dataKey: string; scale: "auto" | "linear" | "pow" | "sqrt" | "log" | "identity" | "time" | "band" | "point" | "ordinal" | "quantile" | "quantize" | "utc" | "sequential" | "threshold" };
  series: string[];
  colorScale: string[];
  cellShape: (props: any) => JSX.Element;
}

const HeatMap: React.FC<HeatMapProps> = ({ data, xAxis, yAxis, series, colorScale, cellShape }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <svg>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxis.dataKey} tickLine={xAxis.tickLine} />
        <YAxis type={yAxis.type} dataKey={yAxis.dataKey} scale={yAxis.scale} />
        <Tooltip />
        {data.map((row, rowIndex) =>
          series.map((key, colIndex) => {
            const value = row[key];
            const numericValue = typeof value === "number" ? value : parseFloat(value as string);
            const color = colorScale[Math.min(Math.floor(numericValue / 100), colorScale.length - 1)];
            return cellShape({
              key: `${rowIndex}-${colIndex}`,
              x: colIndex * 50,
              y: rowIndex * 50,
              width: 50,
              height: 50,
              color,
            });
          })
        )}
      </svg>
    </ResponsiveContainer>
  );
};

export default HeatMap;
