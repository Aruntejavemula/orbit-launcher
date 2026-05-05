import { useState } from "react";
import { Orbit as OrbitIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [name, setName] = useState("Alex Chen");
  const [email, setEmail] = useState("alex@orbit.app");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password required.");
      return;
    }
    signIn({
      name: name.trim() || email.split("@")[0],
      email: email.trim(),
      avatar: undefined,
    });
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden">
      <SunsetScene />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/85 p-8 shadow-pop backdrop-blur-md fade-in">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sage text-paper">
            <OrbitIcon size={22} strokeWidth={2.5} />
          </span>
          <div>
            <div className="font-display text-2xl font-semibold text-ink">Orbit</div>
            <div className="text-xs text-ink-muted">Your tool ecosystem, organized.</div>
          </div>
        </div>

        <h1 className="font-display text-xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Demo mode — any email + password gets you in.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <Field label="Name">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary mt-2 w-full">Continue</button>
        </form>

        <div className="mt-6 rounded-xl border border-line/50 bg-cream/60 p-3 text-xs text-ink-muted">
          Your data is stored locally in your browser. No server, no tracking.
        </div>
      </div>
    </main>
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
      <circle cx="720" cy="520" r="120" fill="url(#sunGlow)" opacity="0.5" />

      <circle cx="720" cy="520" r="36" fill="#f5b83a" className="sun-glow" />
      <circle cx="720" cy="520" r="48" fill="#f5b83a" opacity="0.3" className="sun-glow" style={{ animationDelay: "1s" }} />
      <circle cx="720" cy="520" r="72" fill="#f5b83a" opacity="0.15" className="sun-glow" style={{ animationDelay: "2s" }} />

      <g className="cloud-drift" opacity="0.25">
        <ellipse cx="480" cy="220" rx="80" ry="16" fill="#fff" />
        <ellipse cx="520" cy="210" rx="50" ry="12" fill="#fff" />
        <ellipse cx="440" cy="225" rx="40" ry="10" fill="#fff" />
      </g>
      <g className="cloud-drift" opacity="0.2" style={{ animationDelay: "8s", transform: "translateX(200px)" }}>
        <ellipse cx="900" cy="180" rx="100" ry="18" fill="#fff" />
        <ellipse cx="950" cy="172" rx="60" ry="14" fill="#fff" />
      </g>

      <g fill="#2d1b4e" opacity="0.7">
        <path d="M0 580 Q200 500 400 580 Q600 520 800 580 Q1000 510 1200 580 Q1350 540 1440 580 L1440 900 L0 900 Z" />
      </g>
      <g fill="#1a0a2e" opacity="0.8">
        <path d="M0 620 Q300 560 600 620 Q900 570 1200 620 Q1350 590 1440 620 L1440 900 L0 900 Z" />
      </g>

      <rect x="0" y="620" width="1440" height="280" fill="url(#waterGrad)" />

      <ellipse cx="720" cy="640" rx="60" ry="4" fill="#f5b83a" opacity="0.3" className="ripple-1" />
      <ellipse cx="720" cy="640" rx="40" ry="3" fill="#e8933a" opacity="0.4" className="ripple-2" />
      <ellipse cx="720" cy="640" rx="80" ry="5" fill="#f9d68a" opacity="0.2" className="ripple-3" />

      <ellipse cx="500" cy="645" rx="30" ry="2.5" fill="#f5b83a" opacity="0.2" className="ripple-1" style={{ animationDelay: "2s" }} />
      <ellipse cx="950" cy="650" rx="25" ry="2" fill="#e8933a" opacity="0.2" className="ripple-2" style={{ animationDelay: "3s" }} />

      <g opacity="0.5">
        <path d="M300 600 L305 585 L310 600" fill="#f5b83a" opacity="0.3" />
        <path d="M305 600 L310 580 L315 600" fill="#e8933a" opacity="0.2" />
        <path d="M1120 610 L1125 595 L1130 610" fill="#f5b83a" opacity="0.3" />
      </g>

      <g className="grass-sway">
        <path d="M0 900 L0 820 Q60 790 120 820 Q180 780 240 820 Q300 800 360 830 Q420 790 480 825 Q540 805 600 835 Q660 795 720 830 Q780 810 840 840 Q900 800 960 835 Q1020 815 1080 845 Q1140 805 1200 840 Q1260 820 1320 850 Q1380 810 1440 845 L1440 900 Z" fill="#3d6b3f" opacity="0.9" />
        <path d="M0 900 L0 850 Q80 820 160 850 Q240 810 320 850 Q400 830 480 860 Q560 820 640 860 Q720 840 800 870 Q880 830 960 865 Q1040 845 1120 875 Q1200 835 1280 870 Q1360 850 1440 880 L1440 900 Z" fill="#2d5230" opacity="0.95" />
      </g>

      <g fill="#2d5230" opacity="0.8" className="grass-sway" style={{ animationDelay: "1s" }}>
        <path d="M180 900 L182 860 L178 860 Z" />
        <path d="M195 900 L198 855 L192 855 Z" />
        <path d="M340 900 L343 865 L337 865 Z" />
        <path d="M520 900 L524 858 L516 858 Z" />
        <path d="M680 900 L683 862 L677 862 Z" />
        <path d="M850 900 L853 855 L847 855 Z" />
        <path d="M1020 900 L1023 868 L1017 868 Z" />
        <path d="M1200 900 L1204 860 L1196 860 Z" />
      </g>

      <g opacity="0.7">
        <ellipse cx="380" cy="812" rx="3" ry="1.5" fill="#5a9e5c" />
        <ellipse cx="560" cy="818" rx="2.5" ry="1.2" fill="#5a9e5c" />
        <ellipse cx="740" cy="815" rx="3" ry="1.5" fill="#5a9e5c" />
        <ellipse cx="920" cy="820" rx="2.5" ry="1.2" fill="#5a9e5c" />
        <ellipse cx="1080" cy="814" rx="3" ry="1.5" fill="#5a9e5c" />
      </g>

      <g className="bird-1" opacity="0.6">
        <path d="M0 0 q8 -6 16 0 q-8 -2 -16 0" fill="none" stroke="#3a1a2e" strokeWidth="1.5" />
      </g>
      <g className="bird-2" opacity="0.5">
        <path d="M0 0 q6 -5 12 0 q-6 -2 -12 0" fill="none" stroke="#3a1a2e" strokeWidth="1.2" />
      </g>
      <g className="bird-3" opacity="0.45">
        <path d="M0 0 q10 -7 20 0 q-10 -3 -20 0" fill="none" stroke="#3a1a2e" strokeWidth="1.5" />
      </g>

      <g className="butterfly-1" opacity="0.7">
        <path d="M0 0 q5 -8 10 0 q-5 -3 -10 0" fill="#e8933a" />
        <path d="M0 0 q-5 -8 -10 0 q5 -3 10 0" fill="#e8933a" />
        <line x1="0" y1="0" x2="0" y2="-8" stroke="#7c3a5e" strokeWidth="0.8" />
      </g>
      <g className="butterfly-2" opacity="0.6">
        <path d="M0 0 q4 -6 8 0 q-4 -2 -8 0" fill="#f5b83a" />
        <path d="M0 0 q-4 -6 -8 0 q4 -2 8 0" fill="#f5b83a" />
        <line x1="0" y1="0" x2="0" y2="-6" stroke="#7c3a5e" strokeWidth="0.6" />
      </g>
      <g className="butterfly-3" opacity="0.5">
        <path d="M0 0 q6 -7 12 0 q-6 -2.5 -12 0" fill="#d4734a" />
        <path d="M0 0 q-6 -7 -12 0 q6 -2.5 12 0" fill="#d4734a" />
        <line x1="0" y1="0" x2="0" y2="-7" stroke="#7c3a5e" strokeWidth="0.7" />
      </g>

      <g transform="translate(280, 805)" opacity="0.85">
        <ellipse cx="18" cy="0" rx="12" ry="7" fill="#2d1b4e" />
        <ellipse cx="38" cy="2" rx="14" ry="8" fill="#2d1b4e" />
        <ellipse cx="54" cy="0" rx="11" ry="6" fill="#2d1b4e" />
        <ellipse cx="12" cy="-8" rx="3" ry="5" fill="#2d1b4e" />
        <ellipse cx="58" cy="-8" rx="3" ry="5" fill="#2d1b4e" />
        <circle cx="20" cy="-4" r="1.2" fill="#1a0a2e" />
        <path d="M28 2 Q30 6 32 2" fill="none" stroke="#1a0a2e" strokeWidth="0.8" />
      </g>

      <g transform="translate(980, 812)" opacity="0.75">
        <ellipse cx="22" cy="0" rx="10" ry="5" fill="#2d1b4e" />
        <ellipse cx="35" cy="1" rx="8" ry="4" fill="#2d1b4e" />
        <ellipse cx="45" cy="0" rx="6" ry="3" fill="#2d1b4e" />
        <path d="M20 -2 Q18 -8 16 -3" fill="none" stroke="#2d1b4e" strokeWidth="1" />
        <path d="M40 -1 Q42 -6 44 -2" fill="none" stroke="#2d1b4e" strokeWidth="1" />
      </g>

      <g opacity="0.3">
        <path d="M0 700 L1440 700" stroke="#f5b83a" strokeWidth="0.5" strokeDasharray="8 16" />
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
