const formatter = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 });

// 59600 → "59 600 zł"
export function formatZl(value) {
  return formatter.format(value);
}
