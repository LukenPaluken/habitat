// Domain errors. Services (and auth helpers) throw these; they know nothing about
// HTTP. The controller layer (`src/controllers/http.ts`) is the only place that
// maps them to status codes:
//   ValidationError 400 · UnauthorizedError 401 · ForbiddenError 403
//   NotFoundError 404 · ConflictError 409

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You are not allowed to perform this action") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(
    message: string,
    /** Optional, e.g. `{ field: "email" }`, so a form can mark the culprit. */
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ConflictError";
  }
}
