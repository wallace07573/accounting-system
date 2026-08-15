import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  
  // Try to clean out common separators to see if it's purely digits, but keep +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it already has a plus at the start, just return the cleaned string without spaces
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If it starts with 60 or 65, add +
  if (cleaned.startsWith('60') || cleaned.startsWith('65')) {
    return '+' + cleaned;
  }

  // Malaysia mobile (01x) or landline (03, 04, etc)
  if (cleaned.startsWith('0')) {
    return '+60' + cleaned.substring(1);
  }

  // Singapore mobile (8 or 9, 8 digits long)
  if (/^[89]\d{7}$/.test(cleaned)) {
    return '+65' + cleaned;
  }

  // Fallback
  return phone;
}

