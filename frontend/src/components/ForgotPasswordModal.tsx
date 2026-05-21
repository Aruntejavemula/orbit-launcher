import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import Modal from "./Modal";
import { RESET_INPUT_CLASS, ResetField, ResetPageHeader } from "./passwordReset/shared";
import {
  navigateToResetPassword,
  saveResetSession,
} from "../lib/passwordResetSession";
import api from "../api";
import { pageTransition, pageVariants } from "../lib/motion";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "email" | "otp";

const OTP_EXPIRY_SECONDS = 600;
const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function BackToSignIn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 flex w-full items-center justify-center gap-1.5 text-sm text-[#888] transition hover:text-white"
    >
      <ArrowLeft size={16} />
      Back to sign in
    </button>
  );
}

export default function ForgotPasswordModal({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
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

  useEffect(() => {
    if (step !== "otp" || !otpSentAt) return;
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - otpSentAt) / 1000);
      setSecondsLeft(Math.max(0, OTP_EXPIRY_SECONDS - elapsed));
    }, 1000);
    return () => clearInterval(tick);
  }, [step, otpSentAt]);

  useEffect(() => {
    if (resendCooldown === 0) return;
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - cooldownSentAt.current!) / 1000);
      const left = Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
      setResendCooldown(left);
      if (left === 0) cooldownSentAt.current = null;
    }, 1000);
    return () => clearInterval(tick);
  }, [resendCooldown === 0]);

  const otp = digits.join("");

  const resetState = () => {
    setStep("email");
    setEmail("");
    setDigits(Array(6).fill(""));
    setError(null);
    setOtpStatus(null);
    setSecondsLeft(OTP_EXPIRY_SECONDS);
    setOtpSentAt(null);
    setResendCooldown(0);
    cooldownSentAt.current = null;
    sendingRef.current = false;
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetState, 300);
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
    } catch {
      /* silent */
    }
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
      saveResetSession(res.data.reset_token, email);
      handleClose();
      navigateToResetPassword();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
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

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerStr = `${mins}:${String(secs).padStart(2, "0")}`;
  const timerUrgent = secondsLeft <= 60;

  const modalHeader = (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        className="rounded-lg p-1 text-[#888] transition hover:text-white"
      >
        <X size={20} />
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={handleClose} header={modalHeader} width={440}>
      <div className="forgot-password-modal -mt-2 text-white">
        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.form
              key="email"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              onSubmit={sendOtp}
            >
              <ResetPageHeader
                title="Forgot password?"
                subtitle="Enter your account email and we'll send a 6-digit code."
              />
              <ResetField label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={RESET_INPUT_CLASS}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </ResetField>
              {error && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={!email || loading || resendCooldown > 0}
                className="mt-6 w-full rounded-xl bg-[#e8541a] py-3 text-sm font-semibold text-white transition hover:bg-[#d14a16] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send code"}
              </button>
              <BackToSignIn onClick={handleClose} />
            </motion.form>
          )}

          {step === "otp" && (
            <motion.form
              key="otp"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              onSubmit={verifyOtp}
            >
              <OtpSubtitle email={email} />
              {secondsLeft > 0 && (
                <p
                  className="mb-4 text-center text-xs font-medium"
                  style={{ color: timerUrgent ? "#ef4444" : "#888" }}
                >
                  Expires in {timerStr}
                </p>
              )}
              <div className="flex justify-center gap-2" onPaste={handleDigitPaste}>
                {digits.map((d, i) => (
                  <motion.input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    animate={d ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    className="h-12 w-10 rounded-xl border text-center font-mono text-xl font-semibold text-white outline-none transition focus:ring-2 focus:ring-[#e8541a]/25"
                    style={{
                      background: "#1a1a1a",
                      borderColor: otpStatus ? "#f87171" : d ? "#e8541a" : "#333",
                    }}
                  />
                ))}
              </div>
              {otpStatus === "invalid" && (
                <p className="mt-3 text-center text-xs text-red-400">Incorrect code. Please try again.</p>
              )}
              {otpStatus === "locked" && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
                  Too many attempts. Try again in 15 minutes.
                </p>
              )}
              {(secondsLeft === 0 || otpStatus === "expired") && otpStatus !== "locked" && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
                  Code expired.{" "}
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={resending || resendCooldown > 0}
                    className="font-semibold underline disabled:opacity-50"
                  >
                    {resending ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                  </button>
                </p>
              )}
              <div className="mt-4 flex justify-center gap-3 text-xs text-[#888]">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtpStatus(null);
                  }}
                  className="hover:text-white"
                >
                  Wrong email?
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resending || resendCooldown > 0}
                  className="hover:text-white disabled:opacity-50"
                >
                  {resending ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
              <button
                type="submit"
                disabled={otp.length !== 6 || loading || secondsLeft === 0 || otpStatus === "locked"}
                className="mt-6 w-full rounded-xl bg-[#e8541a] py-3 text-sm font-semibold text-white transition hover:bg-[#d14a16] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Continue"}
              </button>
              <BackToSignIn onClick={handleClose} />
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

function OtpSubtitle({ email }: { email: string }) {
  return (
    <ResetPageHeader
      title="Enter verification code"
      subtitle={
        <>
          Code sent to <span className="text-white">{email}</span>
        </>
      }
    />
  );
}
