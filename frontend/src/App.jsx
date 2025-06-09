import { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:5000/api/chat"; // Cambia si usas otro puerto/backend

const COLORS = {
  background: "#f4f6fb",
  border: "#dee3ea",
  myMsg: "#d0ebff",
  iaMsg: "#fff",
  text: "#222",
};

function App() {
  // Usamos formato OpenAI desde el principio
  const [messages, setMessages] = useState([
    { role: "system", content: "Eres un agente útil y simpático de camping." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviamos todo el historial, el backend ya espera el formato correcto
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    // Añadimos el mensaje del usuario al historial
    setMessages(msgs => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Enviamos todo el historial actualizado
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      setMessages(msgs => [...msgs, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { role: "assistant", content: "❌ Error conectando con el backend" }]);
    }
    setLoading(false);
  };

  // Renderiza cada mensaje en base a su role
  const renderMessage = (msg, idx) => {
    let alignSelf = "flex-start";
    let background = COLORS.iaMsg;
    if (msg.role === "user") {
      alignSelf = "flex-end";
      background = COLORS.myMsg;
    }
    if (msg.role === "system") {
      // Puedes ocultar los mensajes 'system' en la UI si prefieres
      return null;
    }
    return (
      <div
        key={idx}
        style={{
          alignSelf,
          background,
          color: COLORS.text,
          borderRadius: 16,
          borderBottomRightRadius: msg.role === "user" ? 4 : 16,
          borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
          padding: "14px 20px",
          maxWidth: "45vw",
          fontSize: 17,
          boxShadow:
            msg.role === "user"
              ? "0 2px 6px rgba(0,110,200,0.04)"
              : "0 2px 6px rgba(60,60,130,0.06)",
        }}
      >
        {msg.content}
      </div>
    );
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
            padding: "36px 22vw 24px 22vw",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Mensaje de bienvenida solo visual, ya está como system */}
          <div
            style={{
              alignSelf: "flex-start",
              background: COLORS.iaMsg,
              color: COLORS.text,
              borderRadius: 16,
              borderBottomLeftRadius: 4,
              padding: "14px 20px",
              maxWidth: "45vw",
              fontSize: 17,
              boxShadow: "0 2px 6px rgba(60,60,130,0.06)",
              marginBottom: 8,
            }}
          >
            ¡Hola! ¿En qué puedo ayudarte para tu camping? 🌲
          </div>
          {messages.map(renderMessage)}
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
