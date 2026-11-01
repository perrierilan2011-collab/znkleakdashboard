import { sb, isAuthed, deny } from '@/lib/server';
export async function POST(req) {
  if (!isAuthed()) return deny();
  const w = await req.json();
  const clean = {
    enabled: !!w.enabled, channelId: /^\d+$/.test(w.channelId || '') ? w.channelId : null,
    content: String(w.content || '').slice(0, 500), title: String(w.title || '').slice(0, 256),
    description: String(w.description || '').slice(0, 4000), image: String(w.image || '').slice(0, 500),
    color: /^#[0-9a-f]{6}$/i.test(w.color) ? w.color : '#5865F2',
  };
  const { error } = await sb().from('guild_config').upsert({ guild_id: process.env.GUILD_ID, welcome: clean, updated_at: new Date().toISOString() });
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
}
