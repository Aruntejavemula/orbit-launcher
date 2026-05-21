import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import PasswordInput from "../components/PasswordInput";
import { markPendingRememberPrompt } from "../lib/rememberDevicePrompt";
import HeroLogo from "../components/HeroLogo";
import api from "../api";
import { isRemioDesktop, getRemioDesktop } from "../lib/desktop";
import { appSearch, navigateAppRoot } from "../lib/navigation";
import { AuthMarketingBackground, LoginMarketingPanel } from "../components/AuthMarketing";
import LegalLinks from "../components/LegalLinks";
import { EULA_PATH, PRIVACY_POLICY_PATH, TERMS_PATH } from "../lib/legal";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const INPUT_CLASS =
  "w-full rounded-xl border border-[#333] bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-[#666] focus:border-[#e8541a] focus:ring-2 focus:ring-[#e8541a]/25";

type Mode = "login" | "register";

const ERROR_MAP: Record<string, string> = {
  "Invalid credentials": "Wrong email or password.",
  "Email already registered": "An account with that email already exists. Sign in instead.",
  "Could not create account. Please try again or sign in.":
    "An account with that email already exists. Sign in instead.",
  "That item already exists. Please try a different name or value.":
    "An account with that email already exists. Sign in instead.",
};

const OPAQUE_ERRORS = new Set(["Invalid credentials"]);

function friendlyError(raw: string | undefined): string {
  if (!raw) return "Something went wrong. Please try again.";
  if (ERROR_MAP[raw]) return ERROR_MAP[raw];
  if (OPAQUE_ERRORS.has(raw)) return "Something went wrong. Please try again.";
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
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(appSearch()).get("google_error") === "1") {
      setError("Google sign-in failed. Please try again.");
      navigateAppRoot();
    }
  }, []);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
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
    await doLogin();
  };

  const doLogin = async () => {
    setLoading(true);
    try {
      if (mode === "register") {
        await api.post("/auth/register", { name, email, password });
        await signIn(false);
      } else {
        await api.post("/auth/login", { email, password, remember_me: false });
        markPendingRememberPrompt();
        await signIn(false);
      }
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(friendlyError(raw));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    markPendingRememberPrompt();
    if (isRemioDesktop()) {
      void getRemioDesktop()?.startGoogleSignIn();
      return;
    }
    window.location.href = "/api/auth/google";
  };

  const isLogin = mode === "login";

  return (
    <main className="login-page grid min-h-screen bg-[#0d0d0d] text-white lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20">
        <div className="login-enter mx-auto w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5">
            <HeroLogo className="h-9 w-9 shrink-0 rounded-lg object-cover" />
            <span className="text-lg font-semibold tracking-tight">Remio</span>
          </div>

          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-[#888]">
            {isLogin ? "Sign in to your account" : "Start tracking your subscriptions"}
          </p>

          <button
            type="button"
            onClick={googleLogin}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-[#333] bg-[#1a1a1a] py-3 text-sm font-medium text-white transition hover:border-[#444] hover:bg-[#222]"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white">
              <GoogleIcon />
            </span>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#2a2a2a]" />
            <span className="text-xs text-[#666]">
              {isLogin ? "or sign in with email" : "or sign up with email"}
            </span>
            <div className="h-px flex-1 bg-[#2a2a2a]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Field label="Name">
                <input
                  className={INPUT_CLASS}
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
                className={INPUT_CLASS}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus={isLogin}
              />
            </Field>
            <Field label="Password">
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder={isLogin ? "Your password" : "At least 8 characters"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className={INPUT_CLASS}
              />
            </Field>

            {isLogin && (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-[#888] transition hover:text-[#bbb]"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-[#e8541a] py-3 text-sm font-semibold text-white transition hover:bg-[#d14a16] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          {!isLogin && (
            <p className="mt-6 text-center text-xs leading-relaxed text-[#666]">
              By creating an account, you agree to the{" "}
              <a href={EULA_PATH} className="text-[#e8541a] underline-offset-2 hover:underline">
                EULA
              </a>
              ,{" "}
              <a href={TERMS_PATH} className="text-[#e8541a] underline-offset-2 hover:underline">
                Terms &amp; Conditions
              </a>
              , and{" "}
              <a href={PRIVACY_POLICY_PATH} className="text-[#e8541a] underline-offset-2 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          )}

          <LegalLinks className="mt-4 text-center" />

          <p className="mt-6 text-center text-sm text-[#888]">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-medium text-white transition hover:text-[#e8541a]"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-medium text-white transition hover:text-[#e8541a]"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12 xl:px-16">
        <AuthMarketingBackground />
        <LoginMarketingPanel />
      </aside>

      <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} />
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#888]">
        {label}
      </span>
      {children}
    </label>
  );
}
