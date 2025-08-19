export interface EvaluationResult {
  refNumber: string;
  targetPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  marketAverage?: number; // Keep for backward compatibility
  confidence: 'High' | 'Medium' | 'Low';
  priceRange: {
    min: number;
    max: number;
    spreadPercentage: number;
  };
  calculation: {
    multiplier: number;
    basedOnMinPrice: number;
  };
  timestamp: string;
}

export interface ApiResponse {
  success: boolean;
  data: EvaluationResult;
  processingTime: string;
}

export interface ApiError {
  error: string;
  message: string;
}
