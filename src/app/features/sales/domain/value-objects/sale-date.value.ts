export class SaleDate {
  private constructor(readonly value: string) {}

  static fromNullable(value: string | null, context: string): SaleDate | null {
    if (value === null) return null;
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      throw new Error(`${context}: sale date must be an ISO date string`);
    }
    return new SaleDate(value);
  }
}
