/**
 * FUENTE UNICA DE VERDAD de los metadatos por ruta y mercado.
 *
 * La consumen dos lados y no puede haber una segunda lista:
 *   · React, en tiempo de render (App.jsx y <RouteSeo/>)
 *   · scripts/generate-seo.mjs, que prerenderiza el HTML por (host, ruta)
 *
 * Motivo: el MISMO archivo se sirve en los dos dominios y la ruta "/" tiene
 * canonical distinto segun el host. Un unico index.html no puede resolverlo, asi
 * que el build genera una variante por host y vercel.json las enruta con
 * "has": [{"type":"host"}].
 *
 * REGLA AL EDITAR: los textos de CONTENT_ROUTES son los que ya estaban
 * publicados en cada componente. Se movieron aca sin cambiar una palabra. No se
 * inventan titles ni descriptions: cada frase pasa por el registro de claims.
 */
import { MARKETS } from "./markets.js";
import { COMMERCIAL_COPY } from "./commercialCopy.js";

export const SITE_CL = "https://www.credex.cl";
export const SITE_APP = "https://www.credexapp.com";

export const OG_IMAGE_CL = `${SITE_CL}/preview.png`;
export const OG_IMAGE_APP = `${SITE_APP}/preview.png`;

/** Hosts que sirven el mercado Chile. Espeja isChileHostname() de markets.js. */
export const CHILE_HOSTS = ["www.credex.cl", "ww2.credex.cl", "credex.cl"];

export function isChileHost(hostname = "") {
  return CHILE_HOSTS.includes(hostname.toLowerCase());
}

/**
 * Grupos de host que sirve este deployment, con el sitio que le corresponde a
 * cada uno.
 *
 * Lo consumen los dos scripts de build: generate-seo.mjs prerenderiza el <head>
 * por (host, ruta) y generate-sitemap.mjs escribe un sitemap.xml y un robots.txt
 * por host. Vive aca para que no existan dos listas de hosts que puedan
 * desalinearse entre si.
 *
 * "hosts: null" marca el grupo de respaldo: su regla en vercel.json va SIN "has"
 * y atiende todo lo que no calzo con un host anterior.
 */
export const HOST_GROUPS = [
  {
    grupo: "cl",
    hostname: "www.credex.cl",
    site: SITE_CL,
    hosts: ["www.credex.cl", "ww2.credex.cl"],
  },
  { grupo: "app", hostname: "www.credexapp.com", site: SITE_APP, hosts: null },
];

/**
 * Cluster hreflang. Reciproco: cada una de estas paginas declara a TODAS,
 * incluida a si misma. Un hreflang que no es reciproco Google lo ignora entero.
 *
 * Solo se emite en estas cinco URLs. En las rutas de contenido no hay pagina
 * equivalente en los otros mercados, y un hreflang que apunta a algo que no es
 * el equivalente es peor que no tenerlo.
 */
export const HREFLANG = [
  { hrefLang: "x-default", href: `${SITE_APP}/` },
  { hrefLang: "es-CL", href: `${SITE_CL}/` },
  { hrefLang: "es-PE", href: `${SITE_APP}/pe` },
  { hrefLang: "es-CO", href: `${SITE_APP}/co` },
  { hrefLang: "es-AR", href: `${SITE_APP}/ar` },
];

/** Canonical de cada mercado. Coincide EXACTO con su entrada de HREFLANG. */
const MARKET_CANONICAL = {
  CL: `${SITE_CL}/`,
  GLOBAL: `${SITE_APP}/`,
  PE: `${SITE_APP}/pe`,
  CO: `${SITE_APP}/co`,
  AR: `${SITE_APP}/ar`,
};

/** Rutas cuyo contenido y metadatos dependen del mercado. */
export const MARKET_ROUTES = ["/", "/cl", "/pe", "/co", "/ar"];

/**
 * Rutas de contenido. Todas pertenecen a credex.cl, se sirvan desde donde se
 * sirvan: si credexapp.com responde una de ellas, su canonical sigue apuntando
 * a credex.cl. Es el comportamiento que ya tenia el sitio.
 */
