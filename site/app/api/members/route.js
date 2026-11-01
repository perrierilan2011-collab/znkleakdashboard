import { discord, isAuthed, deny } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(req) {
  if (!isAuthed()) return deny();
  const q = new URL(req.url).searchParams.get('q') || '';
  try {
    const m = await discord(`/guilds/${process.env.GUILD_ID}/members/search?query=${encodeURIComponent(q)}&limit=8`);
    return Response.json({ members: m.map((x) => ({ id: x.user.id, name: x.nick || x.user.global_name || x.user.username, username: x.user.username })) });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
