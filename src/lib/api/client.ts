import type { ApiResponse } from "@/types/api";

// The transport every call goes through: the `{ data }` / `{ error }` envelopes,
// what a failure looks like and what to do when the session is gone (401). The
// calls themselves live next to this file, grouped by resource.

// The API answers in English; people read Spanish. Failures are translated here,
// once, by status code.
function messageFor(status: number): string {
  switch (status) {
    case 0:
      return "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.";
    case 400:
      return "Revisá los datos ingresados e intentá de nuevo.";
    case 404:
      return "No encontramos lo que estás buscando.";
    case 401:
      return "Tu sesión terminó. Iniciá sesión de nuevo.";
    case 403:
      return "No tenés permiso para hacer esto.";
    case 409:
      return "La acción no se pudo completar porque el estado cambió. Probá de nuevo.";
    default:
      return "Tuvimos un problema de nuestro lado. Intentá de nuevo en unos minutos.";
  }
}

export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 when the request never got an answer (offline...). */
    readonly status: number,
    /** What the server said, untranslated. For debugging, not for the screen. */
    readonly serverMessage?: string,
    /** Names of the fields the server found at fault (400/409), e.g. `proposedDate`. */
    readonly invalidFields: string[] = []
  ) {
    super(messageFor(status));
    this.name = "ApiError";
  }
}

// Which fields did a 400 complain about? Zod issues carry their `path`; the
// domain's own errors start with the field name ("proposedDate must be...").
function invalidFieldsOf(body: unknown): string[] {
  const { error, details } = (body ?? {}) as {
    error?: unknown;
    details?: unknown;
  };
  const fromIssues = Array.isArray(details)
    ? details.map((issue) => String(issue?.path?.[0] ?? ""))
    : [];
  // A 409 names its culprit as `details: { field: "email" }`.
  const fromField =
    details && typeof details === "object" && "field" in details
      ? [String((details as { field: unknown }).field)]
      : [];
  const fromMessage =
    typeof error === "string" ? (/^([A-Za-z]+) /.exec(error)?.[1] ?? "") : "";
  return [
    ...new Set([...fromIssues, ...fromField, fromMessage].filter(Boolean)),
  ];
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    // A cancelled request is not a failure: the caller changed its mind.
    if (isAbortError(error)) throw error;
    throw new ApiError(0);
  }

  const body = await response.json().catch(() => null);
  if (response.status === 401) onUnauthorized?.();
  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof body?.error === "string" ? body.error : undefined,
      invalidFieldsOf(body)
    );
  }
  return body as T;
}

// --- session lost (401) ----------------------------------------------------------

// The seller's panel registers what to do when the API says "who are you?":
// clear the session and go to the login. Public screens never get a 401.
let onUnauthorized: (() => void) | undefined;

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  onUnauthorized = handler;
}

/** GET returning the whole envelope (a list needs its `meta` too). */
export function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  return request<T>(url, { signal });
}

async function send<T>(
  method: string,
  url: string,
  body?: unknown
): Promise<T> {
  const { data } = await request<ApiResponse<T>>(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return data;
}

export const post = <T>(url: string, body?: unknown) =>
  send<T>("POST", url, body);
export const patch = <T>(url: string, body?: unknown) =>
  send<T>("PATCH", url, body);
export const put = <T>(url: string, body?: unknown) =>
  send<T>("PUT", url, body);
export const del = (url: string) => request<unknown>(url, { method: "DELETE" });

/** `error.message`, or `text` when the API answered 409 (a state conflict). */
export function onConflict(error: ApiError, text: string): string {
  return error.status === 409 ? text : error.message;
}
