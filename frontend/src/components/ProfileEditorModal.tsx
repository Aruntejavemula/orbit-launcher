import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";
import api from "../api";

function compressImage(file: File, maxPx = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round((height * maxPx) / width); width = maxPx; }
        else { width = Math.round((width * maxPx) / height); height = maxPx; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")); };
    img.src = objectUrl;
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
}

function initialsAvatar(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0]?.[0] ?? "?");
  return initials.toUpperCase();
}

export default function ProfileEditorModal({ open, onClose }: Props) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setName(user?.name ?? "");
      setAvatarUrl(user?.avatar_url ?? "");
      setError(null);
    }
  }, [open, user]);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const compressed = await compressImage(file);
      setAvatarUrl(compressed);
    } catch {
      setError("Failed to load image. Try a different file.");
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    setSaving(true);
    try {
      await api.patch("/auth/me", { name: trimmed, avatar_url: avatarUrl || null });
      await refreshUser();
      onClose();
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Save failed. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const displayInitials = initialsAvatar(name || user?.name || "?");

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" width={420}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-24 w-24 rounded-full object-cover ring-4 ring-line"
              onError={() => setAvatarUrl("")}
            />
          ) : (
            <div
              className="h-24 w-24 rounded-full ring-4 flex items-center justify-center text-3xl font-semibold"
              style={{
                background: "var(--hero)",
                color: "var(--text)",
                outline: "4px solid var(--line)",
                outlineOffset: "0px",
              }}
            >
              {displayInitials}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-sage-dark text-paper shadow-card transition hover:bg-sage-ink"
            aria-label="Upload photo"
          >
            <Camera size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-sage-ink hover:underline"
          >
            Upload photo
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl("")}
              className="text-ink-muted hover:text-ink hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="mt-5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Display name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="field mt-1.5"
        />
      </div>

      {/* Actions */}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted hover:bg-cream transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}
