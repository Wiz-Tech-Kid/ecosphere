import React, { useState } from "react";
import supabase from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Sign Up
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Error messages

  const handleLogin = async (email: string, password: string) => {
    setErrorMessage(null); // Clear previous errors
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error("Invalid email or password. Please try again.");
      }
      if (data.session) {
        navigate("/dashboard"); // Redirect to dashboard on success
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    setErrorMessage(null); // Clear previous errors
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw new Error("Sign-up failed. Please try again.");
      }
      setErrorMessage("Account created. Please check your email to confirm your account.");
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setErrorMessage(null); // Clear previous errors
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`, // Redirect back to login after reset
      });
      if (error) {
        throw new Error("Failed to send password reset email. Please try again.");
      }
      setErrorMessage("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="animated-background flex items-center justify-center">
      <div className="relative z-10 bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{isLogin ? "Login" : "Sign Up"}</h2>
        {errorMessage && (
          <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            if (isLogin) {
              handleLogin(email, password);
            } else {
              handleSignUp(email, password);
            }
          }}
          className="space-y-4"
        >
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            required
          />
          {!isLogin && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="w-full p-2 border rounded"
              required
            />
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
        {isLogin && (
          <p
            className="text-sm text-center mt-4 cursor-pointer text-blue-500"
            onClick={() => navigate("/reset-password")} // Redirect to Password Reset page
          >
            Forgot Password?
          </p>
        )}
        <p
          className="text-sm text-center mt-4 cursor-pointer text-blue-500"
          onClick={() => setIsLogin(!isLogin)} // Toggle between Login and Sign Up
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
};

export default Login;
