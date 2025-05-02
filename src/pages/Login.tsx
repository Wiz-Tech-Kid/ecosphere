import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabaseClient";
import {
  FiMail,
  FiLock,
  FiUser,
  FiArrowRight,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import * as THREE from "three";
import NET from "vanta/dist/vanta.net.min";


const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const vantaRef = useRef<HTMLDivElement>(null);

  // Vanta.js setup
  useEffect(() => {
    const vantaEffect = NET({
      el: vantaRef.current,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0x19b895, // Updated color (teal)
      backgroundColor: 0x7202e, // Updated background color (dark teal)
      spacing: 14.0, // Updated spacing
      THREE,
    });

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  // Fields for both login & signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup‐only fields
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [states, setStates] = useState<string[]>([]);

  const countryStates: Record<string, string[]> = {
    Botswana: ["Gaborone", "Francistown", "Maun", "Kasane", "Serowe"],
    "South Africa": ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape"],
  };

  useEffect(() => {
    setStates(countryStates[country] || []);
    setStateRegion("");
  }, [country]);

  // Show/hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    // Basic client-side checks
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    if (!tosAccepted) {
      setErrorMessage("You must accept the Terms of Service");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setErrorMessage("Account created! Check your email to verify.");
      // TODO: write firstName/lastName/etc into your user table or profile here
    } catch (err: any) {
      setErrorMessage(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  return (
    <div ref={vantaRef} className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-[#0a2a4a] rounded-xl shadow-2xl overflow-hidden border border-[#1a4b7a]">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#1a4b7a] rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img
                src="/assets/icon.jpeg" // Path to icon
                alt="App Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#e1f5fe]">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm text-[#81d4fa] mt-1">
              {isLogin
                ? "Sign in to continue to your dashboard"
                : "Get started with your new account"}
            </p>
          </div>

          {/* Error / Info */}
          {errorMessage && (
            <div className="mb-6 p-3 bg-[#1a3a5a] border border-[#2d5a7a] text-[#ff8a80] rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Social Login */}
          {!isLogin && (
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center mb-4 py-3 border border-[#1a4b7a] rounded-lg text-[#e1f5fe] hover:bg-[#1a4b7a] transition"
            >
              <FaGoogle className="mr-2" /> Sign up with Google
            </button>
          )}

          {/* Form */}
          <form
            onSubmit={isLogin ? handleLogin : handleSignUp}
            className="space-y-5"
          >
            {/* Signup-only fields */}
            {!isLogin && (
              <>
                {/* First & Last Name */}
                <div>
                  <label className="block text-sm font-medium text-[#b3e5fc] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0e3155] border border-[#1a4b7a] rounded-lg text-[#e1f5fe] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b3e5fc] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0e3155] border border-[#1a4b7a] rounded-lg text-[#e1f5fe] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                    required
                  />
                </div>
                {/* Country / State */}
                <div>
                  <label className="block text-sm font-medium text-[#b3e5fc] mb-1">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0e3155] border border-[#1a4b7a] rounded-lg text-[#e1f5fe] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                    required
                  >
                    <option value="">Select country</option>
                    {Object.keys(countryStates).map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b3e5fc] mb-1">
                    State/Region
                  </label>
                  <select
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0e3155] border border-[#1a4b7a] rounded-lg text-[#e1f5fe] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                    required
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                {/* DOB */}
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#b3e5fc] mb-1">
                      Year of Birth
                    </label>
                    <select
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0e3155] border border-[#1a4b7a] rounded-lg text-[#e1f5fe] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 100 }, (_, i) => {
                        const yr = new Date().getFullYear() - i;
                        return (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#b3e5fc] mb-1">
                      Month of Birth
                    </label>
                    <select
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0e3155] border border-[#1a4b7a] rounded-lg text-[#e1f5fe] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                    >
                      <option value="">Month</option>
                      {[
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#b3e5fc] mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-[#4fc3f7]" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0e3155] border border-[#1a4b7a] rounded-lg text-[#e1f5fe] placeholder-[#4d7ca8] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#b3e5fc] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-[#4fc3f7]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#0e3155] border border-[#1a4b7a] rounded-lg text-[#e1f5fe] placeholder-[#4d7ca8] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((b) => !b)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4fc3f7]"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#b3e5fc] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-[#4fc3f7]" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-[#0e3155] border border-[#1a4b7a] rounded-lg text-[#e1f5fe] placeholder-[#4d7ca8] focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((b) => !b)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4fc3f7]"
                  >
                    {showConfirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            )}

            {/* Terms of Service */}
            {!isLogin && (
              <div className="flex items-center">
                <input
                  id="tos"
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="h-4 w-4 text-[#4fc3f7] focus:ring-[#4fc3f7] border-[#1a4b7a] rounded bg-[#0e3155]"
                />
                <label htmlFor="tos" className="ml-2 text-sm text-[#81d4fa]">
                  I accept the{" "}
                  <a href="/terms" className="underline">
                    Terms of Service
                  </a>{" "}
                  &{" "}
                  <a href="/privacy" className="underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
            )}

            {/* Remember / Forgot */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#4fc3f7] focus:ring-[#4fc3f7] border-[#1a4b7a] rounded bg-[#0e3155]"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-[#81d4fa]">
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/reset-password")}
                  className="text-sm text-[#4fc3f7] hover:text-[#81d4fa]"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-[#1a6fc9] to-[#0d47a1] hover:from-[#1a6fc9]/90 hover:to-[#0d47a1]/90 text-white font-medium rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4fc3f7] focus:ring-offset-2 focus:ring-offset-[#0a2a4a] disabled:opacity-70"
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <FiArrowRight className="-ml-1 mr-2" />
              )}
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage(null);
              }}
              className="font-medium text-[#4fc3f7] hover:text-[#81d4fa]"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
