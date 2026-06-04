
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { initializeMobileFirst } from "./utils/mobileDetection";

  // Initialize mobile-first setup
  initializeMobileFirst();

  createRoot(document.getElementById("root")!).render(<App />);
  