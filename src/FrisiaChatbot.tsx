import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

const WEBHOOK_URL = "https://n8n.srv1016311.hstgr.cloud/webhook/frisia/chatbot";

type Msg = { role: "user" | "bot"; text: string; ts: string };

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function extractReply(rawText: string) {
  const t = (rawText ?? "").trim();
  if (!t) return "";
  try {
    const j = JSON.parse(t);
    if (typeof j === "string") return j;
    if (j?.reply) return String(j.reply);
    if (j?.message) return String(j.message);
    if (j?.text) return String(j.text);
    if (Array.isArray(j) && j[0]) {
      const a0 = j[0];
      return String(a0.reply || a0.message || a0.text || t);
    }
    return t;
  } catch {
    return t;
  }
}

export default function FrisiaChatbot() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const hasOpenedRef = useRef(false);

  // Handle open/close with animation
  const handleToggle = () => {
    if (open) {
      // Closing - trigger exit animation
      setAnimating(true);
      setTimeout(() => {
        setOpen(false);
        setVisible(false);
        setAnimating(false);
      }, 280);
    } else {
      // Opening
      setOpen(true);
      setVisible(true);
    }
  };

  const welcome = useMemo(
    () =>
      "Welkom bij Frisia Makelaars! Ik ben Lisa, uw digitale assistent. Bent u op zoek naar bedrijfsruimte, of wilt u uw pand verhuren of verkopen?",
    []
  );

  // Track if user has opened the chatbot
  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      setShowNotification(false);
    }
  }, [open]);

  // Show notification after 5 seconds if not opened
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasOpenedRef.current && !open) {
        setShowNotification(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ role: "bot", text: welcome, ts: nowLabel() }]);
    }
  }, [open, msgs.length, welcome]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, sending, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMsgs((m) => [...m, { role: "user", text, ts: nowLabel() }]);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa("frisia-bog:Fr1s1a_B0G_w3bh00k_2024!"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      let reply = "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        reply =
          (typeof data === "string" ? data : "") ||
          data?.reply ||
          data?.message ||
          data?.text ||
          (Array.isArray(data) && data[0] && (data[0].reply || data[0].message || data[0].text)) ||
          "";
        if (!reply) reply = JSON.stringify(data);
      } else {
        const raw = await res.text();
        reply = extractReply(raw);
      }
      reply = (reply || "").trim();
      if (!reply) reply = "Ik heb geen antwoord teruggekregen. Probeer het nog eens.";
      setMsgs((m) => [...m, { role: "bot", text: reply, ts: nowLabel() }]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "bot", text: "Verbinding mislukt. Probeer opnieuw.", ts: nowLabel() },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <style>{`
        .frisia-launcher {
          position: fixed;
          right: 16px;
          bottom: 92px;
          width: 40px;
          height: 40px;
          border-radius: 20px;
          border: 0;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(145deg, #f97316 0%, #ea580c 50%, #dc2626 100%);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
          z-index: 99;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (min-width: 1024px) {
          .frisia-launcher {
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 30px;
            box-shadow: 0 8px 32px rgba(249, 115, 22, 0.4);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .frisia-launcher svg {
            width: 26px;
            height: 26px;
          }
          .frisia-launcher:hover {
            transform: scale(1.12) translateY(-3px);
            box-shadow: 0 20px 50px rgba(249, 115, 22, 0.5);
          }
          .frisia-launcher:active {
            transform: scale(0.92);
            transition: transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
        }
        .frisia-launcher:hover {
          transform: scale(1.08);
        }
        .frisia-launcher:active {
          transform: scale(0.95);
          transition: transform 0.15s ease;
        }
        .frisia-launcher svg {
          width: 18px;
          height: 18px;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .frisia-launcher:hover svg {
          transform: rotate(90deg) scale(1.1);
        }
        .frisia-launcher-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: gentlePulse 3s ease-in-out infinite;
        }
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .frisia-panel {
          position: fixed;
          right: 24px;
          bottom: 100px;
          width: 340px;
          max-width: calc(100vw - 48px);
          height: 480px;
          max-height: calc(100vh - 140px);
          border-radius: 20px;
          background: #ffffff;
          border: none;
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.18),
            0 12px 24px -8px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          z-index: 99999;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          transform-origin: bottom right;
        }
        .frisia-panel.entering {
          animation: panelOpen 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .frisia-panel.exiting {
          animation: panelClose 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes panelOpen {
          0% { opacity: 0; transform: scale(0.85) translateY(20px); }
          50% { opacity: 1; }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes panelClose {
          0% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.9) translateY(16px); }
        }
        @keyframes panelSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .frisia-header {
          margin: 0;
          padding: 14px 16px;
          background: linear-gradient(145deg, #f97316 0%, #ea580c 60%, #dc2626 100%);
          border-radius: 20px 20px 0 0;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }
        .frisia-header::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        .frisia-header-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .frisia-header-content { flex: 1; }
        .frisia-title {
          font-weight: 600;
          font-size: 15px;
          letter-spacing: -0.02em;
        }
        .frisia-subtitle {
          font-size: 11px;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }
        .frisia-online-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
        }
        .frisia-close {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 0;
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .frisia-close:hover { background: rgba(255, 255, 255, 0.25); }
        .frisia-close svg { width: 16px; height: 16px; }
        .frisia-body {
          flex: 1;
          padding: 14px;
          overflow-y: auto;
          background: #f9fafb;
          scroll-behavior: smooth;
        }
        .frisia-body::-webkit-scrollbar { width: 4px; }
        .frisia-body::-webkit-scrollbar-track { background: transparent; }
        .frisia-body::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }
        .frisia-message {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
          animation: messageIn 0.3s ease-out;
        }
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .frisia-message.user { flex-direction: row-reverse; }
        .frisia-msg-avatar {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .frisia-msg-avatar.bot { background: #fff7ed; color: #ea580c; }
        .frisia-msg-avatar.user { background: #eff6ff; color: #2563eb; }
        .frisia-msg-avatar svg { width: 14px; height: 14px; }
        .frisia-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .frisia-message.bot .frisia-bubble {
          background: #ffffff;
          color: #1f2937;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-bottom-left-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .frisia-message.user .frisia-bubble {
          background: linear-gradient(145deg, #f97316, #ea580c);
          color: #ffffff;
          border-bottom-right-radius: 6px;
        }
        .frisia-timestamp {
          margin-top: 4px;
          font-size: 10px;
          color: #9ca3af;
        }
        .frisia-message.user .frisia-timestamp {
          text-align: right;
          color: rgba(255, 255, 255, 0.7);
        }
        .frisia-typing {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .frisia-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d1d5db;
          animation: typingDot 1.4s ease-in-out infinite;
        }
        .frisia-typing span:nth-child(2) { animation-delay: 0.15s; }
        .frisia-typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .frisia-footer {
          padding: 12px 14px 14px;
          background: #ffffff;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .frisia-composer {
          display: flex;
          gap: 8px;
          align-items: center;
          background: #f3f4f6;
          border-radius: 14px;
          padding: 6px 6px 6px 14px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: border-color 0.2s ease;
        }
        .frisia-composer:focus-within { border-color: rgba(249, 115, 22, 0.4); }
        .frisia-input {
          flex: 1;
          border: 0;
          outline: none;
          font-size: 13px;
          background: transparent;
          color: #1f2937;
        }
        .frisia-input::placeholder { color: #9ca3af; }
        .frisia-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 0;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(145deg, #f97316, #ea580c);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .frisia-send-btn:hover:not(:disabled) { transform: scale(1.05); }
        .frisia-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .frisia-send-btn svg { width: 16px; height: 16px; }
        .frisia-powered {
          text-align: center;
          margin-top: 10px;
          font-size: 10px;
          color: #9ca3af;
        }
        .frisia-powered-link {
          color: #6b7280;
          font-weight: 600;
          text-decoration: none;
        }
        .frisia-powered-link:hover { color: #f97316; }
        @media (max-width: 480px) {
          .frisia-panel {
            right: 12px;
            left: 12px;
            bottom: 100px;
            width: auto;
            height: 380px;
            border-radius: 16px;
          }
        }
        .frisia-markdown p { margin: 0; }
        .frisia-markdown p + p { margin-top: 6px; }
        .frisia-markdown strong { font-weight: 600; }
        .frisia-markdown em { font-style: italic; }
        .frisia-markdown ul, .frisia-markdown ol { margin: 4px 0; padding-left: 18px; }
        .frisia-markdown li { margin: 2px 0; }
        .frisia-markdown a { color: #f97316; text-decoration: underline; }
        .frisia-notification {
          position: fixed;
          right: 68px;
          bottom: 96px;
          background: #ffffff;
          border-radius: 10px;
          padding: 8px 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          max-width: 180px;
          font-size: 11px;
          color: #1f2937;
          line-height: 1.4;
          animation: notificationSlideIn 0.3s ease-out;
          z-index: 98;
          cursor: pointer;
        }
        .frisia-notification::after {
          content: '';
          position: absolute;
          right: -6px;
          bottom: 14px;
          width: 0;
          height: 0;
          border-left: 8px solid #ffffff;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
        }
        @keyframes notificationSlideIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (min-width: 1024px) {
          .frisia-notification {
            bottom: 34px;
            right: 94px;
          }
        }
        @media (max-width: 480px) {
          .frisia-notification {
            right: 86px;
            bottom: 26px;
            max-width: 180px;
            font-size: 11px;
          }
        }
      `}</style>

      {showNotification && !open && (
        <div
          className="frisia-notification"
          onClick={() => {
            setShowNotification(false);
            setOpen(true);
            setVisible(true);
          }}
        >
          💡 Laat mij u helpen met aanbod zoeken
        </div>
      )}

      <button
        className="frisia-launcher"
        onClick={handleToggle}
        aria-label="Open chat"
      >
        {open ? <X /> : <span className="frisia-launcher-icon"><MessageCircle /></span>}
      </button>

      {visible && (
        <div className={`frisia-panel ${animating ? "exiting" : "entering"}`}>
          <div className="frisia-header">
            <div className="frisia-header-content">
              <div className="frisia-subtitle">
                <span className="frisia-online-dot" />
                Altijd beschikbaar
              </div>
            </div>
            <button className="frisia-close" onClick={handleToggle} aria-label="Sluiten">
              <X />
            </button>
          </div>

          <div className="frisia-body" ref={scrollerRef}>
            {msgs.map((m, idx) => (
              <div key={idx} className={`frisia-message ${m.role}`}>
                <div className="frisia-bubble">
                  <div className="frisia-markdown">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                  <div className="frisia-timestamp">{m.ts}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="frisia-message bot">
                <div className="frisia-bubble">
                  <div className="frisia-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="frisia-footer">
            <div className="frisia-composer">
              <input
                className="frisia-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="Typ uw bericht..."
              />
              <button
                className="frisia-send-btn"
                onClick={send}
                disabled={sending || !input.trim()}
              >
                <Send />
              </button>
            </div>
            <div className="frisia-powered">
              Created by{" "}
              <a
                href="https://www.theaidoctor.nl/"
                target="_blank"
                rel="noopener noreferrer"
                className="frisia-powered-link"
              >
                The AI Doctor
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
