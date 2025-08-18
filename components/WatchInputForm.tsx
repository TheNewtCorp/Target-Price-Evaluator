import React, { useState } from 'react';

interface WatchInputFormProps {
  onEvaluate: (refNumber: string) => void;
  isLoading: boolean;
}

function WatchInputForm({ onEvaluate, isLoading }: WatchInputFormProps): React.ReactNode {
  const [refNumber, setRefNumber] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoading) {
      onEvaluate(refNumber);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col items-center gap-6">
      <div className="relative w-full group">
        <input
          type="text"
          id="refNumber"
          value={refNumber}
          onChange={(e) => setRefNumber(e.target.value)}
          className="block w-full px-4 py-3 text-lg text-platinum-silver bg-charcoal-slate border-2 border-platinum-silver/30 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-champagne-gold peer transition-colors duration-300"
          placeholder=" "
          disabled={isLoading}
        />
        <label
          htmlFor="refNumber"
          className="absolute text-lg text-platinum-silver/70 duration-300 transform top-3 z-10 origin-[0] left-4 peer-focus:text-champagne-gold peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-7 opacity-0 peer-placeholder-shown:opacity-100"
        >
          Reference Number (e.g., 116500LN)
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-6 bg-money-green text-white font-bold text-lg rounded-lg shadow-lg shadow-money-green/30 hover:brightness-95 transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-money-green/50 disabled:bg-charcoal-slate disabled:text-platinum-silver/50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {isLoading ? 'Evaluating...' : 'Evaluate'}
      </button>
    </form>
  );
}

export default WatchInputForm;