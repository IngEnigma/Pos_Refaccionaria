const ISO_DATE = /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

export class SaleDate {
  private constructor(readonly value: string) {}

  static fromNullable(value: string | null, context: string): SaleDate | null {
    if (value === null) return null;
    return this.fromPrimitive(value, context);
  }

  static fromPrimitive(value: string, context: string): SaleDate {
    // Date.parse usa el parser legacy de V8 ("abc 1" -> 2001) y desborda días ("02-30" -> 1-mar): se exige ISO y día real.
    const match = ISO_DATE.exec(value);
    const [year, month, day] = (match?.[1] ?? '').split('-').map(Number);
    const calendarDay = new Date(Date.UTC(year, month - 1, day));
    if (
      !match ||
      Number.isNaN(Date.parse(value)) ||
      calendarDay.getUTCMonth() !== month - 1 ||
      calendarDay.getUTCDate() !== day
    ) {
      throw new Error(`${context}: sale date must be an ISO date string`);
    }
    return new SaleDate(value);
  }
}
