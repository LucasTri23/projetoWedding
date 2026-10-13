import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "./lib/context";
import App from "./App";
import "./styles.css";
import "./lib/pwa";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>,
);
