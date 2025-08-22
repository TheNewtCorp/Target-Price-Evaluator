import React, { useState } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import WatchInputForm from './components/WatchInputForm';
import ResultDisplay from './components/ResultDisplay';
import type { EvaluationResult, ApiResponse, ApiError } from './types';

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://target-price-evaluator.onrender.com';

function App(): React.ReactNode {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async (refNumber: string) => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refNumber: refNumber.trim() }),
      });

      if (!response.ok) {
        // Handle different error types from the backend
        const errorData: ApiError = await response.json().catch(() => ({
          error: 'Network Error',
          message: `Request failed with status ${response.status}`,
        }));

        let userFriendlyMessage: string;

        switch (response.status) {
          case 400:
            userFriendlyMessage = 'Invalid reference number provided. Please check and try again.';
            break;
          case 401:
            userFriendlyMessage = 'Authentication failed. Backend service needs configuration.';
            break;
          case 403:
            userFriendlyMessage = 'Access denied. The request was blocked by anti-bot protection.';
            break;
          case 404:
            userFriendlyMessage = `No results found for reference number "${refNumber}". Please verify the reference number.`;
            break;
          case 500:
            userFriendlyMessage = 'Server error occurred. Please try again later.';
            break;
          default:
            userFriendlyMessage = errorData.message || 'An unexpected error occurred.';
        }

        setError(userFriendlyMessage);
        return;
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError('Invalid response from server. Please try again.');
      }
    } catch (networkError) {
      // Handle network errors (server not running, connection issues, etc.)
      if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
        setError('Cannot connect to the evaluation service. Please ensure the backend server is running.');
      } else {
        setError('Network error occurred. Please check your connection and try again.');
      }
      console.error('API Request failed:', networkError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans text-platinum-silver p-4'>
      <AnimatedBackground />
      <main className='z-10 flex flex-col items-center justify-center text-center w-full max-w-2xl'>
        <header className='mb-12'>
          <h1 className='text-5xl md:text-6xl font-extrabold text-platinum-silver tracking-tight mb-2'>
            Target Price <span className='text-champagne-gold'>Evaluator</span>
          </h1>
          <p className='text-platinum-silver/70 text-lg md:text-xl'>
            Enter a luxury watch reference number to get its target buy price.
          </p>
        </header>

        <WatchInputForm onEvaluate={handleEvaluate} isLoading={isLoading} />

        <div className='mt-12 w-full h-48 flex items-center justify-center'>
          {isLoading ? (
            <div className='flex flex-col items-center gap-4'>
              <svg
                className='animate-spin h-8 w-8 text-champagne-gold'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              <p className='text-platinum-silver/70'>Analyzing Chrono24 market data...</p>
            </div>
          ) : error ? (
            <div className='bg-crimson-red/20 border border-crimson-red/40 p-4 rounded-lg max-w-md'>
              <p className='text-crimson-red'>{error}</p>
            </div>
          ) : result ? (
            <ResultDisplay result={result} />
          ) : (
            <p className='text-platinum-silver/40'>Evaluation results will appear here.</p>
          )}
        </div>

        <footer className='absolute bottom-4 text-platinum-silver/40 text-sm'>
          <p>For Educational Purposes Only</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
