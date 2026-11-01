import crypto from 'crypto';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const sb = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const sign = () => crypto.createHmac('sha256', process.env.SESSION_SECRET).update(process.env.ADMIN_PASSWORD).digest('hex');
export const makeToken = sign;
export const isAuthed = () => cookies().get('session')?.value === sign();
export const deny = () => Response.json({ error: 'Non connecté' }, { status: 401 });

export async function discord(path, opts = {}) {
  const r = await fetch('https://discord.com/api/v10' + path, {
    ...opts,
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`Discord ${r.status} : ${await r.text()}`);
  return r.json();
}
