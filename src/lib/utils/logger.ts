const NS_PAD = 32;

const CC = {
  invert: "\x1b[7m",
  clear: "\x1b[0m",

  red: "\x1b[31m",
  yellow: "\x1b[33m",

  cyan: "\x1b[36m",
  brightCyan: "\x1b[96m",

  green: "\x1b[32m",
  magenta: "\x1b[35m",

  teal: "\x1b[38;5;30m",
  lightPurple: "\x1b[38;5;141m",
  pink: "\x1b[38;5;219m",
  orange: "\x1b[38;5;208m",
  lightBlue: "\x1b[38;5;75m",
};

const title = (label: string, color = CC.clear) =>
  `${color}${label.padEnd(NS_PAD)}${CC.clear}`;

const stringify = (arg: any): string => {
  if (typeof arg === "string") return arg;
  if (arg instanceof Error) return arg.message;
  return JSON.stringify(arg, null, 2);
};

export const log = {
  webhook: (label: string, ...args: any[]) => {
    console.info(title(label), ...args.map(stringify));
  },

  llm: (label: string, ...args: any[]) =>
    console.info(title(label, CC.pink), ...args.map(stringify)),

  relay: (label: string, ...args: any[]) =>
    console.info(title(label, CC.cyan), ...args.map(stringify)),

  green: (label: string, ...args: any[]) =>
    console.info(title(label, CC.green), ...args.map(stringify)),

  cyan: (label: string, ...args: any[]) =>
    console.info(title(label, CC.cyan), ...args.map(stringify)),

  brightCyan: (label: string, ...args: any[]) =>
    console.info(title(label, CC.brightCyan), ...args.map(stringify)),

  pink: (label: string, ...args: any[]) =>
    console.info(title(label, CC.pink), ...args.map(stringify)),

  yellow: (label: string, ...args: any[]) =>
    console.info(title(label, CC.yellow), ...args.map(stringify)),

  lightPurple: (label: string, ...args: any[]) =>
    console.info(title(label, CC.lightPurple), ...args.map(stringify)),

  lightBlue: (label: string, ...args: any[]) =>
    console.info(title(label, CC.lightBlue), ...args.map(stringify)),

  info: (label: string, ...args: any[]) =>
    console.info(title(label), ...args.map(stringify)),

  error: (label: string, ...args: any[]) =>
    console.error(title(label), ...args.map(stringify)),

  xml: (label: string, xml: string) =>
    console.log(title(label), "\n", prettyXML(xml)),
};

// ========================================
// Helpers
// ========================================
function prettyXML(xml: string): string {
  const maxParameterValueLength = 50;
  const indent = "  ";

  let formatted = xml
    .replace(/>\s*</g, "><")
    .replace("rapid-champion-snake", "•".repeat(9));

  formatted = formatted.replace(
    /<ConversationRelay\b([^>]*)>/g,
    (_match, rawAttrs) => {
      const selfClose = rawAttrs.trim().endsWith("/");
      const attrsPart = selfClose
        ? rawAttrs.trim().slice(0, -1).trim()
        : rawAttrs;

      const attrs = attrsPart.match(/\S+="[^"]*"/g) || [];
      const prettyAttrs = attrs.map((a) => `\n${indent}${a}`).join("");

      return `<ConversationRelay${prettyAttrs}${selfClose ? "/>" : ">"}`;
    }
  );

  return formatted;
}

export function redactPhoneNumbers(input: string): string {
  const phoneRegex = /(\+?1[-\s.]?)?\(?(\d{3})\)?[-\s.]?(\d{3})[-\s.]?(\d{4})/g;

  return input.replace(
    phoneRegex,
    (match, countryCode, areaCode, prefix, lastFour) => {
      // Preserve the +1 country code if it exists
      const preservedCountryCode =
        countryCode && countryCode.includes("+") ? countryCode : "";

      // Count how many digits need to be redacted (excluding country code and last four)
      const digitsInAreaCodeAndPrefix = 11; // 3 for area code + 3 for prefix

      // Create bullet points for redacted digits
      const bullets = "•".repeat(digitsInAreaCodeAndPrefix);

      return bullets;

      return `${preservedCountryCode}${bullets}${lastFour}`;
    },
  );
}
