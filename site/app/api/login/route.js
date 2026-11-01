import { makeToken } from '@/lib/server';
export async function POST(req) {
  const { password } = await req.json();
  if (password !== process.env.ADMIN_PASSWORD) return Response.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  const res = Response.json({ ok: true });
  res.headers.append('Set-Cookie', `session=${makeToken()}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`);
  return res;
}
