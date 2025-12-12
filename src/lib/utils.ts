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
  const formatted = realValue.toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return formatted + ' Kz';
}
