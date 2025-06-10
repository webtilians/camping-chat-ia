import { DynamicTool } from "langchain/tools";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reservasPath = join(__dirname, "../reservas.json");

function parseFechas(text) {
  const m = text.match(/(?:del?)?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s*(?:al?|hasta)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!m) return null;
  const d1 = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d2 = `${m[6]}-${m[5].padStart(2, "0")}-${m[4].padStart(2, "0")}`;
  return { desde: d1, hasta: d2 };
}

function parseTipo(text) {
  const lower = text.toLowerCase();
  if (lower.includes("estandar") || lower.includes("estándar")) return "Parcela Estándar";
  if (lower.includes("premium")) return "Parcela Premium";
  if (lower.includes("bungalow")) return "Bungalow";
  if (lower.includes("glamping")) return "Glamping";
  return null;
}

async function loadReservas() {
  try {
    const data = await fs.readFile(reservasPath, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveReservas(reservas) {
  await fs.writeFile(reservasPath, JSON.stringify(reservas, null, 2));
}

const gestionarReservasTool = new DynamicTool({
  name: "gestionarReservas",
  description:
    "Permite crear, listar o cancelar reservas. Usa frases como 'crear reserva', 'listar reservas' o 'cancelar reserva <id>'.",
  func: async (input) => {
    const lower = input.toLowerCase();
    let reservas = await loadReservas();

    if (lower.includes("listar")) {
      if (!reservas.length) return "No hay reservas registradas.";
      return reservas
        .map(r => {
          const info = [];
          if (r.tipoParcela) info.push(r.tipoParcela);
          if (r.desde && r.hasta) info.push(`del ${r.desde} al ${r.hasta}`);
          return `${r.id}: ${info.join(" ") || r.descripcion}`;
        })
        .join("\n");
    }

    const cancelMatch = lower.match(/cancelar\s+reserva\s+(\d+)/);
    if (cancelMatch) {
      const id = parseInt(cancelMatch[1]);
      const idx = reservas.findIndex(r => r.id === id);
      if (idx === -1) return `No se encontró reserva con id ${id}.`;
      reservas.splice(idx, 1);
      await saveReservas(reservas);
      return `Reserva ${id} cancelada.`;
    }

    if (lower.includes("crear") || lower.includes("reservar")) {
      const id = Date.now();
      const fechas = parseFechas(lower);
      const tipoParcela = parseTipo(lower);
      reservas.push({
        id,
        descripcion: input.trim(),
        tipoParcela,
        ...(fechas || {})
      });
      await saveReservas(reservas);
      return `Reserva creada con id ${id}.`;
    }

    return "No entendí la acción. Puedes decir 'crear reserva', 'listar reservas' o 'cancelar reserva <id>'.";
  }
});

export default gestionarReservasTool;
