import React, { useState } from "react";

const LoginForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{isLogin ? "Login" : "Sign Up"}</h2>
      <form className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
        />
        {!isLogin && (
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-2 border rounded"
          />
        )}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>
      <p
        className="text-sm text-center mt-4 cursor-pointer text-blue-500"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
      </p>
    </div>
  );
};

export default LoginForm;
