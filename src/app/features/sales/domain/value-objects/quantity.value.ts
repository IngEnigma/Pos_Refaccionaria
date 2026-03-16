export class Quantity {
  private constructor(readonly value: number) {}

  static fromNumber(value: number, context: string): Quantity {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${context}: quantity must be greater than zero`);
    }
    return new Quantity(value);
  }
}
