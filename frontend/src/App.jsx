import { useState, useRef, useEffect } from "react";

// Paleta de colores simple para look pro
const COLORS = {
  background: "#f4f6fb",
  border: "#dee3ea",
  myMsg: "#d0ebff",
  iaMsg: "#fff",
  text: "#222",
};

function App() {
  const [messages, setMessages] = useState([
    { user: "ia", text: "¡Hola! ¿En qué puedo ayudarte para tu camping? 🌲" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simula respuesta IA (más adelante llamaremos al backend)
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { user: "yo", text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput("");

    // Demo respuesta automática (sustituir por fetch al backend después)
    setTimeout(() => {
      setMessages(msgs =>
        [...msgs, { user: "ia", text: "Respuesta demo de la IA 🤖" }]
      );
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 380,
          boxShadow: "0 8px 32px rgba(60,60,130,0.14)",
          borderRadius: 20,
          border: `1.5px solid ${COLORS.border}`,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          height: 520,
        }}
      >
        <div
          style={{
            borderBottom: `1.5px solid ${COLORS.border}`,
            padding: "18px 28px",
            fontWeight: 700,
            fontSize: 19,
            letterSpacing: "0.5px",
            background: "#fafcff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          Chat IA Camping 🏕️
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 20px 8px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.user === "yo" ? "flex-end" : "flex-start",
                background: msg.user === "yo" ? COLORS.myMsg : COLORS.iaMsg,
                color: COLORS.text,
                borderRadius: 16,
                borderBottomRightRadius: msg.user === "yo" ? 4 : 16,
                borderBottomLeftRadius: msg.user === "ia" ? 4 : 16,
                padding: "10px 16px",
                maxWidth: "75%",
                fontSize: 15.5,
                boxShadow:
                  msg.user === "yo"
                    ? "0 2px 6px rgba(0,110,200,0.03)"
                    : "0 2px 6px rgba(60,60,130,0.04)",
              }}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            borderTop: `1.5px solid ${COLORS.border}`,
            background: "#fafcff",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            padding: "14px 18px",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              padding: "12px",
              borderRadius: 12,
              background: "#f2f7fd",
              fontSize: 15.5,
            }}
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              background: "#2f7de0",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "0 22px",
              fontSize: 16,
              fontWeight: 600,
              cursor: !input.trim() ? "not-allowed" : "pointer",
              opacity: !input.trim() ? 0.4 : 1,
              transition: "opacity .2s",
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
