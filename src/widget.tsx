import React from "react";
import { createRoot } from "react-dom/client";
import FrisiaChatbot from "./FrisiaChatbot";

function mount() {
  if (document.getElementById("frisia-chatbot-root")) return;

  const el = document.createElement("div");
  el.id = "frisia-chatbot-root";
  document.body.appendChild(el);

  createRoot(el).render(
    <React.StrictMode>
      <FrisiaChatbot />
    </React.StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
