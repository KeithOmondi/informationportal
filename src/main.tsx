import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { setStoreReference } from "./store/storeAccessor";
import { store } from "./store/store";

/* =====================================================
    ROOT RENDER
===================================================== */
setStoreReference(store)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);