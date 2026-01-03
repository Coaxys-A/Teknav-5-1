export function validatePasswordPolicy(password: string) {
  const length = password.length >= 12;
  const upper = /[A-Z]/.test(password);
  const lower = /[a-z]/.test(password);
  const number = /\d/.test(password);
  const special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (length && upper && lower && number && special) return true;
  throw new Error('Password does not meet policy');
}
