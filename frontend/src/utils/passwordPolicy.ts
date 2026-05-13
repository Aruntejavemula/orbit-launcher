const SEQUENTIAL_RUNS = [
  "0123456789",
  "abcdefghijklmnopqrstuvwxyz",
  "qwertyuiop", "asdfghjkl", "zxcvbnm",
];

const COMMON = new Set([
  "password", "password1", "123456", "1234567", "12345678",
  "123456789", "1234567890", "111111", "000000", "qwerty",
  "abc123", "letmein", "welcome", "monkey", "dragon",
]);

export function validatePassword(password: string, email: string): string | null {
  if (password.length < 8) return "At least 8 characters required.";
  if (!/[A-Za-z]/.test(password)) return "Must contain at least one letter.";
  if (!/[0-9]/.test(password)) return "Must contain at least one number.";

  const lower = password.toLowerCase();

  if (COMMON.has(lower)) return "Password is too common. Choose something more unique.";

  for (const run of SEQUENTIAL_RUNS) {
    for (let n = 4; n <= run.length; n++) {
      const chunk = run.slice(0, n);
      if (lower.includes(chunk) || lower.includes(chunk.split("").reverse().join("")))
        return `Must not contain sequential patterns like "${chunk}".`;
    }
  }

  const local = email.split("@")[0].toLowerCase();
  if (local && lower.includes(local)) return "Must not contain your email address.";

  return null;
}
