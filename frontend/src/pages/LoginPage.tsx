import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import AppLogo from "../components/AppLogo";
import PasswordInput from "../components/PasswordInput";
import api from "../api";
import { isRemioDesktop, getRemioDesktop } from "../lib/desktop";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

type Mode = "login" | "register";

const ERROR_MAP: Record<string, string> = {
  "Invalid credentials": "Wrong email or password.",
  "Email already registered": "An account with that email already exists. Sign in instead.",
  "Could not create account. Please try again or sign in.": "An account with that email already exists. Sign in instead.",
  "That item already exists. Please try a different name or value.": "An account with that email already exists. Sign in instead.",
};

// Errors that must not leak internal detail to the user
const OPAQUE_ERRORS = new Set(["Invalid credentials"]);

function friendlyError(raw: string | undefined): string {
  if (!raw) return "Something went wrong. Please try again.";
  if (ERROR_MAP[raw]) return ERROR_MAP[raw];
  if (OPAQUE_ERRORS.has(raw)) return "Something went wrong. Please try again.";
  // Pass through backend validation messages (password policy, etc.)
  return raw;
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRememberPrompt, setShowRememberPrompt] = useState(false);
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  // bump this key to retrigger the slide animation when mode changes
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("google_error") === "1") {
      setError("Google sign-in failed. Please try again.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setAnimKey((k) => k + 1);
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && !name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (mode === "login") {
      setPendingGoogle(false);
      setShowRememberPrompt(true);
      return;
    }
    await doLogin(false);
  };

  const doLogin = async (remember: boolean) => {
    setShowRememberPrompt(false);
    setLoading(true);
    try {
      if (mode === "register") {
        await api.post("/auth/register", { name, email, password });
      } else {
        await api.post("/auth/login", { email, password, remember_me: remember });
      }
      await signIn();
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(friendlyError(raw));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    if (isRemioDesktop()) {
      void getRemioDesktop()?.startGoogleSignIn();
      return;
    }
    setPendingGoogle(true);
    setShowRememberPrompt(true);
  };

  const doGoogleLogin = (remember: boolean) => {
    setShowRememberPrompt(false);
    setPendingGoogle(false);
    const rememberQ = remember ? "?remember=1" : "";
    window.location.href = `/api/auth/google${rememberQ}`;
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden">
      <SunsetScene />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/85 p-8 shadow-pop backdrop-blur-md fade-in">
        <div className="mb-6 flex items-center gap-3">
          <AppLogo className="h-11 w-11 rounded-2xl object-cover" />
          <div>
            <div className="text-2xl font-semibold text-ink">Remio</div>
            <div className="text-xs text-ink-muted">Your subscriptions, organized.</div>
          </div>
        </div>

        {/* tab switcher */}
        <div className="mb-6 flex rounded-xl border border-line bg-cream/60 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${mode === "login" ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${mode === "register" ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
          >
            Create account
          </button>
        </div>

        {/* form slides in when mode changes */}
        <form key={animKey} onSubmit={submit} className="fade-in space-y-3">
          {mode === "register" && (
            <Field label="Name">
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoFocus
              />
            </Field>
          )}
          <Field label="Email">
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus={mode === "login"}
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
            />
          </Field>
          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs text-ink-muted hover:text-sage-ink hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs text-ink-muted">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={googleLogin}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-2.5 text-sm font-medium text-ink shadow-sm transition hover:bg-cream"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>

      <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} />

      {/* Remember device popup */}
      {showRememberPrompt && (
        <div
          className="fixed inset-0 z-[200] grid place-items-center bg-black/40 backdrop-blur-sm fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white p-6 shadow-pop">
            <h3 className="text-lg font-semibold text-ink">Remember this device?</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Stay signed in so you don't have to log in every time you open Remio.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => (pendingGoogle ? doGoogleLogin(false) : doLogin(false))}
                className="flex-1 rounded-xl border border-line py-2.5 text-sm font-medium text-ink-muted transition hover:bg-cream"
              >
                No thanks
              </button>
              <button
                type="button"
                onClick={() => (pendingGoogle ? doGoogleLogin(true) : doLogin(true))}
                className="btn-primary flex-1 py-2.5 text-sm"
              >
                Yes, remember
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function SunsetScene() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      <defs>
        <linearGradient id="sunsetSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a0a2e" />
          <stop offset="0.15" stopColor="#2d1b4e" />
          <stop offset="0.3" stopColor="#4a2c6a" />
          <stop offset="0.45" stopColor="#7c3a5e" />
          <stop offset="0.55" stopColor="#b85450" />
          <stop offset="0.65" stopColor="#d4734a" />
          <stop offset="0.75" stopColor="#e8933a" />
          <stop offset="0.85" stopColor="#f5b83a" />
          <stop offset="1" stopColor="#f9d68a" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4734a" stopOpacity="0.3" />
          <stop offset="0.3" stopColor="#7c3a5e" stopOpacity="0.25" />
          <stop offset="1" stopColor="#1a0a2e" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="sunGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5b83a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#e8933a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#sunsetSky)" />
      <circle cx="720" cy="520" r="200" fill="url(#sunGlow)" opacity="0.4" />
      <circle cx="720" cy="520" r="36" fill="#f5b83a" className="sun-glow" />
      <g fill="#2d1b4e" opacity="0.7">
        <path d="M0 580 Q200 500 400 580 Q600 520 800 580 Q1000 510 1200 580 Q1350 540 1440 580 L1440 900 L0 900 Z" />
      </g>
      <g fill="#1a0a2e" opacity="0.8">
        <path d="M0 620 Q300 560 600 620 Q900 570 1200 620 Q1350 590 1440 620 L1440 900 L0 900 Z" />
      </g>
      <rect x="0" y="620" width="1440" height="280" fill="url(#waterGrad)" />
      <g className="grass-sway">
        <path d="M0 900 L0 820 Q60 790 120 820 Q180 780 240 820 Q300 800 360 830 Q420 790 480 825 Q540 805 600 835 Q660 795 720 830 Q780 810 840 840 Q900 800 960 835 Q1020 815 1080 845 Q1140 805 1200 840 Q1260 820 1320 850 Q1380 810 1440 845 L1440 900 Z" fill="#3d6b3f" opacity="0.9" />
        <path d="M0 900 L0 850 Q80 820 160 850 Q240 810 320 850 Q400 830 480 860 Q560 820 640 860 Q720 840 800 870 Q880 830 960 865 Q1040 845 1120 875 Q1200 835 1280 870 Q1360 850 1440 880 L1440 900 Z" fill="#2d5230" opacity="0.95" />
      </g>
    </svg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
