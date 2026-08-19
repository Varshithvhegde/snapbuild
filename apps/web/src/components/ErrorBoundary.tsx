import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Snapbuild]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-zinc-100">
          <div className="max-w-lg space-y-4">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <pre className="text-sm text-red-400 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              className="px-4 py-2 bg-white text-black rounded-lg text-sm"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
