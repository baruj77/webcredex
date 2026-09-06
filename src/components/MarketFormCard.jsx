const MARKET_FORM_SECTIONS = {
  GLOBAL: {
    marketLabel: "Internacional",
    formId: "299583",
    userId: "107027",
    frameHeight: 760,
    offsetY: 135,
  },
  CL: {
    marketLabel: "Chile",
    formId: "279377",
    userId: "107027",
    frameHeight: 760,
    offsetY: 135,
  },
  PE: {
    marketLabel: "Perú",
    formId: "294644",
    userId: "107027",
    frameHeight: 760,
    offsetY: 135,
  },
  CO: {
    marketLabel: "Colombia",
    formId: "294646",
    userId: "107027",
    frameHeight: 760,
    offsetY: 135,
  },
  AR: {
    marketLabel: "Argentina",
    formId: "294645",
    userId: "107027",
    frameHeight: 760,
    offsetY: 135,
  },
};

/**
 * Ancla del formulario. La usa el CTA de la seccion de contacto para desplazar
 * hasta aca y dejar el foco puesto. Vive en este archivo porque es la caja que
 * la declara: si el id se define en dos lados, un dia dejan de coincidir.
 */
export const FORM_ANCHOR_ID = "formulario-contacto";

function getMarketFormSection(marketCode) {
  return MARKET_FORM_SECTIONS[marketCode] || MARKET_FORM_SECTIONS.GLOBAL;
}

function getIsolatedFormUrl(marketCode, section) {
  const documentIdentity = new URLSearchParams({
    market: marketCode,
    form: section.formId,
    source: "credex",
  });

  return `https://apps.clientify.net/forms/simpleembed/?${documentIdentity.toString()}#/forms/embedform/${section.formId}/${section.userId}`;
}

export default function MarketFormCard({ marketCode, title }) {
  const normalizedMarket = MARKET_FORM_SECTIONS[marketCode] ? marketCode : "GLOBAL";
  const section = getMarketFormSection(normalizedMarket);
  const formUrl = getIsolatedFormUrl(normalizedMarket, section);
  const frameKey = `clientify-${normalizedMarket}-${section.formId}`;

  return (
    <div
      key={frameKey}
      id={FORM_ANCHOR_ID}
      // tabIndex -1: no entra en el orden de tabulacion, pero puede recibir foco
      // por codigo cuando el CTA trae a la persona hasta aca. scroll-mt-28 deja
      // el aire del header fijo, que si no tapa el borde superior de la tarjeta.
      tabIndex={-1}
      className="w-full scroll-mt-28 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20 focus:outline-none focus:ring-4 focus:ring-primary-400"
      data-market={normalizedMarket}
      data-form-id={section.formId}
      aria-label={`Formulario de contacto Credex ${section.marketLabel}`}
    >
      <div className="h-[560px] overflow-hidden sm:h-[590px] lg:h-[610px]">
        <iframe
          key={frameKey}
          name={frameKey}
          src={formUrl}
          title={`${title} - ${section.marketLabel}`}
          className="block w-full border-0 bg-white"
          style={{
            height: `${section.frameHeight}px`,
            transform: `translateY(-${section.offsetY}px)`,
          }}
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
