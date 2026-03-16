export class SaleCreationError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleCreationError';
  }
}

export class SaleFetchError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleFetchError';
  }
}

export class SaleUpdateError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleUpdateError';
  }
}

export class SaleDeleteError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleDeleteError';
  }
}

export class PaymentMethodFetchError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'PaymentMethodFetchError';
  }
}

export class PaymentMethodMutationError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'PaymentMethodMutationError';
  }
}

export class SaleDetailMutationError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleDetailMutationError';
  }
}

export class SaleDetailFetchError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleDetailFetchError';
  }
}
