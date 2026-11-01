// Synchronise le bot avec le site (via Supabase). npm i @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');
const sb = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY) : null;

const perms = new Map(); // guildId -> { commande: [roleIds] }

// undefined = aucune règle sur le site pour cette commande (le bot garde son comportement actuel)
const rolesFor = (guildId, command) => perms.get(guildId)?.[command];

async function pull(applyWelcome) {
  if (!sb) return;
  try {
    const { data: p, error: e1 } = await sb.from('command_permissions').select('*');
    if (e1) throw e1;
    perms.clear();
    for (const r of p) (perms.get(r.guild_id) ?? perms.set(r.guild_id, {}).get(r.guild_id))[r.command] = r.role_ids;

    const { data: c, error: e2 } = await sb.from('guild_config').select('guild_id, welcome');
    if (e2) throw e2;
    for (const r of c) if (r.welcome) applyWelcome(r.guild_id, r.welcome);
  } catch (e) {
    console.error('[site] synchronisation impossible :', e.message);
  }
}

function start(applyWelcome) {
  if (!sb) return console.warn('[site] SUPABASE_URL / SUPABASE_SERVICE_KEY absents : site désactivé.');
  pull(applyWelcome);
  setInterval(() => pull(applyWelcome), 20_000); // le site est pris en compte en ~20 s
}

module.exports = { rolesFor, start };
