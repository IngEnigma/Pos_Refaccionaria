export class ProductTypeFetchError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'ProductTypeFetchError';
  }
}

export class ProductTypeMutationError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'ProductTypeMutationError';
  }
}
