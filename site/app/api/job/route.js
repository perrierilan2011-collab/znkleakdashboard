import { sb, isAuthed, deny } from '@/lib/server';
export const dynamic = 'force-dynamic';
const TYPES = ['ticket_panel', 'ban', 'unban', 'mute', 'unmute', 'giveaway_create'];
export async function POST(req) {
  if (!isAuthed()) return deny();
  const { type, payload } = await req.json();
  if (!TYPES.includes(type)) return Response.json({ error: 'Action inconnue' }, { status: 400 });
  const { data, error } = await sb().from('jobs').insert({ guild_id: process.env.GUILD_ID, type, payload }).select('id').single();
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ id: data.id });
}
export async function GET(req) {
  if (!isAuthed()) return deny();
  const id = new URL(req.url).searchParams.get('id');
  const { data } = await sb().from('jobs').select('status,result').eq('id', id).eq('guild_id', process.env.GUILD_ID).maybeSingle();
  return Response.json(data || { status: 'error', result: 'introuvable' });
}
