const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}
