import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "./Modal";
import PasswordInput from "./PasswordInput";
import PasswordStrength from "./PasswordStrength";
import { validatePassword } from "../utils/passwordPolicy";
import api from "../api";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "email" | "otp" | "newpass" | "done";

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
};

const OTP_EXPIRY_SECONDS = 600; // 10 minutes

const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function ForgotPasswordModal({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [resetToken, setResetToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<"invalid" | "expired" | "locked" | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownSentAt = useRef<number | null>(null);
  const sendingRef = useRef(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP expiry countdown
  useEffect(() => {
    if (step !== "otp" || !otpSentAt) return;
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - otpSentAt) / 1000);
      const left = Math.max(0, OTP_EXPIRY_SECONDS - elapsed);
      setSecondsLeft(left);
    }, 1000);
    return () => clearInterval(tick);
  }, [step, otpSentAt]);

  // Resend rate-limit countdown — runs only while cooldown is active
  useEffect(() => {
    if (resendCooldown === 0) return;
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - cooldownSentAt.current!) / 1000);
      const left = Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
      setResendCooldown(left);
      if (left === 0) cooldownSentAt.current = null;
    }, 1000);
    return () => clearInterval(tick);
  }, [resendCooldown === 0]); // only re-subscribe when active→idle or idle→active

  const otp = digits.join("");

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("email"); setEmail(""); setDigits(Array(6).fill(""));
      setResetToken(""); setNewPass(""); setConfirm(""); setError(null);
      setOtpStatus(null); setSecondsLeft(OTP_EXPIRY_SECONDS); setOtpSentAt(null);
      setResendCooldown(0); cooldownSentAt.current = null; sendingRef.current = false;
    }, 300);
  };

  const startCooldown = () => {
    cooldownSentAt.current = Date.now();
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (sendingRef.current || resendCooldown > 0) return;
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    sendingRef.current = true;
    startCooldown();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setDigits(Array(6).fill(""));
      setOtpStatus(null);
      setOtpSentAt(Date.now());
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      setStep("otp");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  const resendOtp = async () => {
    if (sendingRef.current || resendCooldown > 0) return;
    sendingRef.current = true;
    startCooldown();
    setResending(true);
    setOtpStatus(null);
    setDigits(Array(6).fill(""));
    try {
      await api.post("/auth/forgot-password", { email });
      setOtpSentAt(Date.now());
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch { /* silent */ }
    setResending(false);
    sendingRef.current = false;
  };

  const handleDigitChange = (i: number, val: string) => {
    const ch = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    setOtpStatus(null);
    if (ch && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleDigitKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setOtpStatus(null);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpStatus(null);
    setLoading(true);
    try {
      const res = await api.post<{ reset_token: string }>("/auth/verify-otp", { email, otp });
      setResetToken(res.data.reset_token);
      setStep("newpass");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
      if (status === 429) {
        setOtpStatus("locked");
      } else if (detail.toLowerCase().includes("expired")) {
        setOtpStatus("expired");
      } else {
        setOtpStatus("invalid");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const policyErr = validatePassword(newPass, email);
    if (policyErr) { setError(policyErr); return; }
    if (newPass !== confirm) { setError("Passwords do not match."); return; }
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { reset_token: resetToken, new_password: newPass });
      setStep("done");
    } catch {
      setError("Could not set your new password. Please start the reset process again.");
    } finally {
      setLoading(false);
    }
  };

  const policyError = newPass ? validatePassword(newPass, email) : null;
  const matchError = confirm && newPass !== confirm ? "Passwords do not match." : null;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerStr = `${mins}:${String(secs).padStart(2, "0")}`;
  const timerUrgent = secondsLeft <= 60;

  return (
    <Modal open={open} onClose={handleClose} title="Reset password" width={460}>
      <AnimatePresence mode="wait">

        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <motion.form key="email" {...fade} onSubmit={sendOtp} className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Enter your account email and we'll send a 6-digit code.
            </p>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field mt-1.5"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={handleClose}
                className="rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-cream transition">
                Cancel
              </button>
              <button type="submit" disabled={!email || loading || resendCooldown > 0}
                className="btn-primary px-5 text-sm disabled:opacity-50">
                {loading ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send code"}
              </button>
            </div>
          </motion.form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <motion.form key="otp" {...fade} onSubmit={verifyOtp} className="space-y-5">
            <div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Code sent to <strong style={{ color: "var(--text)" }}>{email}</strong>
              </p>
              {secondsLeft > 0 && (
                <p className="mt-1 text-xs font-medium" style={{ color: timerUrgent ? "#ef4444" : "var(--text-muted)" }}>
                  Expires in {timerStr}
                </p>
              )}
            </div>

            {/* 6 individual digit boxes */}
            <div className="flex justify-center gap-2" onPaste={handleDigitPaste}>
              {digits.map((d, i) => (
                <motion.input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  animate={d ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  className="h-12 w-10 rounded-xl border text-center font-mono text-xl font-semibold outline-none transition focus:ring-2"
                  style={{
                    background: "var(--bg-deep)",
                    borderColor: otpStatus ? "#f87171" : d ? "#6B8F71" : "var(--line)",
                    color: "var(--text)",
                    boxShadow: otpStatus ? undefined : d ? "0 0 0 2px rgba(107,143,113,0.15)" : undefined,
                  }}
                />
              ))}
            </div>

            {/* Inline OTP errors */}
            {otpStatus === "invalid" && (
              <p className="text-center text-xs text-red-600">Incorrect code. Please try again.</p>
            )}
            {otpStatus === "locked" && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700">
                Too many attempts. Try again in 15 minutes.
              </p>
            )}
            {(secondsLeft === 0 || otpStatus === "expired") && otpStatus !== "locked" && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700">
                Code expired. Request a new one.{" "}
                <button type="button" onClick={resendOtp} disabled={resending || resendCooldown > 0}
                  className="font-semibold underline disabled:opacity-50">
                  {resending ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                </button>
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <button type="button" onClick={() => { setStep("email"); setOtpStatus(null); }}
                  className="hover:underline">
                  Wrong email?
                </button>
                <span>·</span>
                <button type="button" onClick={resendOtp} disabled={resending || resendCooldown > 0}
                  className="hover:underline disabled:opacity-50">
                  {resending ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleClose}
                  className="rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-cream transition">
                  Cancel
                </button>
                <button type="submit" disabled={otp.length !== 6 || loading || secondsLeft === 0 || otpStatus === "locked"}
                  className="btn-primary px-5 text-sm disabled:opacity-50">
                  {loading ? "Verifying…" : "Verify"}
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {/* ── Step 3: New password ── */}
        {step === "newpass" && (
          <motion.form key="newpass" {...fade} onSubmit={resetPassword} className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Choose a strong new password.</p>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                New password
              </label>
              <div className="mt-1.5">
                <PasswordInput
                  value={newPass}
                  onChange={setNewPass}
                  className={policyError ? "border-red-400 focus:ring-red-300" : ""}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              {policyError && <p className="mt-1 text-xs text-red-600">{policyError}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Re-enter password
              </label>
              <div className="mt-1.5">
                <PasswordInput
                  value={confirm}
                  onChange={setConfirm}
                  className={matchError ? "border-red-400 focus:ring-red-300" : ""}
                  autoComplete="new-password"
                />
              </div>
              {matchError && <p className="mt-1 text-xs text-red-600">{matchError}</p>}
            </div>
            <PasswordStrength password={newPass} />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={handleClose}
                className="rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-cream transition">
                Cancel
              </button>
              <button type="submit"
                disabled={!newPass || !confirm || !!policyError || !!matchError || loading}
                className="btn-primary px-5 text-sm disabled:opacity-50">
                {loading ? "Saving…" : "Set new password"}
              </button>
            </div>
          </motion.form>
        )}

        {/* ── Step 4: Done ── */}
        {step === "done" && (
          <motion.div key="done" {...fade} className="space-y-4 py-2 text-center">
            <div className="text-4xl">🔒</div>
            <div>
              <p className="font-semibold text-lg">Password reset!</p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Sign in with your new password.
              </p>
            </div>
            <button onClick={handleClose} className="btn-primary w-full">Done</button>
          </motion.div>
        )}

      </AnimatePresence>
    </Modal>
  );
}

