const CURRENCY_SYMBOLS = {
  EUR: "€", USD: "$", MXN: "MX$", GBP: "£",
  JPY: "¥", CAD: "C$", AUD: "A$", BRL: "R$",
  CHF: "CHF", CNY: "¥", ARS: "AR$", CLP: "CL$",
};

function formatNumber(n, currency) {
  const num = Number(n);
  if (Number.isNaN(num)) return null;
  try {
    const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: Number.isInteger(num) ? 0 : 2,
    }).format(num);
  } catch {
    return String(num);
  }
}

function withCurrency(formatted, currency) {
  if (!formatted) return null;
  const code = (currency || "").trim().toUpperCase();
  if (!code) return formatted;
  const symbol = CURRENCY_SYMBOLS[code];
  return symbol ? `${formatted} ${symbol}` : `${formatted} ${code}`;
}

export function formatPrice(service = {}) {
  const model = service.pricing_model;
  const price = service.price;
  const currency = service.currency;
  const unit = service.price_unit;

  switch (model) {
    case "hidden":
    case undefined:
    case null:
    case "":
      return null;

    case "custom":
      return "Contact for quote";

    case "fixed": {
      const n = withCurrency(formatNumber(price, currency), currency);
      return n || null;
    }

    case "from": {
      const n = withCurrency(formatNumber(price, currency), currency);
      return n ? `From ${n}` : null;
    }

    case "hourly": {
      const n = withCurrency(formatNumber(price, currency), currency);
      if (!n) return null;
      const unitText = unit && unit.trim() ? unit.trim() : "/ hour";
      return `${n} ${unitText}`;
    }

    default: {
      const n = withCurrency(formatNumber(price, currency), currency);
      if (!n) return null;
      return unit ? `${n} ${unit}` : n;
    }
  }
}

export default formatPrice;
