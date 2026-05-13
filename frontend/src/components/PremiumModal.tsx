import { Crown, Zap, ShieldCheck, BarChart3, Palette } from "lucide-react";
import Modal from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
}

const features = [
  { icon: Zap, label: "Unlimited apps", desc: "Track every tool you use." },
  { icon: BarChart3, label: "Advanced analytics", desc: "Deep insights on spend & usage." },
  { icon: ShieldCheck, label: "Priority support", desc: "24/7 help when you need it." },
  { icon: Palette, label: "Custom themes", desc: "Brand your dashboard." },
];

export default function PremiumModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Upgrade to Premium" width={420}>
      <div className="flex flex-col items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amberish text-paper shadow-card">
          <Crown size={28} />
        </div>
        <h3 className="font-display text-xl font-semibold">Orbit Premium</h3>
        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Supercharge your tool ecosystem with premium features.
        </p>
      </div>

      <ul className="mt-5 space-y-2.5">
        {features.map(({ icon: Icon, label, desc }) => (
          <li
            key={label}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5"
            style={{ background: "var(--bg-deep)" }}
          >
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sage-soft text-sage-ink">
              <Icon size={14} />
            </span>
            <div>
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {desc}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-2">
        <button className="btn-primary w-full py-3 text-base font-semibold">
          Upgrade — $9 / month
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-full py-2 text-sm font-medium text-ink-muted transition hover:bg-cream"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
