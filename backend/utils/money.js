/**
 * Discovery Uttarakhand - Money utilities
 * Safely converts a major-unit decimal amount (e.g., 999.50) into an integer minor unit (e.g., 99950).
 * Avoids raw floating-point arithmetic.
 */
export function toMinorUnit(amount, precision = 2) {
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    throw new Error('Amount must be a number or string');
  }
  
  // Use toFixed to normalize string representation (handles missing decimals, etc.)
  const numStr = Number(amount).toFixed(precision);
  
  if (numStr === 'NaN') {
    throw new Error('Invalid amount format');
  }

  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || ''.padEnd(precision, '0');
  
  const minorUnits = parseInt(integerPart + decimalPart, 10);
  
  if (isNaN(minorUnits) || minorUnits <= 0) {
    throw new Error('Invalid or zero amount calculated');
  }
  
  return minorUnits;
}
