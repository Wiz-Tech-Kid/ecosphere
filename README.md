# Ecosphere App

Ecosphere is a React-based web application designed to provide tools for environmental tracking, analytics, and carbon footprint calculations. It integrates real-time data visualization, machine learning analytics, and user-friendly interfaces to help users monitor and reduce their carbon emissions.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Dashboard](#dashboard)
   - [Analytics](#analytics)
   - [Calculator](#calculator)
   - [Emission Tracker](#emission-tracker)
   - [Settings](#settings)
3. [Technical Implementation](#technical-implementation)
   - [Formulas Used](#formulas-used)
   - [Machine Learning](#machine-learning)
4. [Tutorials](#tutorials)
   - [Using the Calculator](#using-the-calculator)
   - [Tracking Emissions](#tracking-emissions)
   - [Analyzing Data](#analyzing-data)
5. [File Structure](#file-structure)
6. [Technologies Used](#technologies-used)
7. [Future Enhancements](#future-enhancements)

---

## Overview

Ecosphere is a platform for individuals and organizations to:
- Monitor carbon emissions in real-time.
- Analyze historical and regional emissions data.
- Calculate carbon footprints using customizable inputs.
- Visualize energy mixes and renewable energy contributions.

The app is built with React, leveraging Supabase for authentication and TensorFlow.js for machine learning analytics.

---

## Features

### Dashboard
- **Purpose**: Provides an overview of recent activities and key metrics.
- **Key Components**:
  - **Doughnut Chart**: Displays emissions breakdown.
  - **Bar Chart**: Shows monthly emissions trends.
  - **Recent Scenarios**: Lists recently calculated scenarios.
- **Data Source**: Uses `ZA_2023_yearly.json` for emissions data.

### Analytics
- **Purpose**: Offers detailed insights into carbon intensity, energy mix, and renewable energy contributions.
- **Key Visualizations**:
  - **Bar Chart**: Compares average carbon intensity between regions.
  - **Pie Chart**: Displays renewable vs. non-renewable energy mix.
  - **Area Chart**: Tracks carbon-free energy percentages over time.
- **Data Source**: Combines `BW_2023_monthly.json` and `ZA_2023_monthly.json`.

### Calculator
- **Purpose**: Calculates carbon emissions based on user inputs.
- **Scopes**:
  - **Scope 1**: Direct emissions (e.g., diesel combustion).
  - **Scope 2**: Indirect emissions from electricity usage.
  - **Scope 3**: Value chain emissions (e.g., commuting, waste).
- **Formulas**:
  - Diesel Emissions = `dieselLitres × 2.70 kgCO₂e/litre`
  - Electricity Emissions = `electricityKwh × region-specific factor`
  - Waste Emissions = `wasteKg × 0.1 kgCO₂e/kg`
- **Export**: Generates PDF reports for audit compliance.

### Emission Tracker
- **Purpose**: Simulates real-time emissions and analyzes historical data.
- **Key Features**:
  - **Real-Time Line Chart**: Updates emissions data every second, minute, hour, or day.
  - **Regional Comparison**: Compares emissions across regions.
  - **Energy Mix Breakdown**: Visualizes renewable vs. non-renewable energy.
- **Data Source**: Processes `B_E_D.json` for regional emissions.

### Settings
- **Purpose**: Allows users to manage account settings and preferences.
- **Key Features**:
  - Update profile information.
  - Manage notification preferences.

---

## Technical Implementation

### Formulas Used
1. **Diesel Combustion**:  
   `Emissions = dieselLitres × 2.70 kgCO₂e/litre`
2. **Electricity Usage**:  
   `Emissions = electricityKwh × region-specific factor`
3. **Business Travel**:  
   `Emissions = travelKm × 0.18 kgCO₂e/km`
4. **Waste Management**:  
   `Emissions = wasteKg × 0.1 kgCO₂e/kg`

### Machine Learning
- **Linear Regression**: Predicts future emissions based on historical data.
- **K-Means Clustering**: Groups regions based on emissions intensity.
- **Heatmap Generation**: Maps emissions data to geographical regions.

---

## Tutorials

### Using the Calculator
1. Navigate to the **Calculator** page.
2. Enter values for:
   - Diesel consumption (litres).
   - Electricity usage (kWh).
   - Business travel (km).
   - Waste generated (kg).
3. Select the region for electricity emissions.
4. Click **Calculate Emissions** to view results.
5. Export the results as a PDF report.

### Tracking Emissions
1. Go to the **Emission Tracker** page.
2. Select the interval type (seconds, minutes, hours, days) using the new toggle.
3. View real-time emissions on the line chart.
4. Analyze historical data and regional comparisons.

### Analyzing Data
1. Open the **Analytics** page.
2. Select the year (2023 or 2024).
3. Adjust the sensitivity factor using the slider.
4. Explore visualizations:
   - Bar chart for carbon intensity.
   - Pie chart for energy mix.
   - Area chart for carbon-free energy.

---

## File Structure

```
src/
├── App.tsx                # Main application file
├── components/            # Reusable UI components
│   ├── ui/                # Background animations and loaders
│   ├── header.tsx         # Page headers
│   ├── HeatMap.tsx        # Heatmap visualization
│   ├── LoadingScreen.tsx  # Loading indicator
│   ├── LoginForm.tsx      # Login form
├── data/                  # JSON datasets for emissions and energy
├── scenes/                # Feature-specific pages
│   ├── dashboard/         # Dashboard components
│   ├── analytics.tsx      # Analytics page
│   ├── calculator.tsx     # Calculator page
│   ├── emission_tracker.tsx # Emission Tracker page
│   ├── global/            # Shared components (Sidebar, Topbar)
├── stores/                # Zustand state management
├── utils/                 # Utility functions (Supabase, ML)
└── index.tsx              # Entry point for the React app
```

---

## Technologies Used

- **React**: Frontend framework for building user interfaces.
- **Supabase**: Backend-as-a-service for authentication and database management.
- **TensorFlow.js**: Machine learning library for analytics.
- **Recharts**: Data visualization library.
- **TypeScript**: Type-safe development.
- **Zustand**: State management.

---

## Future Enhancements

1. **Advanced Analytics**: Add predictive models for emissions trends.
2. **User Customization**: Allow users to upload custom datasets.
3. **Mobile Support**: Optimize the app for mobile devices.
4. **API Integration**: Fetch real-time emissions data from external sources.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
