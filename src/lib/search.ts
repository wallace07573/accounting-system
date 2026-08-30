export function sanitizeIlikeQuery(query: string): string {
  return query.replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}
