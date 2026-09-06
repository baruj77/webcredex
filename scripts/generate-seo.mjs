/**
 * Prerenderiza el <head> por (host, ruta) y verifica que vercel.json enrute
 * cada variante a su archivo.
 *
 * POR QUE EXISTE. El mismo deployment sirve dos dominios, y la ruta "/" tiene
 * canonical distinto segun el host:
 *     www.credex.cl      -> https://www.credex.cl/
 *     www.credexapp.com  -> https://www.credexapp.com/
 * Un unico index.html prerenderizado no puede resolverlo. Se generan dos
 * variantes por ruta y vercel.json las enruta con "has":[{"type":"host"}].
 *
 * POR QUE ESTA OPCION Y NO DOS PROYECTOS VERCEL. La alternativa (b) de la
 * mision exige crear un proyecto y reasignar dominios, que es justo lo que la
 * mision prohibe tocar; ademas duplicaria el problema de despliegue que ya
 * tenemos con la integracion Git.
 *
 * FUENTE UNICA DE VERDAD: src/config/seo.js. La misma tabla la consume React
 * via <RouteSeo/>, asi que lo servido y lo renderizado no pueden divergir.
 *
 * MODOS
 *   node scripts/generate-seo.mjs          genera y VERIFICA vercel.json (falla si no calza)
 *   node scripts/generate-seo.mjs --sync   reescribe los rewrites de vercel.json
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import {
  ALL_ROUTES,
  HOST_GROUPS,
  getSeoForRoute,
  sitemapEntriesForHost,
} from "../src/config/seo.js";

const DIST = new URL("../dist/", import.meta.url);
const VERCEL_JSON = new URL("../vercel.json", import.meta.url);
const SYNC = process.argv.includes("--sync");

/**
 * Grupos de host: viven en src/config/seo.js, que es donde tambien los lee
 * generate-sitemap.mjs. Los hostnames van EXACTOS al "has.value" de vercel.json,
 * no como regex: si un patron no calzara, credex.cl serviria el canonical de
 * credexapp.com, que es exactamente el bug que este script existe para evitar.
 * Prefiero tres reglas por ruta y cero ambiguedad.
 */
const HOSTS = HOST_GROUPS;

/**
 * Archivos que tambien tienen una variante por host, fuera del router de React.
 * Mismo motivo que el <head>: un solo sitemap servido en los dos dominios le
 * declaraba a credexapp.com quince URLs de credex.cl. Los escribe
 * generate-sitemap.mjs en public/_h/<grupo>/; aca solo se enrutan y se verifican.
 */
const ARCHIVOS_POR_HOST = ["/sitemap.xml", "/robots.txt"];

const esc = (v) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const archivoDe = (grupo, ruta) =>
  `/_h/${grupo}${ruta === "/" ? "/index" : ruta}.html`;

