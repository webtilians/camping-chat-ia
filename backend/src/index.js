import express from "express";
import cors from "cors";
import twilio from "twilio";
import { PORT } from "./config.js";
import { chatWithAgent } from "./agentService.js";
import { getSession, clearSession } from "./voiceSessions.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/api/chat", async (req, res) => {
  console.log("peticion recibida del front")
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

app.post("/api/voice", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const { CallSid, SpeechResult, CallStatus } = req.body;
  if (!CallSid) {
    return res.status(400).send("Missing CallSid");
  }

  if (CallStatus === "completed") {
    clearSession(CallSid);
    return res.sendStatus(200);
  }

  const session = getSession(CallSid);

  if (SpeechResult) {
    session.push({ role: "user", content: SpeechResult });
    try {
      const reply = await chatWithAgent(session);
      session.push({ role: "assistant", content: reply });
      twiml.say({ language: "es-ES" }, reply);
    } catch (err) {
      console.error(err);
      twiml.say({ language: "es-ES" }, "Ocurri\u00f3 un error procesando tu mensaje.");
    }
  } else {
    twiml.say({ language: "es-ES" }, "Bienvenido al camping. \u00bfEn qu\u00e9 puedo ayudarte?");
  }

  const gather = twiml.gather({
    input: "speech",
    language: "es-ES",
    action: "/api/voice",
    method: "POST",
    speechTimeout: "auto"
  });
  gather.say({ language: "es-ES" }, "Te escucho");

  res.type("text/xml").send(twiml.toString());
});

app.get("/", (_, res) => {
  res.send("🚀 Backend de chat IA para camping funcionando.");
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
