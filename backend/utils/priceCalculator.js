class PriceCalculator {
  /**
   * Calculate target price and format result
   * @param {string} refNumber - Watch reference number
   * @param {number} minPrice - Minimum price from range
   * @param {number} maxPrice - Maximum price from range
   * @returns {object} Formatted result object
   */
  calculateTargetPrice(refNumber, minPrice, maxPrice) {
    if (!refNumber || typeof refNumber !== 'string') {
      throw new Error('Invalid reference number provided');
    }

    if (!minPrice || !maxPrice || minPrice <= 0 || maxPrice <= 0) {
      throw new Error('Invalid price range provided');
    }

    // Ensure min/max are in correct order
    const actualMin = Math.min(minPrice, maxPrice);
    const actualMax = Math.max(minPrice, maxPrice);

    // Calculate target price (80% of minimum price)
    const targetPrice = Math.round(actualMin * 0.8);

    // Calculate market average (midpoint of range)
    const marketAverage = Math.round((actualMin + actualMax) / 2);

    // Determine confidence level based on price range spread
    const priceSpread = actualMax - actualMin;
    const spreadPercentage = (priceSpread / actualMin) * 100;

    let confidence;
    if (spreadPercentage <= 15) {
      confidence = 'High';
    } else if (spreadPercentage <= 30) {
      confidence = 'Medium';
    } else {
      confidence = 'Low';
    }

    const result = {
      refNumber: refNumber.toUpperCase().trim(),
      targetPrice: targetPrice,
      marketAverage: marketAverage,
      confidence: confidence,
      priceRange: {
        min: actualMin,
        max: actualMax,
        spreadPercentage: Math.round(spreadPercentage * 100) / 100,
      },
      calculation: {
        multiplier: 0.8,
        basedOnMinPrice: actualMin,
      },
      timestamp: new Date().toISOString(),
    };

    return result;
  }

  /**
   * Format price for display
   * @param {number} amount - Price amount
   * @param {string} currency - Currency code (default: USD)
   * @returns {string} Formatted price string
   */
  formatPrice(amount, currency = 'USD') {
    if (!amount || isNaN(amount)) {
      return '$0';
    }

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(Math.round(amount));
  }

  /**
   * Parse price string and extract numeric value
   * @param {string} priceString - Price string (e.g., "$1,234", "1.234 €")
   * @returns {number} Numeric price value
   */
  parsePriceString(priceString) {
    if (!priceString || typeof priceString !== 'string') {
      throw new Error('Invalid price string provided');
    }

    // Remove all non-numeric characters except decimal points
    const numericString = priceString.replace(/[^0-9.,]/g, '');

    // Handle different decimal separators
    let cleanedString = numericString;

    // If there are multiple commas or periods, treat the last one as decimal separator
    const commaCount = (cleanedString.match(/,/g) || []).length;
    const periodCount = (cleanedString.match(/\./g) || []).length;

    if (commaCount > 0 && periodCount > 0) {
      // Both present - last one is likely decimal separator
      const lastCommaIndex = cleanedString.lastIndexOf(',');
      const lastPeriodIndex = cleanedString.lastIndexOf('.');

      if (lastPeriodIndex > lastCommaIndex) {
        // Period is decimal separator
        cleanedString = cleanedString.replace(/,/g, '');
      } else {
        // Comma is decimal separator
        cleanedString = cleanedString.replace(/\./g, '').replace(/,/g, '.');
      }
    } else if (commaCount > 1) {
      // Multiple commas - likely thousands separators
      cleanedString = cleanedString.replace(/,/g, '');
    } else if (periodCount > 1) {
      // Multiple periods - likely thousands separators
      cleanedString = cleanedString.replace(/\./g, '');
    } else if (commaCount === 1) {
      // Single comma - could be decimal or thousands separator
      const parts = cleanedString.split(',');
      if (parts[1] && parts[1].length <= 2) {
        // Likely decimal separator
        cleanedString = cleanedString.replace(',', '.');
      } else {
        // Likely thousands separator
        cleanedString = cleanedString.replace(',', '');
      }
    }

    const parsed = parseFloat(cleanedString);

    if (isNaN(parsed)) {
      throw new Error(`Could not parse price from: ${priceString}`);
    }

    return parsed;
  }

  /**
   * Validate price range
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {object} Validation result
   */
  validatePriceRange(minPrice, maxPrice) {
    const errors = [];

    if (!minPrice || isNaN(minPrice) || minPrice <= 0) {
      errors.push('Minimum price must be a positive number');
    }

    if (!maxPrice || isNaN(maxPrice) || maxPrice <= 0) {
      errors.push('Maximum price must be a positive number');
    }

    if (minPrice && maxPrice && minPrice > maxPrice) {
      errors.push('Minimum price cannot be greater than maximum price');
    }

    // Check for reasonable price range (not too extreme)
    if (minPrice && maxPrice) {
      const ratio = maxPrice / minPrice;
      if (ratio > 10) {
        errors.push('Price range appears unusually large (max/min ratio > 10:1)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Get confidence explanation
   * @param {string} confidence - Confidence level
   * @returns {string} Explanation text
   */
  getConfidenceExplanation(confidence) {
    const explanations = {
      High: 'Price range is tight (≤15% spread), indicating stable market pricing',
      Medium: 'Price range has moderate spread (16-30%), typical market variation',
      Low: 'Price range has wide spread (>30%), indicating volatile or uncertain pricing',
    };

    return explanations[confidence] || 'Unknown confidence level';
  }
}

module.exports = new PriceCalculator();
