module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // Ensure all relevant files are scanned
  theme: {
    extend: {
      screens: {
        xs: "480px", // Custom breakpoint for extra small devices
      },
      colors: {
        primary: "#021526", // Main background color
        secondary: "#03346E", // Card and section background color
        accent: "#4CAF50", // Green for success
        warning: "#F44336", // Red for errors
        highlight: "#FFEB3B", // Yellow for highlights
        text: "#e1f5fe", // Light blue for text
        muted: "#81d4fa", // Lighter blue for secondary text
        border: "#1B262C", // Subtle border color
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"), // Ensure this plugin is included
    require("@tailwindcss/typography"), // Add typography plugin for better text styling
  ],
};

