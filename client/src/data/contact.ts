export interface CountryCodeDefinition {
  code: string;
  name: string;
  length: number;
  format: (value: string) => string;
}

export const COUNTRY_CODES: CountryCodeDefinition[] = [
  {
    code: "+33",
    name: "France",
    length: 9,
    format: (num: string) =>
      num.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5"),
  },
  {
    code: "+1",
    name: "États-Unis/Canada",
    length: 10,
    format: (num: string) =>
      num.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3"),
  },
  {
    code: "+44",
    name: "Royaume-Uni",
    length: 10,
    format: (num: string) => num.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3"),
  },
  {
    code: "+49",
    name: "Allemagne",
    length: 10,
    format: (num: string) => num.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"),
  },
  {
    code: "+34",
    name: "Espagne",
    length: 9,
    format: (num: string) => num.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3"),
  },
  {
    code: "+39",
    name: "Italie",
    length: 10,
    format: (num: string) => num.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"),
  },
  {
    code: "+32",
    name: "Belgique",
    length: 9,
    format: (num: string) =>
      num.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4"),
  },
  {
    code: "+41",
    name: "Suisse",
    length: 9,
    format: (num: string) =>
      num.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4"),
  },
  {
    code: "+212",
    name: "Maroc",
    length: 9,
    format: (num: string) =>
      num.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5"),
  },
  {
    code: "+213",
    name: "Algérie",
    length: 9,
    format: (num: string) =>
      num.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5"),
  },
];
