import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError(null); // Reset error message
    setIsLoading(true); // Set loading state to true

    try {
      const { success, error } = await signIn(email, password);
      
      if (!success) {
        setError(error || "Login failed");
        setIsLoading(false); // Stop loading
        return;
      }

      toast.success("Login successful!");
      // Navigate to the home page after successful login
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
      setIsLoading(false); // Stop loading in case of error
    }
  };

  return (
    <div className="w-full">
      <Navbar />

      <div className="w-[90%] md:max-w-md mx-auto mt-40 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl text-black font-bold mb-6 text-center">LOG IN</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            disabled={isLoading} // Disable button while loading
          >
            {isLoading ? "Logging in..." : "Log In"} {/* Conditional text */}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </div>
        
      </div>

    </div>

    
  );
};

export default Login;
