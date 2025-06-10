import { DynamicTool } from "langchain/tools";
import preciosReserva from "../preciosReserva.json" assert { type: "json" };

function tablaExtras() {
  const rows = preciosReserva.extras
    .map(e => `<tr><td>${e.nombre}</td><td>${e.precio_noche}</td></tr>`)
    .join("\n");
  return `<table border="1" cellspacing="0" cellpadding="4">
<tr><th>Extra</th><th>Precio por noche (&euro;)</th></tr>
${rows}
</table>`;
}

function tablaPrecios(parcela, temporada) {
  const rows = parcela.clientes
    .map(c => `<tr><td>${c.tipo_cliente}</td><td>${c.precio_noche}</td></tr>`)
    .join("\n");
  return `<h3>${parcela.tipo_parcela} - ${temporada}</h3>
<table border="1" cellspacing="0" cellpadding="4">
<tr><th>Tipo de cliente</th><th>Precio por noche (&euro;)</th></tr>
${rows}
</table>`;
}

const listaPreciosHTMLTool = new DynamicTool({
  name: "listaPreciosHTML",
  description:
    "Devuelve listas de precios en formato HTML con tablas. Puedes especificar temporada (baja, media, alta) y tipo de parcela (estándar, premium, bungalow, glamping). También puedes pedir la tabla de extras.",
  func: async (input) => {
    const lower = input.toLowerCase();

    if (lower.includes("extra")) {
      return tablaExtras();
    }

    let temporadas = preciosReserva.temporadas;
    const tMatch = temporadas.find(t => lower.includes(t.nombre.toLowerCase()));
    if (tMatch) temporadas = [tMatch];

    const tipoParcelaNombre = ["parcela estándar", "parcela estandar", "parcela premium", "bungalow", "glamping"].find(n => lower.includes(n));

    let html = "";
    temporadas.forEach(t => {
      let precios = t.precios;
      if (tipoParcelaNombre) {
        const p = precios.find(p => p.tipo_parcela.toLowerCase().includes(tipoParcelaNombre.replace("parcela ", "")) || p.tipo_parcela.toLowerCase() === tipoParcelaNombre);
        precios = p ? [p] : [];
      }
      precios.forEach(parcela => {
        html += tablaPrecios(parcela, t.nombre) + "\n";
      });
    });

    if (!html) {
      return "No se encontraron precios para esa consulta.";
    }
    return html.trim();
  }
});

export default listaPreciosHTMLTool;
