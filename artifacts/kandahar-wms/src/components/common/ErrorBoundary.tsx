import { Component, ErrorInfo, ReactNode } from "react";
import Button from "../ui/button/Button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 text-3xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">د سیسټم په ښکاره کولو کې ستونزه رامنځته شوه</h1>
          <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
            مهرباني وکړئ صفحه بیا تازه کړئ یا د سیسټم اډمین سره اړیکه ونیسئ. ستاسو ډاټا خوندي ده.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()}>صفحه تازه کول</Button>
            <Button variant="outline" onClick={() => window.location.href = "/"}>لوحه اصلي ته تلل</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
