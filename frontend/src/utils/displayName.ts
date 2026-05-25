import type { User } from "../types";

/** First name for greetings; never falls back to placeholder "there". */
export function displayFirstName(user: Pick<User, "name" | "email"> | null | undefined): string {
  const trimmed = user?.name?.trim() ?? "";
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0];
    if (first) return first;
  }
  const email = user?.email?.trim() ?? "";
  if (email.includes("@")) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return "";
}
