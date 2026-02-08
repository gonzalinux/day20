export class AlreadyExistsError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "AlreadyExistsError";
  }
}

export class NotFoundError extends Error {
  status = 404;
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
