import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import FrisiaChatbot from "./FrisiaChatbot"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FrisiaChatbot />
  </StrictMode>
)
