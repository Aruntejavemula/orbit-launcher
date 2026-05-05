import { useEffect, useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  "https://i.pravatar.cc/120?img=12",
  "https://i.pravatar.cc/120?img=32",
  "https://i.pravatar.cc/120?img=47",
  "https://i.pravatar.cc/120?img=64",
  "https://i.pravatar.cc/120?img=68",
  "https://i.pravatar.cc/120?img=15",
];

export default function ProfileEditorModal({ open, onClose }: Props) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? PRESET_AVATARS[0]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setName(user?.name ?? "");
      setAvatar(user?.avatar ?? PRESET_AVATARS[0]);
    }
  }, [open, user]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateUser({ name: trimmed, avatar });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" width={460}>
      <div className="flex flex-col items-center">
        <div className="relative">
          <img
            src={avatar}
            alt=""
            className="h-24 w-24 rounded-full object-cover ring-4 ring-cream"
          />
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
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 text-xs font-medium text-sage-ink hover:underline"
        >
          Upload a new photo
        </button>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Or pick a preset
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_AVATARS.map((url) => {
            const selected = url === avatar;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setAvatar(url)}
                className={`relative h-12 w-12 overflow-hidden rounded-full ring-2 transition ${
                  selected ? "ring-sage-dark" : "ring-transparent hover:ring-line"
                }`}
                aria-label="Select avatar"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {selected && (
                  <span className="absolute inset-0 grid place-items-center bg-ink/30">
                    <Check size={16} className="text-paper" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Display name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/25"
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted hover:bg-cream"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save changes
        </button>
      </div>
    </Modal>
  );
}
