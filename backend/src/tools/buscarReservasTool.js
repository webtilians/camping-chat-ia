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

function overlaps(aInicio, aFin, bInicio, bFin) {
  return aInicio <= bFin && bInicio <= aFin;
}

const buscarReservasTool = new DynamicTool({
  name: "buscarReservas",
  description: "Busca reservas por id, por tipo de parcela o por rango de fechas. Ejemplos: 'buscar reserva 123', 'buscar reservas de bungalow', 'buscar reservas del 1/7/2025 al 10/7/2025'",
  func: async (input) => {
    const lower = input.toLowerCase();
    const idMatch = lower.match(/reserva\s+(\d+)/);
    const reservas = await loadReservas();

    if (idMatch) {
      const id = parseInt(idMatch[1]);
      const r = reservas.find(res => res.id === id);
      if (!r) return `No se encontr\u00f3 la reserva ${id}.`;
      const info = [];
      if (r.tipoParcela) info.push(r.tipoParcela);
      if (r.desde && r.hasta) info.push(`del ${r.desde} al ${r.hasta}`);
      return `${r.id}: ${info.join(" ") || r.descripcion}`;
    }

    const tipo = parseTipo(lower);
    const fechas = parseFechas(lower);
    const inicio = fechas ? new Date(fechas.desde) : null;
    const fin = fechas ? new Date(fechas.hasta) : null;

    const filtradas = reservas.filter(r => {
      if (tipo && r.tipoParcela !== tipo) return false;
      if (fechas && !(overlaps(new Date(r.desde), new Date(r.hasta), inicio, fin))) return false;
      return true;
    });

    if (!filtradas.length) return "No se encontraron reservas que coincidan.";
    return filtradas
      .map(r => {
        const info = [];
        if (r.tipoParcela) info.push(r.tipoParcela);
        if (r.desde && r.hasta) info.push(`del ${r.desde} al ${r.hasta}`);
        return `${r.id}: ${info.join(" ") || r.descripcion}`;
      })
      .join("\n");
  }
});

export default buscarReservasTool;
