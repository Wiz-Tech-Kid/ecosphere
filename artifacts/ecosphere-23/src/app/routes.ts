export function appHref(route: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalized = route.startsWith('/') ? route : `/${route}`;
  return `${base}${normalized === '/' ? '/' : normalized}`;
}
