import { useState } from "react";
import { Copy, KeyRound, Plus, Trash2, Check } from "lucide-react";
import { usePrefs } from "../context/PreferencesContext";
import { relativeTime } from "../utils/time";
import type { ApiKey } from "../types";
import ConfirmModal from "../components/ConfirmModal";

export default function ApiKeysPage() {
  const { apiKeys, createApiKey, revokeApiKey } = usePrefs();
  const [name, setName] = useState("");
  const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKey | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setCreating(true);
    try {
      const k = await createApiKey(name.trim());
      setNewSecret({ id: k.id, secret: k.secret });
      setName("");
    } finally {
      setCreating(false);
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const maskKey = (k: ApiKey) => `${k.prefix}••••••••••••••`;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">API Keys</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Generate keys to automate Remio — list apps, log opens, manage subscriptions.
        </p>
      </header>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <h2 className="mb-3 font-display text-lg font-semibold">Create a key</h2>
        <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex flex-1 flex-col gap-1">
            <input
              className={`field ${nameError ? "border-red-400 focus:ring-red-300" : ""}`}
              placeholder="e.g. Zapier integration"
              value={name}
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError(false); }}
            />
            {nameError && (
              <p className="text-xs text-red-600">Key name is required before generating.</p>
            )}
          </div>
          <button type="submit" disabled={creating} className="btn-primary disabled:opacity-60">
            <Plus size={16} /> {creating ? "Creating…" : "Generate key"}
          </button>
        </form>
        {newSecret && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="mb-1 text-xs font-medium text-amber-800">
              Copy your key now — it won't be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-xs text-amber-900">{newSecret.secret}</code>
              <button onClick={() => copy(newSecret.secret, newSecret.id)} className="btn bg-amber-100 text-amber-800 hover:bg-amber-200">
                {copied === newSecret.id ? <Check size={14} /> : <Copy size={14} />}
                {copied === newSecret.id ? "Copied" : "Copy"}
              </button>
              <button onClick={() => setNewSecret(null)} className="btn bg-amber-100 text-amber-800 hover:bg-amber-200">Done</button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <h2 className="mb-3 flex items-center font-display text-lg font-semibold">Your keys<span className="ml-auto text-xs font-medium text-ink-muted">{apiKeys.length} active</span></h2>
        {apiKeys.length === 0 ? (
          <div className="grid place-items-center rounded-xl py-10" style={{ background: "var(--bg-deep)" }}>
            <KeyRound size={28} className="text-sage" />
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              No keys yet. Create one above to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {apiKeys.map((k) => (
              <li key={k.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-sage-soft text-sage-ink">
                    <KeyRound size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{k.name}</div>
                    <div className="truncate font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {maskKey(k)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>Created {relativeTime(k.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmRevoke(k)}
                    className="btn bg-red-50 text-red-700 hover:bg-red-100"
                    aria-label="Revoke key"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
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
curl /api/apps \\
  -H "Authorization: Bearer <your-key>"

# Log an app launch
curl -X POST /api/apps/<id>/launch \\
  -H "Authorization: Bearer <your-key>"`}
        </pre>
      </section>

      <ConfirmModal
        open={!!confirmRevoke}
        title={`Revoke "${confirmRevoke?.name}"?`}
        body="Anything using this key will stop working immediately."
        confirmLabel="Revoke"
        onConfirm={() => { if (confirmRevoke) revokeApiKey(confirmRevoke.id); setConfirmRevoke(null); }}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  );
}
