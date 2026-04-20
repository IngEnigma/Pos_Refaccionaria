export class SalesDomainError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SalesDomainError';
  }
}

export class SaleCreationError extends SalesDomainError {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleCreationError';
  }
}

export class SaleFetchError extends SalesDomainError {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleFetchError';
  }
}

export class SaleUpdateError extends SalesDomainError {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleUpdateError';
  }
}

export class SaleDeleteError extends SalesDomainError {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleDeleteError';
  }
}

export class PaymentMethodFetchError extends SalesDomainError {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'PaymentMethodFetchError';
  }
}

export class PaymentMethodMutationError extends SalesDomainError {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'PaymentMethodMutationError';
  }
}

export class SaleDetailMutationError extends SalesDomainError {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleDetailMutationError';
  }
}

export class SaleDetailFetchError extends SalesDomainError {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'SaleDetailFetchError';
  }
}
