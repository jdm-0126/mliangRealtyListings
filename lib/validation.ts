// lib/validation.ts

/**
 * Validates a Philippine mobile number.
 * Returns true iff the string matches /^09\d{9}$/ — exactly 11 characters
 * starting with "09" followed by 9 digits.
 *
 * Validates: Requirement 6.1 (Property 12)
 */
export function validateContactNumber(s: string): boolean {
  return /^09\d{9}$/.test(s)
}
