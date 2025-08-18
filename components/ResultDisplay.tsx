import React, { useState } from 'react';
import type { EvaluationResult } from '../types';

interface ResultDisplayProps {
  result: EvaluationResult;
}

function ResultDisplay({ result }: ResultDisplayProps): React.ReactNode {
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='w-full max-w-md bg-charcoal-slate backdrop-blur-sm border border-platinum-silver/20 rounded-lg p-6 animate-fade-in text-left shadow-2xl'>
      <h3 className='text-lg font-semibold text-platinum-silver/70 mb-1'>
        Evaluation for: <span className='text-platinum-silver font-bold'>{result.refNumber}</span>
      </h3>

      <div className='mt-4 flex flex-col gap-4'>
        <div className='flex justify-between items-baseline'>
          <p className='text-platinum-silver/70 text-xl'>Target Buy Price:</p>
          <p className='text-3xl font-bold text-money-green'>{formatCurrency(result.targetPrice)}</p>
        </div>

        <div className='flex justify-between items-baseline'>
          <p className='text-platinum-silver/70'>Market Average:</p>
          <p className='text-lg font-medium text-champagne-gold'>{formatCurrency(result.marketAverage)}</p>
        </div>

        <div className='flex justify-between items-baseline'>
          <p className='text-platinum-silver/70'>Confidence:</p>
          <p
            className={`text-lg font-bold ${
              result.confidence === 'High'
                ? 'text-money-green'
                : result.confidence === 'Medium'
                  ? 'text-champagne-gold'
                  : 'text-crimson-red'
            }`}
          >
            {result.confidence}
          </p>
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className='text-platinum-silver/70 hover:text-champagne-gold transition-colors text-sm underline mt-2'
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {/* Detailed Information */}
        {showDetails && (
          <div className='mt-4 pt-4 border-t border-platinum-silver/20 space-y-3 text-sm'>
            <div className='flex justify-between'>
              <span className='text-platinum-silver/70'>Price Range:</span>
              <span className='text-platinum-silver'>
                {formatCurrency(result.priceRange.min)} - {formatCurrency(result.priceRange.max)}
              </span>
            </div>

            <div className='flex justify-between'>
              <span className='text-platinum-silver/70'>Spread:</span>
              <span className='text-platinum-silver'>{result.priceRange.spreadPercentage}%</span>
            </div>

            <div className='flex justify-between'>
              <span className='text-platinum-silver/70'>Calculation:</span>
              <span className='text-platinum-silver'>
                {Math.round(result.calculation.multiplier * 100)}% of minimum
              </span>
            </div>

            <div className='flex justify-between'>
              <span className='text-platinum-silver/70'>Updated:</span>
              <span className='text-platinum-silver'>{formatDate(result.timestamp)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultDisplay;
