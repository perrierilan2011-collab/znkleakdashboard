import { sb, isAuthed, deny } from '@/lib/server';
const id = (x) => (/^\d{15,25}$/.test(x || '') ? x : null);
export async function POST(req) {
  if (!isAuthed()) return deny();
  const t = await req.json();
  const out = {};
  for (const [k, c] of Object.entries(t)) {
    if (!/^[a-z0-9-]{1,30}$/.test(k)) continue;
    out[k] = {
      name: k, categoryId: id(c.categoryId), staffRoles: (c.staffRoles || []).filter(id), logChannelId: id(c.logChannelId),
      placeholder: String(c.placeholder || '').slice(0, 100) || null,
      reasons: (c.reasons || []).slice(0, 25).map((r) => ({
        id: String(r.id || '').slice(0, 12), label: String(r.label || '').slice(0, 100),
        description: String(r.description || '').slice(0, 100), emoji: String(r.emoji || '').slice(0, 64) || null, staffRoleId: id(r.staffRoleId),
      })).filter((r) => r.id && r.label),
    };
  }
  const { error } = await sb().from('guild_config').upsert({ guild_id: process.env.GUILD_ID, tickets: out, updated_at: new Date().toISOString() });
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
}
