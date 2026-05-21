import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import PasswordInput from "../components/PasswordInput";
import {
  RESET_INPUT_CLASS,
  ResetField,
  ResetPageHeader,
  PasswordRulesChecklist,
  passwordMeetsRules,
} from "../components/passwordReset/shared";
import { validatePassword } from "../utils/passwordPolicy";
import { clearResetSession, readResetSession } from "../lib/passwordResetSession";
import { navigateAppRoot } from "../lib/navigation";
import api from "../api";
import { AuthMarketingBackground, ResetPasswordMarketingPanel } from "../components/AuthMarketing";

type View = "form" | "done";

export default function ResetPasswordPage() {
  const session = readResetSession();
  const [view, setView] = useState<View>("form");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) navigateAppRoot();
  }, [session]);

  if (!session) return null;

  const { resetToken, email } = session;
  const policyError = newPass ? validatePassword(newPass, email) : null;
  const matchError = confirm && newPass !== confirm ? "Passwords do not match." : null;

  const goSignIn = () => {
    clearResetSession();
    navigateAppRoot();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordMeetsRules(newPass)) {
      setError("Password does not meet all requirements.");
      return;
    }
    const policyErr = validatePassword(newPass, email);
    if (policyErr) {
      setError(policyErr);
      return;
    }
    if (newPass !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { reset_token: resetToken, new_password: newPass });
      clearResetSession();
      setView("done");
    } catch {
      setError("Could not set your new password. Please start the reset process again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#0d0d0d] text-white lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20">
        <div className="login-enter mx-auto w-full max-w-[400px]">
          {view === "form" ? (
            <form onSubmit={submit}>
              <ResetPageHeader
                title="Create new password"
                subtitle="Enter a new password below to change your password."
              />
              <div className="space-y-4">
                <ResetField label="Password">
                  <PasswordInput
                    value={newPass}
                    onChange={setNewPass}
                    className={RESET_INPUT_CLASS}
                    autoComplete="new-password"
                    autoFocus
                  />
                </ResetField>
                <ResetField label="Confirm password">
                  <PasswordInput
                    value={confirm}
                    onChange={setConfirm}
                    className={RESET_INPUT_CLASS}
                    autoComplete="new-password"
                  />
                </ResetField>
              </div>
              <div className="mt-4">
                <PasswordRulesChecklist password={newPass} />
              </div>
              {(error || policyError || matchError) && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error || policyError || matchError}
                </p>
              )}
              <button
                type="submit"
                disabled={
                  !newPass ||
                  !confirm ||
                  !passwordMeetsRules(newPass) ||
                  !!policyError ||
                  !!matchError ||
                  loading
                }
                className="mt-6 w-full rounded-xl bg-[#e8541a] py-3 text-sm font-semibold text-white transition hover:bg-[#d14a16] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving…" : "Reset password"}
              </button>
              <button
                type="button"
                onClick={goSignIn}
                className="mt-6 flex w-full items-center justify-center gap-1.5 text-sm text-[#888] transition hover:text-white"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </button>
            </form>
          ) : (
            <div>
              <ResetPageHeader
                title="Password updated"
                subtitle="Sign in with your new password."
              />
              <button
                type="button"
                onClick={goSignIn}
                className="w-full rounded-xl bg-[#e8541a] py-3 text-sm font-semibold text-white transition hover:bg-[#d14a16]"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </section>
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12 xl:px-16">
        <AuthMarketingBackground />
        <ResetPasswordMarketingPanel />
      </aside>
    </main>
  );
}
