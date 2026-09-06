/**
 * Genera un sitemap.xml y un robots.txt POR HOST, en public/_h/<grupo>/.
 *
 * POR QUE POR HOST. El mismo deployment sirve credex.cl y credexapp.com. Con un
 * solo archivo, verificado en produccion el 2026-09-02:
 *     credexapp.com/sitemap.xml  ->  15 URLs, TODAS de credex.cl
 *     credexapp.com/robots.txt   ->  Sitemap: https://www.credex.cl/sitemap.xml
 * Es decir: las cuatro paginas internacionales (/, /pe, /co, /ar), que son las
 * que declaran su propio canonical y el hreflang, no estaban en ningun sitemap,
 * y el dominio internacional le entregaba a Google el mapa del otro dominio.
 *
 * vercel.json enruta /sitemap.xml y /robots.txt a la variante de cada host con
 * "has": [{"type":"host"}], la misma tecnica que ya usa el prerender del <head>.
 * Por eso no puede existir public/sitemap.xml ni public/robots.txt en la raiz:
 * Vercel consulta el sistema de archivos ANTES que los rewrites y volveria a
 * servir el mismo archivo en los dos dominios.
 *
 * FUENTE UNICA DE VERDAD: src/config/seo.js. Las URLs salen de
 * sitemapEntriesForHost(), que filtra las rutas por su canonical real en ese
 * host. No hay una segunda lista de rutas que se pueda desincronizar; el guard
 * de generate-seo.mjs revisa ademas que lo escrito aca siga calzando.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { HOST_GROUPS, sitemapEntriesForHost } from "../src/config/seo.js";

const prioridad = (ruta) => {
  if (ruta === "/") return "1.0";
  if (ruta.startsWith("/blog/")) return "0.6";
  if (ruta === "/blog") return "0.7";
  if (ruta.startsWith("/corfo-")) return "0.8";
  return "0.9";
};

const sitemapXml = (entradas) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entradas.map(
      ({ ruta, loc }) =>
        `  <url>\n    <loc>${loc}</loc>\n` +
        `    <priority>${prioridad(ruta)}</priority>\n  </url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");

const robotsTxt = (site) =>
  ["User-agent: *", "Allow: /", "", `Sitemap: ${site}/sitemap.xml`, ""].join("\n");

function escribir(grupo, nombre, contenido) {
  const destino = new URL(`../public/_h/${grupo}/${nombre}`, import.meta.url);
  mkdirSync(dirname(destino.pathname), { recursive: true });
  writeFileSync(destino, contenido);
}

for (const { grupo, hostname, site } of HOST_GROUPS) {
  const entradas = sitemapEntriesForHost(hostname);

  if (entradas.length === 0) {
    throw new Error(
      `El sitemap de ${hostname} quedaria vacio: revisar src/config/seo.js.`,
    );
  }

  escribir(grupo, "sitemap.xml", sitemapXml(entradas));
  escribir(grupo, "robots.txt", robotsTxt(site));

  console.log(`sitemap ${hostname}: ${entradas.length} URLs -> public/_h/${grupo}/`);
}
