# Ecosphere App

Ecosphere is a React-based web application designed to provide users with tools for environmental tracking, analytics, and calculations. It includes features such as user authentication, a dashboard, analytics, a calculator, an emission tracker, and settings management. Below is a detailed technical documentation of the app.

---

## Table of Contents
1. [Overview](#overview)
2. [Screens and Features](#screens-and-features)
   - [Landing Page](#landing-page)
   - [Login](#login)
   - [Password Reset](#password-reset)
   - [Dashboard](#dashboard)
   - [Analytics](#analytics)
   - [Calculator](#calculator)
   - [Emission Tracker](#emission-tracker)
   - [Settings](#settings)
3. [Protected Routes](#protected-routes)
4. [File Structure](#file-structure)
5. [Technologies Used](#technologies-used)

---

## Overview

The Ecosphere app is built using React and leverages Supabase for user authentication and session management. It uses `react-router-dom` for routing and `React.lazy` for code-splitting and lazy loading of components. The app is styled with a combination of custom CSS and utility classes.

---

## Screens and Features

### Landing Page
- **Path**: `/`
- **Description**: The landing page serves as the entry point for the application. It provides an overview of the app's purpose and features.
- **Implementation**: A simple React component rendered at the root path.

### Login
- **Path**: `/login`
- **Description**: Allows users to log in to their accounts using credentials managed by Supabase.
- **Implementation**: Uses Supabase's `auth` API to handle user authentication.

### Password Reset
- **Path**: `/reset-password`
- **Description**: Provides functionality for users to reset their passwords.
- **Implementation**: Integrates with Supabase's password reset functionality.

### Dashboard
- **Path**: `/dashboard`
- **Description**: Displays an overview of the user's data and key metrics.
- **Implementation**: Dynamically loaded using `React.lazy` and rendered within a protected route.

### Analytics
- **Path**: `/analytics`
- **Description**: Provides detailed analytics and insights based on user data.
- **Implementation**: Dynamically loaded using `React.lazy` and rendered within a protected route.

### Calculator
- **Path**: `/calculator`
- **Description**: Offers tools for performing environmental calculations, such as carbon footprint estimations.
- **Implementation**: Dynamically loaded using `React.lazy` and rendered within a protected route.

### Emission Tracker
- **Path**: `/emission_tracker`
- **Description**: Tracks and logs the user's emissions over time.
- **Implementation**: Dynamically loaded using `React.lazy` and rendered within a protected route.

### Settings
- **Path**: `/settings`
- **Description**: Allows users to manage their account settings and preferences.
- **Implementation**: Dynamically loaded using `React.lazy` and rendered within a protected route.

---

## Protected Routes

The app uses a `ProtectedRoute` component to ensure that certain routes are only accessible to authenticated users. This component:
1. Fetches the current session using Supabase's `auth.getSession` method.
2. Listens for authentication state changes using `auth.onAuthStateChange`.
3. Displays a loading indicator while the session is being verified.
4. Redirects unauthenticated users to the `/login` page.

---

## File Structure

```
src/
├── App.tsx                # Main application file
├── pages/                 # Contains page components (e.g., Login, LandingPage, PasswordReset)
├── scenes/                # Contains feature-specific components (e.g., Dashboard, Analytics)
│   ├── global/            # Shared components like Sidebar and Topbar
│   ├── dashboard/         # Dashboard-specific components
│   ├── analytics/         # Analytics-specific components
│   ├── calculator/        # Calculator-specific components
│   ├── emission_tracker/  # Emission Tracker-specific components
│   └── settings/          # Settings-specific components
├── utils/                 # Utility files (e.g., Supabase client)
└── index.tsx              # Entry point for the React app
```

---

## Technologies Used

- **React**: Frontend framework for building user interfaces.
- **React Router**: For client-side routing.
- **Supabase**: Backend-as-a-service for authentication and database management.
- **TypeScript**: For type-safe development.
- **React.lazy**: For code-splitting and lazy loading.
- **CSS**: For styling the application.

---

## How It Works

1. **Routing**: The app uses `react-router-dom` to define routes for each screen. Protected routes are wrapped in the `ProtectedRoute` component.
2. **Authentication**: Supabase handles user authentication and session management.
3. **Lazy Loading**: Non-essential components are loaded dynamically using `React.lazy` to improve performance.
4. **State Management**: Local state is managed using React's `useState` and `useEffect` hooks.

---

## Getting Started

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Set up environment variables for Supabase (e.g., `VITE_BASE_PATH`).
4. Run the app using `npm start`.

---

## Future Enhancements

- Add more detailed analytics and reporting features.
- Improve the UI/UX for better user engagement.
- Integrate additional third-party APIs for environmental data.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
