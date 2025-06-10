import { DynamicTool } from "langchain/tools";
import disponibilidad from "../disponibilidad.json" assert { type: "json" };
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reservasPath = join(__dirname, "../reservas.json");

async function loadReservas() {
  try {
    const data = await fs.readFile(reservasPath, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function parseFechas(text) {
  const m = text.match(/(?:del?)?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s*(?:al?|hasta)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!m) return null;
  const d1 = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d2 = `${m[6]}-${m[5].padStart(2, "0")}-${m[4].padStart(2, "0")}`;
  return { desde: d1, hasta: d2 };
}

function parseTipo(text) {
  if (text.includes("estandar") || text.includes("estándar")) return "Parcela Estándar";
  if (text.includes("premium")) return "Parcela Premium";
  if (text.includes("bungalow")) return "Bungalow";
  if (text.includes("glamping")) return "Glamping";
  return null;
}

function overlaps(aInicio, aFin, bInicio, bFin) {
  return aInicio <= bFin && bInicio <= aFin;
}

const comprobarDisponibilidadTool = new DynamicTool({
  name: "comprobarDisponibilidad",
  description:
    "Comprueba la disponibilidad de alojamientos para unas fechas y opcionalmente un tipo de parcela. Ejemplo: 'Disponibilidad de bungalow del 1/7/2025 al 5/7/2025'",
  func: async (input) => {
    const lower = input.toLowerCase();
    const fechas = parseFechas(lower);
    if (!fechas) {
      return "Indica las fechas con formato dd/mm/aaaa (del X al Y).";
    }
    const tipoSolicitado = parseTipo(lower);

    const reservas = await loadReservas();
    const inicio = new Date(fechas.desde);
    const fin = new Date(fechas.hasta);

    const ocupadas = {};
    reservas.forEach(r => {
      if (!r.desde || !r.hasta || !r.tipoParcela) return;
      if (overlaps(new Date(r.desde), new Date(r.hasta), inicio, fin)) {
        ocupadas[r.tipoParcela] = (ocupadas[r.tipoParcela] || 0) + 1;
      }
    });

    const tipos = tipoSolicitado ? [tipoSolicitado] : Object.keys(disponibilidad);
    let respuesta = "";
    tipos.forEach(t => {
      const total = disponibilidad[t] || 0;
      const libres = Math.max(0, total - (ocupadas[t] || 0));
      respuesta += `${t}: ${libres} disponibles de ${total}\n`;
    });

    return respuesta.trim();
  }
});

export default comprobarDisponibilidadTool;
