# Ecosphere: Carbon Footprint Calculator and Sustainability Dashboard

## Overview
Ecosphere is a React-based web application designed to help users monitor, analyze, and manage their carbon emissions. It integrates real-time data tracking, predictive analytics, and machine learning to provide actionable insights for sustainability.

---

## Features
### 1. **Dashboard**
- Provides an overview of emissions data, including KPIs, trends, and recent activities.
- Visualizations include doughnut charts and bar charts for energy comparisons.

### 2. **Emission Tracker**
- Tracks real-time and historical emissions data.
- Supports regional comparisons and energy mix breakdowns.
- Uses `@nivo` and `recharts` for visualizations.

### 3. **Calculator**
- Allows users to calculate emissions across Scope 1, Scope 2, and Scope 3 categories.
- Provides detailed breakdowns and supports exporting reports.

### 4. **Analytics**
- Offers advanced visualizations like Sankey diagrams and sensitivity analysis.
- Includes carbon intensity and renewable energy mix comparisons.

### 5. **Authentication**
- Uses Supabase for user authentication.
- Protects routes to ensure only logged-in users can access the app.

---

## Installation
### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account for authentication

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/ecosphere.git
   cd ecosphere
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```properties
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     REACT_APP_LLM_API_URL=https://api.example.com/llm
     REACT_APP_LLM_API_KEY=your-llm-api-key
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## File Structure
```
ecosphere/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── data/               # Emissions datasets
│   ├── hooks/              # Custom React hooks
│   ├── scenes/             # App pages and features
│   │   ├── dashboard/      # Dashboard page
│   │   ├── analytics/      # Analytics page
│   │   ├── calculator/     # Calculator page
│   │   ├── emission_tracker/ # Emission Tracker page
│   │   ├── global/         # Global components (e.g., Sidebar, Topbar)
│   ├── stores/             # State management using Zustand
│   ├── utils/              # Utility functions (e.g., Supabase client, ML analytics)
│   ├── index.css           # Global styles
│   ├── main.tsx            # App entry point
│   ├── App.tsx             # Main app component
├── .env                    # Environment variables
├── package.json            # Project dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # Project documentation
```

---

## Key Technologies
- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Charts**: `chart.js`, `@nivo`, `recharts`
- **Authentication**: Supabase
- **Build Tool**: Vite

---

## Development Tools
### Recommended VS Code Extensions
1. **ESLint**: Linting and code quality checks.
2. **Prettier**: Code formatting.
3. **Tailwind CSS IntelliSense**: Autocompletion and linting for Tailwind CSS.
4. **React Developer Tools**: Debugging React components.
5. **Supabase**: Manage Supabase projects directly from VS Code.
6. **AutoDocstring**: Automatically generate documentation for functions and components.

---

## How to Generate Documentation Automatically
### Recommended Extensions
1. **AutoDocstring**:
   - Automatically generates docstrings for functions and components.
   - Install from the VS Code marketplace.

2. **Docz**:
   - A documentation generator for React components.
   - Install and configure:
     ```bash
     npm install docz
     ```

3. **TypeDoc**:
   - Generates documentation from TypeScript code.
   - Install and run:
     ```bash
     npm install typedoc
     npx typedoc --out docs src
     ```

4. **JSDoc**:
   - Add inline comments to your code, and generate documentation:
     ```bash
     npm install jsdoc
     npx jsdoc -c jsdoc.json
     ```

---

## Deployment
### Hosting on Vercel
1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy the app:
   ```bash
   vercel
   ```

3. Add environment variables in the Vercel dashboard.

---

## Contributing
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```

3. Commit your changes:
   ```bash
   git commit -m "Add feature-name"
   ```

4. Push to the branch:
   ```bash
   git push origin feature-name
   ```

5. Open a pull request.

---

## License
This project is licensed under the MIT License.
