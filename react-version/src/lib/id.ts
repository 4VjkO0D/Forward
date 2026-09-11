/** Small, collision-resistant-enough id for locally stored records. */
export function uid(prefix = 'id'): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36).slice(-5);
  return `${prefix}_${time}${random}`;
}
