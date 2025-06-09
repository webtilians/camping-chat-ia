import { DynamicTool } from "langchain/tools";
import preciosReserva from "../preciosReserva.json" assert { type: "json" };

// Helper para detectar meses en español
const meses = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

// Helper para calcular noches entre dos fechas (dd/mm/yyyy)
function calcularNoches(desde, hasta) {
  const [d1, m1, a1] = desde.split(/[\/\-]/).map(Number);
  const [d2, m2, a2] = hasta.split(/[\/\-]/).map(Number);
  const date1 = new Date(a1, m1 - 1, d1);
  const date2 = new Date(a2, m2 - 1, d2);
  return Math.max(1, Math.ceil((date2 - date1) / (1000 * 60 * 60 * 24)));
}

const tiposCliente = [
  "adulto", "niño", "senior", "persona con discapacidad", "mascota", "grupo"
];

// ----- TOOL PRO ---------
const verPreciosReservaTool = new DynamicTool({
  name: "verPreciosReserva",
  description: `Calcula el precio total de reservas según tipo de cliente, parcela, temporada/mes y extras. También muestra tablas de precios o extras disponibles. Ejemplos: 
    - "Precio para 2 adultos y 1 niño en bungalow en agosto con electricidad para 4 noches"
    - "Reserva para 3 adultos y 2 mascotas del 2/8/2025 al 5/8/2025 en glamping con coche"
    - "Tabla de precios de parcela premium en temporada alta"
    - "Extras disponibles"
  `,
  func: async (input) => {
    try {
      input = input.toLowerCase();

      // 1. Extras pedidos
      const extrasSolicitados = [];
      preciosReserva.extras.forEach(extra => {
        if (input.includes(extra.nombre.toLowerCase())) {
          extrasSolicitados.push(extra);
        }
      });

      // 2. Temporada/mes
      let temporada = null;
      for (const t of preciosReserva.temporadas) {
        if (input.includes(t.nombre.toLowerCase())) {
          temporada = t;
          break;
        }
      }
      if (!temporada) {
        const mesDetectado = meses.find(m => input.includes(m));
        if (mesDetectado) {
          const mapping = {
            "enero": "Temporada Baja", "febrero": "Temporada Baja", "marzo": "Temporada Baja",
            "abril": "Temporada Media", "mayo": "Temporada Media", "junio": "Temporada Media",
            "julio": "Temporada Alta", "agosto": "Temporada Alta", "septiembre": "Temporada Alta",
            "octubre": "Temporada Media", "noviembre": "Temporada Baja", "diciembre": "Temporada Baja"
          };
          temporada = preciosReserva.temporadas.find(t => t.nombre === mapping[mesDetectado]);
        }
      }

      // 3. Fechas y noches
      let noches = 1;
      let desde, hasta;
      const fechasMatch = input.match(/del?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s*(al?|hasta)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (fechasMatch) {
        desde = `${fechasMatch[1]}/${fechasMatch[2]}/${fechasMatch[3]}`;
        hasta = `${fechasMatch[5]}/${fechasMatch[6]}/${fechasMatch[7]}`;
        noches = calcularNoches(desde, hasta);
      } else {
        const nochesMatch = input.match(/(\d+)\s*(noches|días|dias)/);
        if (nochesMatch) noches = parseInt(nochesMatch[1]);
      }

      // 4. Tipo de parcela
      let tipoParcela = null;
      if (temporada) {
        tipoParcela = temporada.precios.find(p =>
          input.includes(p.tipo_parcela.toLowerCase())
        );
      }

      // 5. Detectar clientes y cantidades
      const clientesSolicitados = [];
      tiposCliente.forEach(tipo => {
        const regex = new RegExp(`(\\d+)\\s*${tipo}`, 'g');
        let m; let total = 0;
        while ((m = regex.exec(input)) !== null) {
          total += parseInt(m[1]);
        }
        if (input.includes(tipo) && total === 0) total = 1;
        if (total > 0) clientesSolicitados.push({ tipo, cantidad: total });
      });

      // --------- Mensajes si falta info (devolver TODO lo que hace falta a la vez) ---------
      let missing = [];
      if (!temporada) missing.push("temporada, mes o fecha de la reserva");
      if (!tipoParcela) missing.push("tipo de parcela (estándar, premium, bungalow, glamping, etc.)");
      if (!clientesSolicitados.length) missing.push("número y tipo de personas (ejemplo: 2 adultos y 3 niños)");

      if (missing.length) {
        return `Para calcular el precio necesito TODOS estos datos en un solo mensaje:
- Número y tipo de personas (ejemplo: 2 adultos y 3 niños)
- Tipo de parcela (estándar, premium, bungalow, glamping, etc.)
- Temporada, mes o fecha de la reserva
- Extras que deseas añadir (electricidad, coche, etc. - opcional)

Ahora mismo falta${missing.length > 1 ? 'n' : ''}: ${missing.join(", ")}.
Por favor, envíame todo junto para darte el precio exacto.`;
      }

      // --------- Extras disponibles o tabla de precios ---------
      if (input.includes("extras disponibles") || input.includes("lista de extras")) {
        return "Extras disponibles:\n" +
          preciosReserva.extras.map(e => `- ${e.nombre}: ${e.precio_noche}€/noche`).join("\n");
      }

      if (input.includes("tabla")) {
        let tabla = `Tabla de precios de "${tipoParcela.tipo_parcela}" en "${temporada.nombre}":\n`;
        tabla += tipoParcela.clientes.map(
          c => `- ${c.tipo_cliente}: ${c.precio_noche}€/noche`
        ).join("\n");
        return tabla;
      }

      // --------- Calcular precios ---------
      let total = 0;
      let desglose = [];
      clientesSolicitados.forEach(cs => {
        const c = tipoParcela.clientes.find(cl =>
          cl.tipo_cliente.toLowerCase().includes(cs.tipo)
        );
        if (c) {
          const subtotal = c.precio_noche * cs.cantidad * noches;
          desglose.push(`${cs.cantidad} ${c.tipo_cliente}${cs.cantidad > 1 ? 's' : ''}: ${c.precio_noche}€/noche x ${noches} noche(s) = ${subtotal}€`);
          total += subtotal;
        } else {
          desglose.push(`No hay tarifa para ${cs.cantidad} ${cs.tipo}(s) en esta parcela.`);
        }
      });

      // Extras
      if (extrasSolicitados.length) {
        extrasSolicitados.forEach(extra => {
          const subtotal = extra.precio_noche * noches;
          desglose.push(`Extra "${extra.nombre}": ${extra.precio_noche}€/noche x ${noches} noche(s) = ${subtotal}€`);
          total += subtotal;
        });
      }

      // ---- Respuesta final, clara y directa ----
      let respuesta = `Reserva para ${clientesSolicitados.map(cs => `${cs.cantidad} ${cs.tipo}${cs.cantidad>1?'s':''}`).join(', ')}\n`;
      respuesta += `Tipo de parcela: ${tipoParcela.tipo_parcela}\n`;
      respuesta += `Temporada: ${temporada.nombre}\n`;
      respuesta += `Noches: ${noches}\n`;
      if (extrasSolicitados.length) respuesta += `Extras: ${extrasSolicitados.map(e=>e.nombre).join(', ')}\n`;
      respuesta += `\nDesglose:\n${desglose.join('\n')}\n\nTotal: ${total}€`;

      return respuesta;
    } catch (err) {
      return "Hubo un error al procesar tu consulta: " + err.message;
    }
  }
});

export default verPreciosReservaTool;
