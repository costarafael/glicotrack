export const formatGlucoseValue = (value: number): string => {
  return `${value} mg/dL`;
};

export const formatInsulinUnits = (units: number, decimals: number = 0): string => {
  if (units === undefined || units === null || isNaN(units)) {
    console.warn('formatInsulinUnits: Valor inválido recebido:', units);
    return '0 U';
  }
  const rounded = parseFloat(units.toFixed(decimals));
  return `${rounded} U`;
};;


export const validateGlucoseValue = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 600;
};

export const validateInsulinUnits = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 100;
};

export const parseNumericInput = (value: string): number | null => {
  const num = parseFloat(value.replace(',', '.'));
  return isNaN(num) ? null : num;
};