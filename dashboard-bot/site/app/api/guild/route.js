import { discord, sb, isAuthed, deny } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!isAuthed()) return deny();
  const g = process.env.GUILD_ID;
  try {
    const [roles, channels] = await Promise.all([discord(`/guilds/${g}/roles`), discord(`/guilds/${g}/channels`)]);
    const db = sb();
    const { data: p } = await db.from('command_permissions').select('*').eq('guild_id', g);
    const { data: c } = await db.from('guild_config').select('welcome').eq('guild_id', g).maybeSingle();
    return Response.json({
      roles: roles.filter((r) => r.id !== g).sort((a, b) => b.position - a.position)
        .map((r) => ({ id: r.id, name: r.name, color: r.color })),
      categories: channels.filter((x) => x.type === 4).sort((a, b) => a.position - b.position)
        .map((x) => ({ id: x.id, name: x.name })),
      channels: channels.filter((x) => x.type === 0 || x.type === 5).sort((a, b) => a.position - b.position)
        .map((x) => ({ id: x.id, name: x.name, parent: x.parent_id })),
      permissions: Object.fromEntries((p || []).map((r) => [r.command, r.role_ids])),
      welcome: c?.welcome || null,
    });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
