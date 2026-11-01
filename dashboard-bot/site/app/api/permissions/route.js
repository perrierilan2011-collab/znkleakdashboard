import { sb, isAuthed, deny } from '@/lib/server';
import { COMMANDS } from '@/lib/commands';
export async function POST(req) {
  if (!isAuthed()) return deny();
  const { command, roleIds } = await req.json();
  if (!COMMANDS.some(([, l]) => l.includes(command)) || !Array.isArray(roleIds)) return Response.json({ error: 'Invalide' }, { status: 400 });
  const { error } = await sb().from('command_permissions').upsert({
    guild_id: process.env.GUILD_ID, command, role_ids: roleIds.filter((x) => /^\d+$/.test(x)),
  });
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
}
