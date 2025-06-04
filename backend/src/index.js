const express = require("express");
const cors = require("cors");
const { PORT } = require("./config");
const { chatWithAgent } = require("./agent");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Debes enviar un array de messages estilo OpenAI." });
    }
    const reply = await chatWithAgent(messages);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error procesando el mensaje." });
  }
});

app.get("/", (_, res) => {
  res.send("🚀 Backend de chat IA para camping funcionando.");
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
