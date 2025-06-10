import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";

// Importa las tools desde la carpeta tools
import sumTool from "./tools/sumTool.js";
import verPreciosReservaTool from "./tools/verPreciosReservaTool.js";
import listaPreciosHTMLTool from "./tools/listaPreciosHTMLTool.js";
// (Aquí puedes importar más tools en el futuro)

const tools = [sumTool, verPreciosReservaTool, listaPreciosHTMLTool];

const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
  temperature: 0.7,
});

// Agent executor singleton
let executorPromise;
async function getExecutor() {
  if (!executorPromise) {
    console.log("[AGENT] Inicializando AgentExecutor con tools...");
    executorPromise = initializeAgentExecutorWithOptions(tools, llm, {
      agentType: "openai-functions",
      verbose: true,
      returnIntermediateSteps: true,
    });
  }
  return executorPromise;
}

/**
 * Envía el historial completo de mensajes al agente.
 * @param {Array} messages - [{role: "user"|"assistant", content: string}]
 * @returns {Promise<string>} - Respuesta del agente.
 */
export async function chatWithAgent(messages) {
  const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === "user");
  if (lastUserMsgIndex === -1) {
    console.log("[AGENT] No hay mensaje de usuario. Abortando.");
    return "No he recibido ningún mensaje de usuario.";
  }
  const realLastUserMsgIndex = messages.length - 1 - lastUserMsgIndex;
  const lastUserMsg = messages[realLastUserMsgIndex];

  const chat_history = messages.slice(0, realLastUserMsgIndex)
    .map(m => ({ role: m.role, content: m.content }));

  console.log(`[AGENT] Mensaje recibido: "${lastUserMsg.content}"`);
  if (chat_history.length) {
    console.log(`[AGENT] Historial enviado (${chat_history.length} mensajes):`);
    chat_history.forEach((m, i) => console.log(`  [${m.role}] ${m.content}`));
  }

  // Llamada al agente con historial
  const executor = await getExecutor();
  const result = await executor.call({
    input: lastUserMsg.content,
    chat_history,
  });

  // LOG del resultado
  if (result && result.intermediateSteps) {
    if (result.intermediateSteps.length) {
      console.log('\n=== Flujo de Razonamiento ===');
      result.intermediateSteps.forEach((step, index) => {
        console.log(`\nPaso ${index + 1}:`);
        console.log(`- Acción: ${step.action.tool}`);
        console.log(`- Observación: ${step.observation}`);
      });
    }
    if (result.output) {
      console.log('\n=== Respuesta Final ===');
      console.log(result.output);
      console.log('========================\n');
    }
  } else {
    console.log("[AGENT] No se detectaron intermediateSteps.");
    console.log(`[AGENT] Respuesta final: "${result.output}"`);
  }
  return result.output || "No pude responder.";
}
