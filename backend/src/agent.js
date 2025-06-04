const { OpenAI } = require("openai");
const { OPENAI_API_KEY } = require("./config");

// Aquí luego podrás importar LangChain y tools
// Ejemplo de "envoltura" de agente

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function chatWithAgent(messages) {
  // Aquí puedes interceptar los mensajes y meter lógica de LangChain después
  // Por ahora solo reenvía a GPT-4o

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages, // [{ role: 'user', content: 'Hola...' }, ...]
  });

  return response.choices[0].message.content;
}

module.exports = { chatWithAgent };
