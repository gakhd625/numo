const PESO_SYMBOL = '\u20B1';

const numberFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPesoAmount(value) {
  const numericValue = Number(value || 0);
  return `${PESO_SYMBOL}${numberFormatter.format(Number.isFinite(numericValue) ? numericValue : 0)}`;
}

export function formatSignedPesoAmount(value, type = 'expense') {
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${formatPesoAmount(value)}`;
}

export const PESO = PESO_SYMBOL;
