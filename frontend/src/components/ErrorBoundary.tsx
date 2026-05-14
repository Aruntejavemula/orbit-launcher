import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
}

function logToPanel(msg: string) {
  const el = document.getElementById("error-log");
  if (el) {
    el.style.display = "block";
    el.textContent += new Date().toISOString() + ": " + msg + "\n\n";
  }
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "", errorStack: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message ?? String(error),
      errorStack: error?.stack ?? "",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    logToPanel("ErrorBoundary caught: " + (error?.message || String(error)) + "\n" + (error?.stack || "") + "\nComponent stack: " + (info.componentStack || ""));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app p-8 text-center">
          <h1 className="font-display text-2xl font-semibold" style={{ color: "var(--text)" }}>
            Something went wrong
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            An unexpected error occurred. Please refresh the page.
          </p>
          <pre className="mt-2 max-w-lg overflow-auto rounded bg-gray-100 p-3 text-left text-xs text-red-600 dark:bg-gray-800 dark:text-red-400">
            {this.state.errorMessage || "Unknown error"}
          </pre>
          {this.state.errorStack && (
            <pre className="max-w-lg overflow-auto rounded bg-gray-100 p-3 text-left text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {this.state.errorStack}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
