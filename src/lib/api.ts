// HTTP client of the seller panel. Everything goes through here so backend
// errors (in English, with codes) reach the UI already translated.

export type PageMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const UNAUTHORIZED_EVENT = "habitat:unauthorized";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** `{ field: message }` built from the Zod issues the API returns. */
  get fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    if (!Array.isArray(this.details)) return result;
    for (const issue of this.details) {
      const field = issue?.path?.[0];
      if (typeof field === "string" && !(field in result)) {
        result[field] = String(issue.message ?? "Valor inválido");
      }
    }
    return result;
  }
}

// Backend domain messages -> Spanish. The rest pass through as they are (the
// register and login ones already come in Spanish).
const TRANSLATIONS: [RegExp, string][] = [
  [/can no longer be edited/i, "Una propiedad cerrada ya no se puede editar."],
  [
    /confirmed visits pending/i,
    "No se puede editar: la propiedad tiene visitas confirmadas pendientes.",
  ],
  [
    /Cannot change status/i,
    "Ese cambio de estado no está permitido desde el estado actual.",
  ],
  [
    /status changed in the meantime/i,
    "El estado cambió mientras tanto. Recargá e intentá de nuevo.",
  ],
  [/already has a reply/i, "Esta consulta ya tiene una respuesta."],
  [/already answered/i, "Esa solicitud ya fue respondida."],
  [
    /Cannot change a .* visit request/i,
    "Ese cambio no está permitido para el estado actual de la solicitud.",
  ],
  [
    /Cannot delete the agency/i,
    "No podés eliminar la inmobiliaria mientras tenga propiedades Publicadas o Reservadas.",
  ],
  [/Not your/i, "Ese recurso no pertenece a tu inmobiliaria."],
  [
    /A Terreno cannot have/i,
    "Un terreno no puede tener ambientes, dormitorios, baños ni superficie cubierta.",
  ],
  [
    /coveredArea cannot be greater/i,
    "La superficie cubierta no puede ser mayor que la total.",
  ],
  [/has no agency/i, "Tu cuenta no tiene una inmobiliaria asociada."],
  [/Authentication required/i, "Tu sesión expiró. Volvé a ingresar."],
  [/Internal server error/i, "Algo falló de nuestro lado. Probá de nuevo."],
  [
    /Only drafts can be deleted/i,
    "Solo se pueden eliminar borradores. Para el resto, usá Dar de baja.",
  ],
  [/Property not found/i, "No encontramos la propiedad."],
  [/not accepting visit requests/i, "La propiedad no acepta visitas."],
];

function translate(message: unknown, status: number): string {
  if (typeof message === "string" && message) {
    for (const [pattern, spanish] of TRANSLATIONS) {
      if (pattern.test(message)) return spanish;
    }
    if (status !== 400 || !/^Validation failed$/i.test(message)) {
      return message;
    }
  }
  if (status === 400) return "Revisá los datos ingresados.";
  if (status === 401) return "Tu sesión expiró. Volvé a ingresar.";
  if (status === 403) return "No tenés permiso para hacer esto.";
  if (status === 404) return "No encontramos lo que buscabas.";
  return "Algo salió mal. Probá de nuevo.";
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Algo salió mal. Probá de nuevo.";
}

export interface ApiResult<T, M = Record<string, never>> {
  data: T;
  meta: M;
}

export async function request<T, M = Record<string, never>>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<ApiResult<T, M>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "No pudimos conectar con el servidor. Revisá tu conexión."
    );
  }

  let json: { data?: T; meta?: M; error?: string; details?: unknown } | null =
    null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      response.status,
      translate(json?.error, response.status),
      json?.details
    );
  }

  return { data: json?.data as T, meta: (json?.meta ?? {}) as M };
}

/** `?a=1&b=2` without the empty values. */
export function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
