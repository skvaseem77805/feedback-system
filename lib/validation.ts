export const OFFICIAL_REGISTRATION_FORMAT_MSG = "Invalid Registration Number.\nExpected format: 2*B8*A****\nExample: 24B81A05U2";

export function validateRegistrationNo(value: string | null | undefined): { isValid: boolean; cleaned: string; error?: string } {
  if (!value) {
    return { isValid: false, cleaned: '', error: 'Registration Number is required.' };
  }
  const cleaned = value.trim().toUpperCase();
  // Pos 1: 2
  // Pos 2: [0-9]
  // Pos 3: B
  // Pos 4: 8
  // Pos 5: [A-Z0-9]
  // Pos 6: A
  // Pos 7-10: [A-Z0-9]{4}
  const regNoPattern = /^2[0-9]B8[A-Z0-9]A[A-Z0-9]{4}$/;
  const isValid = regNoPattern.test(cleaned);
  return {
    isValid,
    cleaned,
    error: isValid ? undefined : OFFICIAL_REGISTRATION_FORMAT_MSG
  };
}
