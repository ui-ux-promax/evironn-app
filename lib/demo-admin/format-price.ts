export function formatDemoPrice(amount: number): string {
  const rounded = String(Math.round(amount));
  return `${rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
}
