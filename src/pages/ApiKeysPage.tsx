import { useState } from "react";
import { Copy, KeyRound, Plus, Trash2, Check } from "lucide-react";
import { usePrefs } from "../context/PreferencesContext";
import { relativeTime } from "../utils/time";

export default function ApiKeysPage() {
  const { apiKeys, createApiKey, revokeApiKey } = usePrefs();
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const k = createApiKey(name.trim() || "Untitled key");
    setRevealed(k.id);
    setName("");
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">API Keys</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Generate keys to automate Orbit — list apps, log opens, manage subscriptions.
        </p>
      </header>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <h2 className="mb-3 font-display text-lg font-semibold">Create a key</h2>
        <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row">
          <input
            className="field flex-1"
            placeholder="e.g. Zapier integration"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} /> Generate key
          </button>
        </form>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Keys are stored locally in your browser and never sent to a server in this demo.
        </p>
      </section>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <h2 className="mb-3 font-display text-lg font-semibold">Your keys</h2>
        {apiKeys.length === 0 ? (
          <div className="grid place-items-center rounded-xl py-10" style={{ background: "var(--bg-deep)" }}>
            <KeyRound size={28} className="text-sage" />
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              No keys yet. Create one above to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {apiKeys.map((k) => {
              const isRevealed = revealed === k.id;
              const display = isRevealed
                ? `${k.prefix}${k.secret}`
                : `${k.prefix}${k.secret.slice(0, 4)}••••••••••••••${k.secret.slice(-4)}`;
              return (
                <li key={k.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-lg bg-sage-soft text-sage-ink"
                    >
                      <KeyRound size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{k.name}</div>
                      <div className="truncate font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {display}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>Created {relativeTime(k.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRevealed(isRevealed ? null : k.id)}
                      className="btn"
                      style={{ background: "var(--bg-deep)", color: "var(--text)" }}
                    >
                      {isRevealed ? "Hide" : "Reveal"}
                    </button>
                    <button
                      onClick={() => copy(`${k.prefix}${k.secret}`, k.id)}
                      className="btn"
                      style={{ background: "var(--bg-deep)", color: "var(--text)" }}
                      title="Copy full key"
                    >
                      {copied === k.id ? <Check size={14} /> : <Copy size={14} />}
                      {copied === k.id ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Revoke "${k.name}"? Anything using it will break.`)) {
                          revokeApiKey(k.id);
                        }
                      }}
                      className="btn bg-red-50 text-red-700 hover:bg-red-100"
                      aria-label="Revoke key"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <h2 className="mb-3 font-display text-lg font-semibold">Quick start</h2>
        <pre
          className="overflow-x-auto rounded-xl p-4 text-xs"
          style={{ background: "var(--bg-deep)", color: "var(--text)" }}
        >
{`# List your apps
curl https://api.orbit.app/v1/apps \\
  -H "Authorization: Bearer ok_live_..."

# Log an app open
curl -X POST https://api.orbit.app/v1/apps/notion/opens \\
  -H "Authorization: Bearer ok_live_..."`}
        </pre>
      </section>
    </div>
  );
}
