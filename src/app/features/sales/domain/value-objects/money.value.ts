export class Money {
  private constructor(readonly value: number) {}

  static fromNumber(value: number, context: string): Money {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${context}: money must be a non-negative number`);
    }
    return new Money(value);
  }

  /** Redondea al centavo (mitad hacia arriba); toPrecision absorbe el error binario (0.225 -> 22.4999...). */
  static round2(value: number): number {
    return Math.round(+(value * 100).toPrecision(12)) / 100;
  }
}