export const CONTENT_ROUTES = {
  "/evaluacion-crediticia": {
    title: "Evaluación crediticia para empresas en Chile | Credex",
    description:
      "Evalúe clientes en segundos y reduzca incobrables. Plataforma de evaluación crediticia para empresas en Chile.",
  },
  "/scoring-crediticio": {
    title: "Scoring crediticio para empresas | Credex",
    description:
      "Sistema de scoring crediticio en tiempo real para empresas. Automatice decisiones y reduzca riesgo financiero.",
  },
  "/analisis-riesgo": {
    title: "Análisis de riesgo crediticio | Credex",
    description:
      "Analice el riesgo crediticio de sus clientes y reduzca incobrables con Credex.",
  },
  "/blog": {
    title: "Blog evaluación crediticia | Credex",
    description:
      "Artículos sobre evaluación crediticia, scoring, riesgo financiero y machine learning en crédito.",
  },
  "/blog/evaluacion-crediticia": {
    title: "Evaluación crediticia para empresas en Chile | Credex",
    description:
      "Cómo evaluar clientes, reducir incobrables y mejorar decisiones crediticias.",
  },
  "/blog/scoring-crediticio": {
    title: "Scoring crediticio para empresas | Credex",
    description:
      "Qué es el scoring crediticio, cómo se construye un modelo y qué necesita para funcionar.",
  },
  "/blog/analisis-riesgo": {
    title: "Análisis de riesgo crediticio | Credex",
    description:
      "Reduce riesgo financiero y evita incobrables con análisis de riesgo crediticio.",
  },
  "/blog/reducir-incobrables": {
    title: "Cómo reducir incobrables en empresas | Credex",
    description:
      "Estrategias para reducir incobrables y mejorar la evaluación crediticia.",
  },
  "/blog/machine-learning": {
    title: "Machine Learning en evaluación crediticia | Credex",
    description:
      "Qué es el machine learning aplicado a la evaluación crediticia, para qué se usa y qué condiciones necesita.",
  },
  "/evaluacion-crediticia-empresas": {
    title: "Evaluación crediticia para empresas en Chile | Credex",
    description:
      "Evalúe clientes en segundos con una plataforma de evaluación crediticia para empresas en Chile. Reduzca incobrables y automatice decisiones.",
    ogTitle: "Evaluación crediticia para empresas | Credex",
    ogDescription:
      "Automatice decisiones de crédito y reduzca riesgo financiero con Credex.",
  },
  "/scoring-crediticio-chile": {
    title: "Scoring crediticio en Chile para empresas | Credex",
    description:
      "Sistema de scoring crediticio en Chile para empresas. Evalúe clientes automáticamente y mejore decisiones con Credex.",
    ogTitle: "Scoring crediticio para empresas | Credex",
    ogDescription:
      "Automatice evaluación de riesgo con scoring crediticio en tiempo real.",
  },
  "/analisis-riesgo-empresas": {
    title: "Análisis de riesgo crediticio para empresas | Credex",
    description:
      "Herramienta de análisis de riesgo crediticio para empresas. Anticipe comportamiento de pago y reduzca pérdidas con Credex.",
    ogTitle: "Análisis de riesgo para empresas | Credex",
    ogDescription:
      "Identifique riesgos financieros con modelos predictivos y automatización.",
  },
  "/corfo-escalamiento-2019": {
    title: "CORFO Escalamiento 2019 | Credex",
    description:
      "Credex fue beneficiario del programa CORFO Escalamiento 2019 para potenciar el crecimiento y expansión de soluciones tecnológicas.",
  },
  "/corfo-consolida-expande-2024": {
    title: "CORFO Consolida y Expande 2024 | Credex",
    description:
      "Credex fue beneficiario del programa CORFO Consolida y Expande 2024 para fortalecer capacidades y apoyar procesos de expansión.",
  },
};

/**
 * Rutas utilitarias: existen para el visitante, no para Google.
 *
 * Se diferencian de CONTENT_ROUTES en dos cosas:
 *   · van con noindex. Una confirmacion de formulario no tiene por que estar en
 *     el buscador, y si estuviera, entraria gente sin haber enviado nada.
 *   · su canonical es AUTORREFERENTE POR HOST, no fijo a credex.cl: el mismo
 *     formulario se envia desde los dos dominios y cada uno confirma en el suyo.
 */
export const UTILITY_ROUTES = {
  "/gracias": {
    title: "Solicitud recibida | Credex",
    description:
      "Confirmación de que la solicitud de contacto enviada a Credex fue recibida.",
    noindex: true,
  },
};

/** Todas las rutas que el build tiene que prerenderizar, por host. */
export const ALL_ROUTES = [
  ...MARKET_ROUTES,
  ...Object.keys(CONTENT_ROUTES),
  ...Object.keys(UTILITY_ROUTES),
];

