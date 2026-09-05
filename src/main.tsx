import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ensurePdfjsWorker } from "@/lib/pdf";
import "./styles/app.css";

ensurePdfjsWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
