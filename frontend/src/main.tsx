
  import { createRoot } from "react-dom/client";
  import { registerSW } from "virtual:pwa-register";
  import App from "./App.tsx";
  import "./index.css";
  import { initializeMobileFirst } from "./utils/mobileDetection";

  // Initialize mobile-first setup
  initializeMobileFirst();

  registerSW({
    immediate: true,
  });

  createRoot(document.getElementById("root")!).render(<App />);
  