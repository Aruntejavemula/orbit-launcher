function calcScore(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.max(1, s);
}

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = calcScore(password);
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Very strong"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#6B8F71", "#2E4332"];
  return (
    <div>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ background: i < score ? colors[score - 1] : "var(--line)" }}
          />
        ))}
      </div>
      <p className="mt-1 text-xs" style={{ color: colors[score - 1] ?? "var(--text-muted)" }}>
        {labels[score - 1] ?? ""}
      </p>
    </div>
  );
}
