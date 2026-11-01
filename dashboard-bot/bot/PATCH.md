# Modifications à faire dans index.js du bot (5 petits changements)

0. Terminal : `npm i @supabase/supabase-js` et ajouter au .env du bot :
   SUPABASE_URL=...  SUPABASE_SERVICE_KEY=...   (clé "service_role")
   Copier siteSync.js à côté de index.js.

1. En haut du fichier, après les require :
   const site = require('./siteSync');

2. Remplace `canModerate` ET `commandAllowed` par :

   const canModerate = (i) => {
     if (hasFullAccess(i)) return true;
     const rule = site.rolesFor(i.guildId, i.commandName);           // règle définie sur le site
     if (rule) return i.member.roles.cache.some((r) => rule.includes(r.id));
     return i.member.roles.cache.some((r) => getG(i.guildId).modRoles.includes(r.id));
   };
   const commandAllowed = (i) =>
     PUBLIC_COMMANDS.has(i.commandName) || hasFullAccess(i) ||
     (site.rolesFor(i.guildId, i.commandName) ? canModerate(i) : MOD_COMMANDS.has(i.commandName) && canModerate(i));

3. Dans /autorole (début du handler) et dans l'autocomplete "giveaway" :
   remplace `hasFullAccess(i)` par `canModerate(i)` (3 endroits : handler autorole, autocomplete 'message', autocomplete 'giveaway').

4. Dans ClientReady, remplace la construction de `body` pour que les commandes soient visibles
   par les rôles choisis sur le site (le contrôle d'accès est fait par le code) :
   const body = commands.map((c) => c.setDefaultMemberPermissions(null).toJSON());
   (les commandes 👑 /role-total, /roles-mod, /roles-proteges restent protégées par leur propre vérification)
   puis, juste après `console.log('✅ Commandes enregistrées');` ajoute :
   site.start((guildId, w) => { Object.assign(getG(guildId).welcome, w); save(); });

5. Salon des commandes : dans commandChannelOverwrites, ajoute aux `ids` les rôles du site :
   const siteRoles = [...new Set(Object.values(site.allRoles?.(guild.id) || {}).flat())];
   (optionnel : sinon ajoute-les avec /salon-commandes role:...)
