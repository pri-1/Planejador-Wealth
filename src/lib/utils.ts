import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(value: number, locale: string = 'pt', currency: string = 'BRL'): string {
  const dateLocale = locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(dateLocale, {
    style: "currency",
    currency: currency,
  }).format(value);
}
