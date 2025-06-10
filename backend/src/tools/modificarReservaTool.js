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

const modificarReservaTool = new DynamicTool({
  name: "modificarReserva",
  description: "Modifica una reserva existente indicando su id y la nueva información (fechas o tipo de parcela). Ejemplo: 'modificar reserva 123 a bungalow del 1/7/2025 al 5/7/2025'",
  func: async (input) => {
    const lower = input.toLowerCase();
    const idMatch = lower.match(/reserva\s+(\d+)/);
    if (!idMatch) return "Debes indicar el id de la reserva a modificar.";
    const id = parseInt(idMatch[1]);

    const reservas = await loadReservas();
    const r = reservas.find(res => res.id === id);
    if (!r) return `No se encontró la reserva ${id}.`;

    const fechas = parseFechas(lower);
    if (fechas) {
      r.desde = fechas.desde;
      r.hasta = fechas.hasta;
    }
    const tipo = parseTipo(lower);
    if (tipo) {
      r.tipoParcela = tipo;
    }
    r.descripcion = input.trim();

    await saveReservas(reservas);
    const info = [];
    if (r.tipoParcela) info.push(r.tipoParcela);
    if (r.desde && r.hasta) info.push(`del ${r.desde} al ${r.hasta}`);
    return `Reserva ${id} actualizada: ${info.join(" ")}`;
  }
});

export default modificarReservaTool;
