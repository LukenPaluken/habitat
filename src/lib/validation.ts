// Small checks shared by several forms.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** At least `min` digits, so "011 4444-5555" and "+54 9 11 4444 5555" both pass. */
export function hasEnoughDigits(phone: string, min = 6): boolean {
  return phone.replace(/\D/g, "").length >= min;
}