function construirHead(base, seo) {
  // data-rh es el atributo con que react-helmet-async marca lo que administra.
  // Al emitirlo aca, Helmet reconoce estas etiquetas como propias y las
  // reemplaza al montar, en vez de agregar un segundo <meta> con otro valor.
  const meta = (attr, clave, valor) =>
    `    <meta ${attr}="${clave}" content="${esc(valor)}" data-rh="true" />`;

  const bloque = [
    meta("name", "description", seo.description),
    `    <link rel="canonical" href="${esc(seo.canonical)}" data-rh="true" />`,
    // Solo las rutas utilitarias declaran robots en el HTML servido. Es lo unico
    // que lee un rastreador que nunca ejecuta React, y una confirmacion de envio
    // no tiene por que estar en el indice.
    ...(seo.noindex ? [meta("name", "robots", "noindex, follow")] : []),
    ...seo.hreflang.map(
      ({ hrefLang, href }) =>
        `    <link rel="alternate" hreflang="${esc(hrefLang)}" href="${esc(href)}" data-rh="true" />`,
    ),
    meta("property", "og:title", seo.ogTitle),
    meta("property", "og:description", seo.ogDescription),
    meta("property", "og:url", seo.canonical),
    meta("property", "og:image", seo.ogImage),
    meta("name", "twitter:title", seo.ogTitle),
    meta("name", "twitter:description", seo.ogDescription),
    meta("name", "twitter:image", seo.ogImage),
  ].join("\n");

  // El <title> no se duplica: Helmet escribe document.title directamente.
  const html = base.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`);
  return html.replace("  </head>", `${bloque}\n  </head>`);
}

/**
 * Toda ruta del router necesita fila en la tabla. Si alguien agrega una ruta y
 * se olvida de seo.js, sin esta comprobacion la ruta responderia 404 en
 * produccion: al no tener variante prerenderizada no hay rewrite que la sirva,
 * y desde que se borra dist/index.html tampoco hay fallback.
 */
function verificarCoberturaDelRouter() {
  const router = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  const enRouter = [...router.matchAll(/path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((r) => r !== "*");

  const faltan = enRouter.filter((r) => !ALL_ROUTES.includes(r));
  const sobran = ALL_ROUTES.filter((r) => !enRouter.includes(r));

  if (faltan.length || sobran.length) {
    throw new Error(
      "src/config/seo.js no cubre el router de src/main.jsx.\n" +
        (faltan.length ? `  sin metadatos (responderian 404): ${faltan.join(", ")}\n` : "") +
        (sobran.length ? `  en la tabla pero no en el router: ${sobran.join(", ")}\n` : ""),
    );
  }
}

/**
 * Mismo criterio que el guard del router, aplicado a los sitemaps: que lo que
 * dist va a servir en cada host sea exactamente lo que dice src/config/seo.js.
 *
 * Sin esto, un sitemap quedaria desactualizado en silencio —basta que alguien
 * cambie un canonical y no vuelva a correr generate-sitemap.mjs, o que se cuele
 * de nuevo un public/sitemap.xml en la raiz— y el sintoma solo aparece semanas
 * despues, en Search Console.
 */
function verificarSitemaps() {
  for (const { grupo, hostname } of HOSTS) {
    for (const archivo of ARCHIVOS_POR_HOST) {
      const ruta = new URL(`./_h/${grupo}${archivo}`, DIST);
      let contenido;
      try {
        contenido = readFileSync(ruta, "utf8");
      } catch {
        throw new Error(
          `Falta dist/_h/${grupo}${archivo}. Lo escribe scripts/generate-sitemap.mjs ` +
            "en public/, antes de vite build:  npm run generate:sitemap",
        );
      }
      if (archivo === "/robots.txt") continue;

      const declaradas = [...contenido.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      const esperadas = sitemapEntriesForHost(hostname).map((e) => e.loc);

      if (JSON.stringify(declaradas) !== JSON.stringify(esperadas)) {
        throw new Error(
          `El sitemap de ${hostname} no calza con src/config/seo.js.\n` +
            `  declara: ${declaradas.join(", ") || "(nada)"}\n` +
            `  deberia: ${esperadas.join(", ")}\n` +
            "Regenerar con:  npm run generate:sitemap",
        );
      }
    }
  }

  // Un archivo en la raiz de dist gana sobre el rewrite: Vercel consulta el
  // sistema de archivos primero y volveriamos a servir el mismo sitemap en los
  // dos dominios, que es el bug que esto arregla.
  for (const archivo of ARCHIVOS_POR_HOST) {
    try {
      readFileSync(new URL(`.${archivo}`, DIST));
    } catch {
      continue;
    }
    throw new Error(
      `dist${archivo} existe y le gana al rewrite por host: los dos dominios ` +
        `volverian a servir el mismo archivo. Borrar public${archivo}.`,
    );
  }
}

function generarArchivos() {
  const base = readFileSync(new URL("index.html", DIST), "utf8");
  for (const prohibida of ['rel="canonical"', 'name="description"', 'property="og:title"']) {
    if (base.includes(prohibida)) {
      throw new Error(
        `dist/index.html trae ${prohibida}. Esa etiqueta la emite este script por ` +
          "(host, ruta); si tambien esta en index.html sin data-rh, Helmet no la " +
          "reemplaza y el DOM queda con dos valores distintos.",
      );
    }
  }

  let n = 0;
  for (const { grupo, hostname } of HOSTS) {
    for (const ruta of ALL_ROUTES) {
      const seo = getSeoForRoute(ruta, hostname);
      const destino = new URL(`.${archivoDe(grupo, ruta)}`, DIST);
      mkdirSync(dirname(destino.pathname), { recursive: true });
      writeFileSync(destino, construirHead(base, seo));
      n += 1;
    }
  }

  // Vercel consulta el sistema de archivos ANTES que los rewrites. Mientras
  // dist/index.html exista, "/" se sirve directo y nunca llega a su regla: la
  // home quedaria sin canonical y con el title generico. Se borra para que "/"
  // caiga en el rewrite como el resto de las rutas. Lo que no calce con
  // ninguna regla lo atiende dist/404.html, que es lo que corresponde.
  rmSync(new URL("index.html", DIST), { force: true });

  return n;
}

/**
 * Un rewrite por (host, ruta). La regla del host chileno va PRIMERO; la del
 * dominio internacional queda sin "has" y actua de fallback.
 */
function rewritesEsperados() {
  const reglas = [];
  for (const ruta of ALL_ROUTES) {
    for (const { grupo, hosts } of HOSTS) {
      const destination = archivoDe(grupo, ruta);
      if (!hosts) {
        reglas.push({ source: ruta, destination });
        continue;
      }
      for (const host of hosts) {
        reglas.push({ source: ruta, has: [{ type: "host", value: host }], destination });
      }
    }
  }

  for (const archivo of ARCHIVOS_POR_HOST) {
    for (const { grupo, hosts } of HOSTS) {
      const destination = `/_h/${grupo}${archivo}`;
      if (!hosts) {
        reglas.push({ source: archivo, destination });
        continue;
      }
      for (const host of hosts) {
        reglas.push({ source: archivo, has: [{ type: "host", value: host }], destination });
      }
    }
  }

  return reglas;
}

function sincronizarVercelJson() {
  const cfg = JSON.parse(readFileSync(VERCEL_JSON, "utf8"));

  // Los rewrites de 410 (api/gone.js) se conservan y van primero.
  const preservados = cfg.rewrites.filter((r) => r.destination === "/api/gone");
  const esperados = [...preservados, ...rewritesEsperados()];

  const actuales = JSON.stringify(cfg.rewrites);
  if (actuales === JSON.stringify(esperados)) return { cambio: false };

  if (!SYNC) {
    throw new Error(
      "vercel.json esta desincronizado de src/config/seo.js.\n" +
        "Cada ruta necesita su rewrite por host o se servira el canonical equivocado.\n" +
        "Corregir con:  npm run seo:sync",
    );
  }

  cfg.rewrites = esperados;
  writeFileSync(VERCEL_JSON, `${JSON.stringify(cfg, null, 2)}\n`);
  return { cambio: true, n: esperados.length };
}

const resultado = sincronizarVercelJson();
if (resultado.cambio) {
  console.log(`vercel.json sincronizado: ${resultado.n} rewrites`);
}

if (!SYNC) {
  verificarCoberturaDelRouter();
  const n = generarArchivos();
  console.log(`SEO prerenderizado: ${n} variantes (${HOSTS.length} hosts x ${ALL_ROUTES.length} rutas)`);
  verificarSitemaps();
}
