import { createContext } from "react";

// Fixed color mode context (no toggle functionality)
export const ColorModeContext = createContext({
  mode: "dark", // Default and only mode
});

// Theme settings (fixed to the app's current color mode)
export const themeSettings = () => ({
  palette: {
    mode: "dark",
    primary: {
      main: "#021526", // Sidebar and background color
    },
    secondary: {
      main: "#03346E", // Card and section background color
    },
    text: {
      primary: "#e1f5fe", // Text color
    },
    background: {
      default: "#021526", // Main background color
      paper: "#03346E", // Card background color
    },
  },
  typography: {
    fontFamily: ["Arial", "sans-serif"].join(","),
    h1: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#e1f5fe",
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#e1f5fe",
    },
    body1: {
      fontSize: "1rem",
      color: "#e1f5fe",
    },
  },
});