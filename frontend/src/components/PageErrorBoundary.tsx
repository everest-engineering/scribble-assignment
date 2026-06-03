import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Errors are intentionally not logged to the console here to avoid
    // exposing stack traces; the fallback UI is shown instead.
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="panel panel--narrow">
          <p className="form__error">Something went wrong. Please refresh and try again.</p>
        </section>
      );
    }

    return this.props.children;
  }
}
