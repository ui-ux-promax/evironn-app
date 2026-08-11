const base = process.env.SMOKE_BASE_URL;
if (!base) throw new Error('SMOKE_BASE_URL is required');

const publicPaths = [
  '/',
  '/catalog',
  '/demo-admin',
  '/demo-admin/catalog',
  '/demo-admin/orders',
  '/demo-admin/customers',
  '/demo-admin/marketing',
  '/api/health',
];

for (const path of publicPaths) {
  const response = await fetch(new URL(path, base), { redirect: 'manual' });
  if (!response.ok) throw new Error(`${path}: expected 2xx, received ${response.status}`);
  if (!response.headers.get('content-security-policy')) throw new Error(`${path}: missing CSP`);
  console.log(`PASS ${path} ${response.status}`);
}

const admin = await fetch(new URL('/admin', base), { redirect: 'manual' });
if (![302, 303, 307, 308].includes(admin.status))
  throw new Error(`/admin: expected redirect, received ${admin.status}`);
console.log(`PASS /admin denied ${admin.status}`);
