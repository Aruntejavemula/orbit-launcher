import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
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
