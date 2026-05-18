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
  required,
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
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required={required}
        className={`field pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition hover:text-ink"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
