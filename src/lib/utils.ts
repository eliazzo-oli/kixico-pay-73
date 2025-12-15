import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(priceInCents: number) {
  const value = priceInCents / 100;
  const formatted = value.toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return formatted + ' AOA';
}

export function formatPriceFromDB(price: number) {
  // Prices are stored in cents (centavos), divide by 100 to get real value
  const realValue = price / 100;
  const formatted = realValue.toLocaleString('pt-AO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return formatted + ' Kz';
}

export function formatCurrency(value: number, currency: string = 'AOA') {
  const formatted = value.toLocaleString('pt-AO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return currency === 'AOA' ? formatted + ' Kz' : formatted + ' ' + currency;
}
