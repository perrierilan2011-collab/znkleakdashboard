-- À coller dans Supabase > SQL Editor > Run
create table if not exists command_permissions (
  guild_id text not null,
  command  text not null,
  role_ids text[] not null default '{}',
  primary key (guild_id, command)
);
create table if not exists guild_config (
  guild_id text primary key,
  welcome  jsonb,
  updated_at timestamptz default now()
);
-- Pas de policy : seule la clé "service_role" (bot + site côté serveur) peut lire/écrire.
alter table command_permissions enable row level security;
alter table guild_config enable row level security;
