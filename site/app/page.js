'use client';
import { useEffect, useState } from 'react';
import { COMMANDS } from '@/lib/commands';

const NAV = [
  ['Général', '🏠', [['perms', 'Permissions des commandes']]],
  ['Messages', '💬', [['welcome', 'Bienvenue'], ['ann', 'Annonces']]],
  ['Tickets', '🎫', [['tk-cfg', 'Configurations'], ['tk-panel', 'Envoyer un panel']]],
  ['Modération', '🛡️', [['mod', 'Sanctions']]],
  ['Giveaways', '🎉', [['gw', 'Lancer un giveaway']]],
];
const hex = (n) => (n ? '#' + n.toString(16).padStart(6, '0') : '#99aab5');
const api = (url, body) => fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined).then((r) => r.json());

async function runJob(type, payload, flash) {
  const r = await api('/api/job', { type, payload });
  if (r.error) return flash('❌ ' + r.error);
  flash('⏳ Envoyé au bot…');
  for (let n = 0; n < 12; n++) {
    await new Promise((s) => setTimeout(s, 1500));
    const j = await api('/api/job?id=' + r.id);
    if (j.status === 'done') return flash('✅ ' + j.result);
    if (j.status === 'error') return flash('❌ ' + j.result);
  }
  flash('⚠️ Le bot ne répond pas (est-il allumé ?)');
}

const Inp = ({ o, s, k, l, area, ...p }) => (
  <div><label>{l}</label>
    {area ? <textarea value={o[k] ?? ''} onChange={(e) => s({ ...o, [k]: e.target.value })} {...p} />
      : <input value={o[k] ?? ''} onChange={(e) => s({ ...o, [k]: e.target.value })} {...p} />}
  </div>
);
const Roles = ({ data, sel, onToggle }) => data.roles.map((r) => (
  <span key={r.id} className="chip" onClick={() => onToggle(r.id)}
    style={{ borderColor: hex(r.color), background: sel.includes(r.id) ? hex(r.color) : 'transparent' }}>{r.name}</span>));
const RoleSel = ({ data, value, onChange }) => (
  <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
    <option value="">— aucun —</option>{data.roles.map((r) => <option key={r.id} value={r.id}>@{r.name}</option>)}
  </select>);
function ChannelSelect({ data, value, onChange }) {
  const of = (id) => data.channels.filter((c) => c.parent === id);
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">— choisir un salon —</option>
      {of(null).map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
      {data.categories.map((cat) => (
        <optgroup key={cat.id} label={cat.name.toUpperCase()}>{of(cat.id).map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}</optgroup>))}
    </select>);
}
const CategorySelect = ({ data, value, onChange }) => (
  <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
    <option value="">— choisir une catégorie —</option>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
  </select>);