/** Espeja getMarketFromLocation() de markets.js, sin localStorage. */
export function marketForRoute(route, hostname = "") {
  if (isChileHost(hostname)) return MARKETS.CL;

  const first = route.split("/").filter(Boolean)[0]?.toLowerCase();
  if (first === "cl") return MARKETS.CL;
  if (first === "pe") return MARKETS.PE;
  if (first === "co") return MARKETS.CO;
  if (first === "ar") return MARKETS.AR;

  return MARKETS.GLOBAL;
}

/**
 * Metadatos de una ruta en un host. Es lo que consumen React y el prerender:
 * mientras los dos llamen aca, lo servido y lo renderizado no pueden divergir.
 */
export function getSeoForRoute(route, hostname = "") {
  const path = route !== "/" && route.endsWith("/") ? route.slice(0, -1) : route;
  const utility = UTILITY_ROUTES[path];

  if (utility) {
    const base = isChileHost(hostname) ? SITE_CL : SITE_APP;

    return {
      market: marketForRoute(path, hostname),
      title: utility.title,
      description: utility.description,
      ogTitle: utility.title,
      ogDescription: utility.description,
      ogImage: isChileHost(hostname) ? OG_IMAGE_CL : OG_IMAGE_APP,
      canonical: `${base}${path}`,
      hreflang: [],
      noindex: true,
    };
  }

  const content = CONTENT_ROUTES[path];

  if (content) {
    const canonical = `${SITE_CL}${path}`;
    return {
      market: MARKETS.CL,
      title: content.title,
      description: content.description,
      ogTitle: content.ogTitle || content.title,
      ogDescription: content.ogDescription || content.description,
      ogImage: OG_IMAGE_CL,
      canonical,
      // Sin hreflang: estas paginas no tienen equivalente en los otros mercados.
      hreflang: [],
      noindex: false,
    };
  }

  const market = marketForRoute(path, hostname);
  const copy = COMMERCIAL_COPY[market.code] || COMMERCIAL_COPY.GLOBAL;
  const canonical = MARKET_CANONICAL[market.code];

  // El hreflang se emite SOLO en paginas autocanonicas: si esta URL no es su
  // propio canonical, declarar un idioma desde aca romperia el cluster.
  //
  // Esto deja fuera dos casos a proposito:
  //   · /cl en credexapp.com, que sirve contenido chileno y canonicaliza a
  //     credex.cl/ — el comportamiento que el sitio ya tenia. PENDIENTE DE
  //     DECISION (B8): el canonical de esa ruta no lo decide este PR.
  //   · /pe, /co y /ar servidas desde credex.cl, donde el host manda y el
  //     canonical apunta al home chileno.
  const base = isChileHost(hostname) ? SITE_CL : SITE_APP;
  const selfUrl = `${base}${path === "/" ? "/" : path}`;
  const emiteHreflang = MARKET_ROUTES.includes(path) && selfUrl === canonical;

  return {
    market,
    title: copy.seo.title,
    description: copy.seo.description,
    ogTitle: copy.seo.title,
    ogDescription: copy.seo.description,
    ogImage: market.isChile ? OG_IMAGE_CL : OG_IMAGE_APP,
    canonical,
    hreflang: emiteHreflang ? HREFLANG : [],
    noindex: false,
  };
}

/**
 * URLs que un host declara en SU sitemap.
 *
 * NO hay una segunda lista de rutas: se filtra ALL_ROUTES con el mismo
 * getSeoForRoute() que usan React y el prerender. Entra la ruta que cumple las
 * dos condiciones que le exige un sitemap, y solo esas:
 *
 *   · es indexable. Deja fuera /gracias, que va con noindex.
 *   · es su propio canonical EN ESTE HOST. Un sitemap no declara URLs cuyo
 *     canonical apunta a otra parte: es contradecirse. Sin nombrarlas una por
 *     una, eso excluye
 *       - /cl y las rutas de contenido en credexapp.com, que canonicalizan a
 *         credex.cl y por eso pertenecen al sitemap del otro dominio;
 *       - /pe, /co y /ar servidas desde credex.cl, donde manda el host y el
 *         canonical apunta al home chileno.
 *
 * El dia que una ruta cambie de canonical, su sitemap la sigue solo.
 */
export function sitemapEntriesForHost(hostname = "") {
  const base = isChileHost(hostname) ? SITE_CL : SITE_APP;

  return ALL_ROUTES.filter((ruta) => {
    const seo = getSeoForRoute(ruta, hostname);
    return !seo.noindex && seo.canonical === `${base}${ruta}`;
  }).map((ruta) => ({ ruta, loc: `${base}${ruta}` }));
}
