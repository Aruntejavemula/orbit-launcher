import { useState } from "react";
import { AlertTriangle, Crown, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "./Modal";
import { useApps } from "../context/AppsContext";
import api from "../api";

const CANCEL_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Missing features I need",
  "Found a better alternative",
  "Just taking a break",
];

const OFFERS = [
  { id: "1mo", label: "1 month free", desc: "Stay one more month at no cost — cancel any time after.", badge: "Best offer" },
  { id: "50pct", label: "50% off for 2 months", desc: "Keep full access at half price for the next two months.", badge: null },
];

type Step = "overview" | "reason" | "offer" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ManageSubscriptionModal({ open, onClose }: Props) {
  const { apps, history } = useApps();
  const [step, setStep] = useState<Step>("overview");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [claimingOffer, setClaimingOffer] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [claimedOffer, setClaimedOffer] = useState<string | null>(null);

  const totalApps = apps.length;
  const paidApps = apps.filter((a) => a.plan === "paid").length;
  const totalOpens = history.length;

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep("overview"); setReason(""); setClaimedOffer(null); }, 300);
  };

  const submitReason = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await api.post("/subscriptions/cancel-reason", { reason });
    } catch { /* log best-effort */ }
    setSubmitting(false);
    setStep("offer");
  };

  const claimOffer = async (offerId: string) => {
    if (claimingOffer) return;
    setClaimingOffer(true);
    try {
      await api.post("/subscriptions/claim-offer", { offer_id: offerId });
    } catch { /* non-critical */ } finally {
      setClaimingOffer(false);
    }
    setClaimedOffer(offerId);
    handleClose();
  };

  const confirmCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      await api.post("/subscriptions/cancel");
    } catch { /* non-critical */ } finally {
      setCancelling(false);
    }
    setStep("done");
  };

  return (
    <Modal open={open} onClose={handleClose} title="Manage Subscription" width={480}>
      <AnimatePresence mode="wait">
        {step === "overview" && (
          <motion.div key="overview" {...fade} className="space-y-5">
            {/* Status badge */}
            <div className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "#6B8F71", background: "var(--hero)" }}>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  <Crown size={15} className="text-amberish" />
                  Premium Member
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Unlimited apps · advanced insights · priority support
                </div>
              </div>
              <span className="badge border border-sage bg-paper text-sage-ink">Active</span>
            </div>

            {/* Usage stats */}
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Apps tracked" value={totalApps} />
              <Stat label="Paid subs" value={paidApps} />
              <Stat label="Total opens" value={totalOpens} />
            </div>

            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Your subscription keeps all your tools organised and renewals in check.
            </p>

            {/* Danger zone */}
            <div
              className="flex items-start gap-3 rounded-xl border p-4"
              style={{ borderColor: "var(--line)", background: "var(--bg-deep)" }}
            >
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-600">Cancel subscription</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  You'll lose access to premium features at the end of your billing period.
                </div>
              </div>
              <button
                onClick={() => setStep("reason")}
                className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {step === "reason" && (
          <motion.div key="reason" {...fade} className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep("overview")} className="text-ink-muted hover:text-ink transition-colors">
                <X size={16} />
              </button>
              <h3 className="font-semibold">Why are you cancelling?</h3>
            </div>
            <div className="space-y-1.5">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition"
                  style={
                    reason === r
                      ? { borderColor: "#6B8F71", background: "var(--sage-soft)", color: "#2E4332" }
                      : { borderColor: "var(--line)", background: "var(--bg-deep)", color: "var(--text)" }
                  }
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border-2 transition-colors"
                    style={{ borderColor: reason === r ? "#6B8F71" : "var(--line)", background: reason === r ? "#6B8F71" : "transparent" }}
                  />
                  {r}
                </button>
              ))}
            </div>
            <button
              disabled={!reason || submitting}
              onClick={submitReason}
              className="btn-primary w-full disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Continue"}
            </button>
          </motion.div>
        )}

        {step === "offer" && (
          <motion.div key="offer" {...fade} className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep("reason")} className="text-ink-muted hover:text-ink transition-colors">
                <X size={16} />
              </button>
              <h3 className="font-semibold">Before you go…</h3>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              We'd hate to lose you. Pick an offer to stay:
            </p>
            <div className="space-y-2">
              {OFFERS.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                  style={{ borderColor: "var(--line)", background: "var(--bg-deep)" }}
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {o.label}
                      {o.badge && (
                        <span className="rounded-full bg-amberish/15 px-2 py-0.5 text-[10px] font-medium text-amberish">
                          {o.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{o.desc}</div>
                  </div>
                  <button onClick={() => claimOffer(o.id)} disabled={claimingOffer} className="btn-primary ml-4 shrink-0 px-3 py-1.5 text-xs disabled:opacity-60">
                    {claimingOffer ? "Claiming…" : "Claim"}
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={confirmCancel}
              disabled={cancelling}
              className="text-xs transition-colors hover:underline disabled:opacity-50"
              style={{ color: "var(--text-muted)" }}
            >
              {cancelling ? "Cancelling…" : "No thanks, cancel anyway"}
            </button>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done" {...fade} className="space-y-4 text-center py-4">
            <div className="text-4xl">👋</div>
            <div>
              <h3 className="font-semibold text-lg">Subscription cancelled</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                You'll retain full access until the end of your billing period. We hope to see you back!
              </p>
            </div>
            <button onClick={handleClose} className="btn-primary w-full">Close</button>
          </motion.div>
        )}
      </AnimatePresence>

      {claimedOffer && (
        <div className="mt-4 rounded-xl border border-sage/30 bg-sage-soft px-4 py-3 text-sm text-sage-ink">
          Offer claimed! Your account has been updated.
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-deep)" }}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
};
