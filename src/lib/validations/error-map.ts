import { z } from "zod";

// Zod's default messages are in English, and the API's messages reach the
// screen as they are. This map answers in Spanish for every rule that a schema
// doesn't word itself (a custom message always wins). Imported once by the
// controller layer, which is where every schema is parsed.

const spanishErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined") {
        return { message: "Es un dato obligatorio." };
      }
      if (issue.expected === "integer") {
        return { message: "Tiene que ser un número entero." };
      }
      return { message: "El valor no tiene el formato esperado." };

    case z.ZodIssueCode.too_small:
      if (issue.type === "string") {
        return {
          message: `Tiene que tener al menos ${issue.minimum} ${
            issue.minimum === 1 ? "carácter" : "caracteres"
          }.`,
        };
      }
      if (issue.type === "array") {
        return { message: `Tiene que tener al menos ${issue.minimum}.` };
      }
      return {
        message: issue.inclusive
          ? `Tiene que ser ${issue.minimum} o más.`
          : `Tiene que ser mayor a ${issue.minimum}.`,
      };

    case z.ZodIssueCode.too_big:
      if (issue.type === "string") {
        return {
          message: `Puede tener como máximo ${issue.maximum} caracteres.`,
        };
      }
      return {
        message: issue.inclusive
          ? `Tiene que ser ${issue.maximum} o menos.`
          : `Tiene que ser menor a ${issue.maximum}.`,
      };

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") {
        return { message: "Formato de email inválido." };
      }
      if (issue.validation === "url") return { message: "URL inválida." };
      if (issue.validation === "uuid") {
        return { message: "Identificador inválido." };
      }
      return { message: "El texto no tiene el formato esperado." };

    case z.ZodIssueCode.invalid_enum_value:
      return {
        message: `Tiene que ser uno de: ${issue.options.join(", ")}.`,
      };

    case z.ZodIssueCode.invalid_date:
      return { message: "Fecha inválida." };

    case z.ZodIssueCode.not_multiple_of:
      return { message: "Tiene que ser un número entero." };

    case z.ZodIssueCode.unrecognized_keys:
      return {
        message: `Campos que no se pueden enviar: ${issue.keys.join(", ")}.`,
      };

    default:
      return { message: ctx.defaultError };
  }
};

z.setErrorMap(spanishErrorMap);

// How a field of a request body / query is called on screen.
const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  description: "Descripción",
  propertyType: "Tipo",
  operationType: "Operación",
  status: "Estado",
  price: "Precio",
  currency: "Moneda",
  totalArea: "Superficie total",
  coveredArea: "Superficie cubierta",
  rooms: "Ambientes",
  bedrooms: "Dormitorios",
  bathrooms: "Baños",
  age: "Antigüedad",
  address: "Dirección",
  neighborhood: "Zona",
  tags: "Amenities",
  tag: "Amenities",
  imageUrl: "Foto",
  imageIds: "Fotos",
  authorName: "Nombre",
  content: "Contenido",
  rating: "Calificación",
  sellerReply: "Respuesta",
  requesterName: "Nombre",
  requesterPhone: "Teléfono",
  proposedDate: "Fecha propuesta",
  message: "Mensaje",
  name: "Nombre",
  email: "Email",
  password: "Contraseña",
  fantasyName: "Nombre de fantasía",
  phone: "Teléfono",
  logoUrl: "Logo",
  type: "Tipo",
  operation: "Operación",
  q: "Búsqueda",
  minPrice: "Precio mínimo",
  maxPrice: "Precio máximo",
  min: "Mínimo",
  max: "Máximo",
  page: "Página",
  limit: "Tamaño de página",
  sort: "Orden",
  propertyId: "Propiedad",
};

/** "Precio: Tiene que ser mayor a 0." (the field's name, when the issue has one). */
export function describeIssue(issue: z.ZodIssue): string {
  const field = issue.path[0];
  if (field === undefined) return issue.message;
  return `${FIELD_LABELS[String(field)] ?? String(field)}: ${issue.message}`;
}
