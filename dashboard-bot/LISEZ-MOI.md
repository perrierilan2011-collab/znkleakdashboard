# Installation (≈ 15 min)
1. Supabase : crée un projet, SQL Editor → colle supabase.sql → Run. Settings > API : copie l'URL et la clé service_role.
2. Bot : suis bot/PATCH.md (copie siteSync.js + 5 modifications). Ajoute SUPABASE_URL et SUPABASE_SERVICE_KEY au .env du bot. Relance le bot.
3. Site : mets le dossier site/ sur GitHub → Vercel > New Project > importe-le, Root Directory = site.
   Ajoute les variables de .env.example dans Vercel > Settings > Environment Variables. Deploy.
4. Ouvre l'URL Vercel, entre ton mot de passe.
