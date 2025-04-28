import React, { useEffect } from "react";
import supabase from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login error:", error.message);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("Sign-up error:", error.message);
    }
  };

  return (
    <div className="animated-background flex items-center justify-center">
      <div className="relative z-10 bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            handleLogin(email, password);
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
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
        <p
          className="text-sm text-center mt-4 cursor-pointer text-blue-500"
          onClick={() => {
            const email = prompt("Enter your email:");
            const password = prompt("Enter your password:");
            if (email && password) {
              handleSignUp(email, password);
            }
          }}
        >
          Don't have an account? Sign Up
        </p>
      </div>
    </div>
  );
};

export default Login;
