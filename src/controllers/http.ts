import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { totalPagesOf, type Paginated } from "@/lib/pagination";
import { uuidSchema } from "@/lib/validations/common";

// CONTROLLER layer plumbing: everything that is about HTTP lives here and in
// the `*.controller.ts` files. Services and repositories never see a Request,
// a Response or a status code.

export type RouteContext<TParams = Record<string, never>> = {
  params: Promise<TParams>;
};

type RouteHandler<TParams> = (
  request: Request,
  context: RouteContext<TParams>
) => Promise<Response>;

/**
 * Wraps a controller action with the one and only error handler of the API:
 * whatever a service throws becomes the right status code, in a single place.
 */
export function handler<TParams = Record<string, never>>(
  action: RouteHandler<TParams>
): RouteHandler<TParams> {
  return async (request, context) => {
    try {
      return await action(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

// 23505 = PostgreSQL unique_violation (e.g. two sellers racing for one name).
function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  const causeCode = (error as { cause?: { code?: unknown } } | null)?.cause
    ?.code;
  return code === "23505" || causeCode === "23505";
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.issues },
      { status: 400 }
    );
  }
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: 400 }
    );
  }
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: 409 }
    );
  }
  if (isUniqueViolation(error)) {
    return NextResponse.json(
      { error: "The resource already exists" },
      { status: 409 }
    );
  }

  // Unknown failure: log it, but never leak internals to the client.
  console.error("Unhandled error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// --- responses ----------------------------------------------------------------

export function ok<T>(data: T): NextResponse {
  return NextResponse.json({ data });
}

export function created<T>(data: T, location?: string): NextResponse {
  return NextResponse.json(
    { data },
    {
      status: 201,
      headers: location ? { Location: location } : undefined,
    }
  );
}

export function success(): NextResponse {
  return NextResponse.json({ success: true });
}

// `{ data: [...], meta: { total, page, limit, totalPages } }`
export function paginated<T>(
  result: Paginated<T>,
  extraMeta: Record<string, unknown> = {}
): NextResponse {
  return NextResponse.json({
    data: result.items,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: totalPagesOf(result.total, result.limit),
      ...extraMeta,
    },
  });
}

// --- request parsing ----------------------------------------------------------

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("The request body must be valid JSON");
  }
}

// First value of every query-string key: `?page=2&sort=price_asc`.
export function queryOf(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

export function queryValuesOf(request: Request, key: string): string[] {
  return new URL(request.url).searchParams.getAll(key);
}

// A path segment that must be a UUID (anything else can't exist: 400).
export function uuidParam(value: string, name = "id"): string {
  const parsed = uuidSchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(`Invalid ${name}`);
  }
  return parsed.data;
}
