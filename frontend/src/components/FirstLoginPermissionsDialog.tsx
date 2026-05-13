import { Bell, Wifi, Monitor } from "lucide-react";

interface Props {
  onClose: () => void;
}

const PERMISSIONS = [
  {
    icon: Wifi,
    title: "Internet Access",
    description: "Required to sync your subscriptions, check for updates, and communicate with the Remio service.",
  },
  {
    icon: Bell,
    title: "Desktop Notifications",
    description: "We\u2019ll notify you before subscriptions renew and when apps go inactive. You can disable this anytime in Settings.",
  },
  {
    icon: Monitor,
    title: "System Tray",
    description: "Remio stays in your taskbar so you can quickly access it. Closing the window minimizes to the tray instead of quitting.",
  },
];

export default function FirstLoginPermissionsDialog({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ background: "var(--surface)" }}
      >
        <h3 className="mb-1 font-display text-lg font-semibold">
          Welcome to Remio Desktop
        </h3>
        <p
          className="mb-5 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Here&apos;s what Remio needs to work properly on your computer:
        </p>

        <div className="space-y-4 mb-6">
          {PERMISSIONS.map((perm) => (
            <div key={perm.title} className="flex gap-3">
              <div
                className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{ background: "var(--bg-deep)" }}
              >
                <perm.icon size={16} style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <div className="text-sm font-semibold">{perm.title}</div>
                <div
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {perm.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-sage py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
