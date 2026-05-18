import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  id?: string;
  required?: boolean;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  className = "",
  autoComplete,
  autoFocus,
  id,
  required = true,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`field pr-10 ${className}`}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required={required}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}
