export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) {
    return '\u20B90.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const paymentLabels = {
  CASH: 'Cash',
  CARD: 'Card',
  UPI: 'UPI',
  OTHER: 'Other',
};

export function getPaymentMethodLabel(method) {
  return paymentLabels[method] || 'Other';
}

const paymentColors = {
  CASH: 'badge-cash',
  CARD: 'badge-card',
  UPI: 'badge-upi',
  OTHER: 'badge-other',
};

export function getPaymentMethodColor(method) {
  return paymentColors[method] || 'badge-other';
}
