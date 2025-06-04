import { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:5000/api/chat"; // Cambia si usas otro puerto/backend

// Paleta de colores
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
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Convierte los mensajes de nuestro frontend al formato OpenAI API
  const getOpenAIMessages = () => [
    { role: "system", content: "Eres un agente útil y simpático de camping." },
    ...messages
      .filter(msg => msg.text && msg.text.trim() !== "")
      .map(msg => ({
        role: msg.user === "yo" ? "user" : "assistant",
        content: msg.text,
      })),
  ];

  // Envía el mensaje al backend y obtiene respuesta
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { user: "yo", text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: getOpenAIMessages().concat({ role: "user", content: input }) }),
      });
      const data = await res.json();
      setMessages(msgs => [...msgs, { user: "ia", text: data.reply }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { user: "ia", text: "❌ Error conectando con el backend" }]);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: COLORS.background,
      }}
    >
      <div
        style={{
          width: "100vw",
          height: "100vh",
          maxWidth: "100vw",
          maxHeight: "100vh",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            borderBottom: `1.5px solid ${COLORS.border}`,
            padding: "24px 36px",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "0.5px",
            background: "#fafcff",
          }}
        >
          Chat IA Camping 🏕️
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "36px 22vw 24px 22vw", // Centramos mensajes y damos aire a los lados
            display: "flex",
            flexDirection: "column",
            gap: 18,
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
                padding: "14px 20px",
                maxWidth: "45vw", // Se adaptan a ancho de pantalla
                fontSize: 17,
                boxShadow:
                  msg.user === "yo"
                    ? "0 2px 6px rgba(0,110,200,0.04)"
                    : "0 2px 6px rgba(60,60,130,0.06)",
              }}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
          {loading && (
            <div
              style={{
                alignSelf: "flex-start",
                background: COLORS.iaMsg,
                color: COLORS.text,
                borderRadius: 16,
                borderBottomLeftRadius: 4,
                padding: "12px 18px",
                fontSize: 17,
                opacity: 0.7,
                fontStyle: "italic",
              }}
            >
              Pensando...
            </div>
          )}
        </div>
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            borderTop: `1.5px solid ${COLORS.border}`,
            background: "#fafcff",
            padding: "20px 22vw",
            gap: 12,
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
              padding: "16px",
              borderRadius: 14,
              background: "#f2f7fd",
              fontSize: 16.5,
              color:"black"
            }}
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              background: "#2f7de0",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "0 34px",
              fontSize: 17,
              fontWeight: 600,
              cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              opacity: !input.trim() || loading ? 0.4 : 1,
              transition: "opacity .2s",
            }}
          >
            {loading ? "..." : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
  
}

export default App;
