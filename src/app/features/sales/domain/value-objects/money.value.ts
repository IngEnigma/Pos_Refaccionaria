export class Money {
  private constructor(readonly value: number) {}

  static fromNumber(value: number, context: string): Money {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${context}: money must be a non-negative number`);
    }
    return new Money(value);
  }
}