function Preview({ content, title, description, color, image, footer, menu }) {
  return (
    <div style={{ background: '#313338', borderRadius: 10, padding: 16 }}>
      <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>Bot <span style={{ background: '#5865F2', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>BOT</span></div>
      {content && <div style={{ marginBottom: 6, whiteSpace: 'pre-wrap' }}>{content}</div>}
      <div style={{ borderLeft: `4px solid ${color || '#5865F2'}`, background: '#2b2d31', borderRadius: 4, padding: 12, maxWidth: 480 }}>
        {title && <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{title}</div>}
        {description && <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{description}</div>}
        {/^https?:\/\//.test(image || '') && <img src={image} alt="" style={{ maxWidth: '100%', borderRadius: 4, marginTop: 8 }} />}
        {footer && <div style={{ fontSize: 12, color: '#949ba4', marginTop: 8 }}>{footer}</div>}
      </div>
      {menu}
    </div>);
}
const sample = (t) => (t || '').replaceAll('{user}', '@Membre').replaceAll('{username}', 'Membre').replaceAll('{server}', 'Mon serveur').replaceAll('{count}', '123');

/* ---------------- Pages ---------------- */
function Perms({ data, setData, flash }) {
  const toggle = async (cmd, id) => {
    const cur = data.permissions[cmd] || [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setData({ ...data, permissions: { ...data.permissions, [cmd]: next } });
    const r = await api('/api/permissions', { command: cmd, roleIds: next });
    flash(r.error ? '❌ ' + r.error : '✅ Enregistré (pris en compte en ~20 s)');
  };
  return (<>
    {COMMANDS.map(([g, cmds]) => (
      <div key={g} className="card"><h3>{g}</h3>
        {cmds.map((c) => (<div key={c} style={{ marginBottom: 14 }}><code style={{ color: '#fff' }}>/{c}</code><br /><Roles data={data} sel={data.permissions[c] || []} onToggle={(id) => toggle(c, id)} /></div>))}
      </div>))}
    <p style={{ color: 'var(--mut)' }}>Le propriétaire et les rôles « accès total » ont toujours accès à tout. Sans rôle coché, la commande garde son réglage actuel.</p>
  </>);
}

function Welcome({ data, flash }) {
  const [w, setW] = useState(data.welcome || { enabled: false, channelId: '', content: '{user}', title: 'Bienvenue {username} !', description: 'Bienvenue sur **{server}** ! Tu es le membre n°{count}.', image: '', color: '#5865F2' });
  return (
    <div className="grid">
      <div className="card">
        <label><input type="checkbox" checked={w.enabled} onChange={(e) => setW({ ...w, enabled: e.target.checked })} /> Activé</label>
        <label>Salon</label><ChannelSelect data={data} value={w.channelId} onChange={(v) => setW({ ...w, channelId: v })} />
        <Inp o={w} s={setW} k="content" l="Texte au-dessus" /><Inp o={w} s={setW} k="title" l="Titre" />
        <Inp o={w} s={setW} k="description" l="Description" area /><Inp o={w} s={setW} k="image" l="URL d'image" /><Inp o={w} s={setW} k="color" l="Couleur (#5865F2)" />
        <small style={{ color: 'var(--mut)' }}>Variables : {'{user} {username} {server} {count}'}</small><br />
        <button className="btn" onClick={async () => { const r = await api('/api/welcome', w); flash(r.error ? '❌ ' + r.error : '✅ Enregistré'); }}>Enregistrer</button>
      </div>
      <div><h3>Aperçu</h3><Preview content={sample(w.content)} title={sample(w.title)} description={sample(w.description)} color={w.color} image={w.image} /></div>
    </div>);
}

function Ann({ data, flash }) {
  const [a, setA] = useState({ channelId: '', content: '', title: '', description: '', color: '#5865F2', image: '', footer: '' });
  return (
    <div className="grid">
      <div className="card">
        <label>Salon</label><ChannelSelect data={data} value={a.channelId} onChange={(v) => setA({ ...a, channelId: v })} />
        <Inp o={a} s={setA} k="content" l="Texte au-dessus" /><Inp o={a} s={setA} k="title" l="Titre" /><Inp o={a} s={setA} k="description" l="Texte (Markdown)" area />
        <Inp o={a} s={setA} k="image" l="URL d'image" /><Inp o={a} s={setA} k="footer" l="Pied de page" /><Inp o={a} s={setA} k="color" l="Couleur" />
        <button className="btn" onClick={async () => { const r = await api('/api/send', a); flash(r.error ? '❌ ' + r.error : '✅ Envoyé'); }}>Envoyer</button>
      </div>
      <div><h3>Aperçu</h3><Preview {...a} /></div>
    </div>);
}

function Tickets({ data, flash }) {
  const [all, setAll] = useState(data.tickets || {});
  const [cur, setCur] = useState(Object.keys(data.tickets || {})[0] || '');
  const [nn, setNn] = useState('');
  const c = all[cur];
  const set = (p) => setAll({ ...all, [cur]: { ...c, ...p } });
  const save = async (next = all) => { const r = await api('/api/tickets', next); flash(r.error ? '❌ ' + r.error : '✅ Enregistré (pris en compte en ~20 s)'); };
  const setReason = (i, p) => set({ reasons: c.reasons.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  return (<>
    <div className="card">
      <div className="row">
        <div><label>Nouvelle configuration</label><input placeholder="ex : support" value={nn} onChange={(e) => setNn(e.target.value.toLowerCase())} /></div>
        <button className="btn x" onClick={() => {
          if (!/^[a-z0-9-]{1,30}$/.test(nn) || all[nn]) return flash('❌ Nom invalide ou déjà pris (minuscules, chiffres, tirets)');
          setAll({ ...all, [nn]: { name: nn, categoryId: '', staffRoles: [], logChannelId: '', placeholder: '', reasons: [] } }); setCur(nn); setNn('');
        }}>Créer</button>
      </div>
      <label>Configuration à modifier</label>
      <select value={cur} onChange={(e) => setCur(e.target.value)}><option value="">—</option>{Object.keys(all).map((n) => <option key={n}>{n}</option>)}</select>
    </div>
    {c && (<div className="grid">
      <div className="card"><h3>Réglages</h3>
        <label>Catégorie où créer les tickets</label><CategorySelect data={data} value={c.categoryId} onChange={(v) => set({ categoryId: v })} />
        <label>Salon des transcripts (optionnel)</label><ChannelSelect data={data} value={c.logChannelId} onChange={(v) => set({ logChannelId: v })} />
        <label>Rôles staff (au moins un)</label>
        <Roles data={data} sel={c.staffRoles} onToggle={(id) => set({ staffRoles: c.staffRoles.includes(id) ? c.staffRoles.filter((x) => x !== id) : [...c.staffRoles, id] })} />
        <Inp o={c} s={(v) => set(v)} k="placeholder" l="Texte du menu déroulant" placeholder="Choisir une catégorie..." />
        <button className="btn" onClick={() => save()}>Enregistrer</button>
        <button className="btn red" onClick={() => { if (!confirm('Supprimer cette configuration ?')) return; const n = { ...all }; delete n[cur]; setAll(n); setCur(''); save(n); }}>Supprimer</button>
      </div>
      <div className="card"><h3>Catégories du menu ({c.reasons.length}/25)</h3>
        {c.reasons.map((r, i) => (
          <div key={r.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10, marginBottom: 10 }}>
            <div className="row">
              <div className="x" style={{ width: 90 }}><label>Emoji</label><input value={r.emoji || ''} onChange={(e) => setReason(i, { emoji: e.target.value })} placeholder="🎮" /></div>
              <div><label>Nom</label><input value={r.label} onChange={(e) => setReason(i, { label: e.target.value })} /></div>
              <button className="btn red x" onClick={() => set({ reasons: c.reasons.filter((_, j) => j !== i) })}>✕</button>
            </div>
            <label>Description</label><input value={r.description || ''} onChange={(e) => setReason(i, { description: e.target.value })} />
            <label>Rôle staff propre à cette catégorie (optionnel)</label><RoleSel data={data} value={r.staffRoleId} onChange={(v) => setReason(i, { staffRoleId: v })} />
          </div>))}
        {c.reasons.length < 25 && <button className="btn ghost" onClick={() => set({ reasons: [...c.reasons, { id: crypto.randomUUID().slice(0, 8), label: 'Nouvelle catégorie', description: '', emoji: '', staffRoleId: '' }] })}>+ Ajouter une catégorie</button>}
        <p style={{ color: 'var(--mut)', fontSize: 12 }}>Emoji perso : écris <code>{'<:nom:ID>'}</code> (ou juste l'ID de l'emoji).</p>
      </div>
    </div>)}
  </>);
}

function Panel({ data, flash }) {
  const [p, setP] = useState({ config: Object.keys(data.tickets || {})[0] || '', channelId: '', title: '', description: '', color: '#ED4245', image: '', footer: '' });
  const cfg = (data.tickets || {})[p.config];
  const desc = p.description || (cfg?.reasons?.length ? 'Sélectionne la catégorie de ta demande dans le menu ci-dessous pour ouvrir un ticket.' : 'Clique sur le bouton ci-dessous pour ouvrir un ticket.');
  const menu = cfg && (cfg.reasons.length
    ? (<div style={{ marginTop: 10, maxWidth: 480 }}>
      <div style={{ background: '#1e1f22', borderRadius: 6, padding: '10px 12px', color: '#b5bac1' }}>{cfg.placeholder || 'Choisir une catégorie...'} ⌄</div>
      <div style={{ background: '#2b2d31', borderRadius: 6, marginTop: 4, padding: 6 }}>{cfg.reasons.map((r) => (<div key={r.id} style={{ padding: '6px 8px' }}>{r.emoji && !r.emoji.startsWith('<') && /\D/.test(r.emoji) ? r.emoji + ' ' : '▫️ '}<b>{r.label}</b><div style={{ fontSize: 12, color: '#949ba4' }}>{r.description}</div></div>))}</div>
    </div>)
    : <div style={{ marginTop: 10 }}><span style={{ background: '#5865F2', color: '#fff', padding: '8px 16px', borderRadius: 4 }}>🎫 Ouvrir un ticket</span></div>);
  return (
    <div className="grid">
      <div className="card">
        <label>Configuration</label>
        <select value={p.config} onChange={(e) => setP({ ...p, config: e.target.value })}><option value="">—</option>{Object.keys(data.tickets || {}).map((n) => <option key={n}>{n}</option>)}</select>
        <label>Salon où envoyer le panel</label><ChannelSelect data={data} value={p.channelId} onChange={(v) => setP({ ...p, channelId: v })} />
        <Inp o={p} s={setP} k="title" l="Titre" placeholder={cfg ? `🎫 Support — ${cfg.name}` : ''} /><Inp o={p} s={setP} k="description" l="Texte du panel" area />
        <Inp o={p} s={setP} k="image" l="Bannière (URL)" /><Inp o={p} s={setP} k="footer" l="Pied de page" /><Inp o={p} s={setP} k="color" l="Couleur" />
        <button className="btn" onClick={() => runJob('ticket_panel', p, flash)}>Envoyer le panel</button>
      </div>
      <div><h3>Aperçu</h3><Preview title={p.title || (cfg ? `🎫 Support — ${cfg.name}` : '')} description={desc} color={p.color} image={p.image} footer={p.footer} menu={menu} /></div>
    </div>);
}

function Mod({ flash }) {
  const [q, setQ] = useState(''); const [res, setRes] = useState([]); const [u, setU] = useState(null);
  const [f, setF] = useState({ reason: '', amount: 60, unit: 1, days: 0 });
  useEffect(() => {
    if (q.length < 2 || /^\d+$/.test(q)) { setRes([]); return; }
    const t = setTimeout(async () => { const r = await api('/api/members?q=' + encodeURIComponent(q)); setRes(r.members || []); }, 400);
    return () => clearTimeout(t);
  }, [q]);
  const id = u?.id || (/^\d{15,25}$/.test(q) ? q : '');
  const go = (type, extra = {}) => (id ? runJob(type, { userId: id, reason: f.reason, ...extra }, flash) : flash('❌ Choisis un membre (ou colle un ID)'));
  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <label>Membre (pseudo, ou ID pour un banni)</label>
      <input value={q} onChange={(e) => { setQ(e.target.value); setU(null); }} placeholder="Tape un pseudo…" />
      {res.map((m) => <span key={m.id} className="chip" style={{ borderColor: '#5865F2' }} onClick={() => { setU(m); setQ(m.name); setRes([]); }}>{m.name} ({m.username})</span>)}
      {u && <p>Sélectionné : <b>{u.name}</b> <span className="pill">{u.id}</span></p>}
      <Inp o={f} s={setF} k="reason" l="Raison" />
      <div className="row">
        <div><label>Durée du mute</label><input type="number" min="1" value={f.amount} onChange={(e) => setF({ ...f, amount: +e.target.value })} /></div>
        <div><label>Unité</label><select value={f.unit} onChange={(e) => setF({ ...f, unit: +e.target.value })}><option value={1}>Minutes</option><option value={60}>Heures</option><option value={1440}>Jours</option></select></div>
        <div><label>Messages à supprimer (ban)</label><select value={f.days} onChange={(e) => setF({ ...f, days: +e.target.value })}><option value={0}>Aucun</option><option value={1}>24 h</option><option value={7}>7 jours</option></select></div>
      </div>
      <button className="btn red" onClick={() => go('ban', { days: f.days })}>🔨 Bannir</button>
      <button className="btn green" onClick={() => go('unban')}>Débannir</button>
      <button className="btn" onClick={() => go('mute', { minutes: f.amount * f.unit })}>🔇 Mute</button>
      <button className="btn ghost" onClick={() => go('unmute')}>🔊 Unmute</button>
    </div>);
}

function Giveaway({ data, flash }) {
  const [g, setG] = useState({ channelId: '', prize: '', description: '', amount: 24, unit: 60, winners: 1, requiredRole: '', minInvites: 0 });
  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <label>Salon</label><ChannelSelect data={data} value={g.channelId} onChange={(v) => setG({ ...g, channelId: v })} />
      <Inp o={g} s={setG} k="prize" l="Lot" /><Inp o={g} s={setG} k="description" l="Description" area />
      <div className="row">
        <div><label>Durée</label><input type="number" min="1" value={g.amount} onChange={(e) => setG({ ...g, amount: +e.target.value })} /></div>
        <div><label>Unité</label><select value={g.unit} onChange={(e) => setG({ ...g, unit: +e.target.value })}><option value={1}>Minutes</option><option value={60}>Heures</option><option value={1440}>Jours</option></select></div>
        <div><label>Gagnants</label><input type="number" min="1" max="20" value={g.winners} onChange={(e) => setG({ ...g, winners: +e.target.value })} /></div>
      </div>
      <label>Rôle requis</label><RoleSel data={data} value={g.requiredRole} onChange={(v) => setG({ ...g, requiredRole: v })} />
      <div><label>Invitations minimum (0 = aucune)</label><input type="number" min="0" value={g.minInvites} onChange={(e) => setG({ ...g, minInvites: +e.target.value })} /></div>
      <button className="btn" onClick={() => (g.channelId && g.prize ? runJob('giveaway_create', { ...g, minutes: g.amount * g.unit }, flash) : flash('❌ Salon et lot obligatoires'))}>🎉 Lancer</button>
    </div>);
}

/* ---------------- Coquille ---------------- */
export default function Home() {
  const [data, setData] = useState(null); const [err, setErr] = useState(''); const [pw, setPw] = useState('');
  const [tab, setTab] = useState('perms'); const [closed, setClosed] = useState({}); const [toast, setToast] = useState('');
  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 4000); };
  const load = async () => {
    const d = await api('/api/guild');
    if (d.error) { setData(null); setErr(d.error === 'Non connecté' ? '' : d.error); return; }
    setData(d); setErr('');
  };
  useEffect(() => { load(); }, []);

  if (!data) return (
    <div className="login"><div className="card">
      <h2 style={{ marginTop: 0 }}>🔐 Dashboard du bot</h2>
      <input type="password" placeholder="Mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && document.getElementById('go').click()} />
      <button id="go" className="btn" onClick={async () => { const r = await api('/api/login', { password: pw }); r.error ? setErr(r.error) : load(); }}>Se connecter</button>
      {err && <p style={{ color: '#f23f42' }}>{err}</p>}
    </div></div>);

  const P = { data, flash };
  const pages = { perms: <Perms {...P} setData={setData} />, welcome: <Welcome {...P} />, ann: <Ann {...P} />, 'tk-cfg': <Tickets {...P} />, 'tk-panel': <Panel {...P} />, mod: <Mod {...P} />, gw: <Giveaway {...P} /> };
  const title = NAV.flatMap((n) => n[2]).find((x) => x[0] === tab)?.[1];
  return (
    <div className="app">
      <aside className="side">
        <div className="brand">{data.guild.icon ? <img src={data.guild.icon} alt="" /> : <i />}<span>{data.guild.name}</span></div>
        {NAV.map(([g, ic, items]) => (<div key={g}>
          <button className="grp" onClick={() => setClosed({ ...closed, [g]: !closed[g] })}><span>{ic} {g}</span><span>{closed[g] ? '▸' : '▾'}</span></button>
          {!closed[g] && items.map(([k, l]) => <button key={k} className={'item' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>)}
        </div>))}
      </aside>
      <main className="main">
        <h1>{title}</h1><p className="sub">{data.guild.name}</p>
        {pages[tab]}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>);
}
