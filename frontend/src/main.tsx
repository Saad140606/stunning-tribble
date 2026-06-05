  import React from "react";
  import { createRoot } from "react-dom/client";
  import { registerSW } from "virtual:pwa-register";
  import App from "./App.tsx";
  import "./index.css";
  import { initializeMobileFirst } from "./utils/mobileDetection";

  class ErrorBoundary extends React.Component {
    constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
    render() {
      if ((this.state as any).hasError) {
        return <div style={{ padding: 20, color: 'red', background: '#fff', fontSize: 18, whiteSpace: 'pre-wrap' }}>
          <h2>Something went wrong.</h2>
          <p>{String((this.state as any).error)}</p>
          <p>{(this.state as any).error?.stack}</p>
        </div>;
      }
      return (this.props as any).children; 
    }
  }

  // Initialize mobile-first setup
  initializeMobileFirst();

  registerSW({
    immediate: true,
  });

  createRoot(document.getElementById("root")!).render(<ErrorBoundary><App /></ErrorBoundary>);