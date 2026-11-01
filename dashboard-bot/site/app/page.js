'use client';
import { useEffect, useState } from 'react';
import { COMMANDS } from '@/lib/commands';

const S = {
  card: { background: '#2b2d31', borderRadius: 8, padding: 16, marginBottom: 16 },
  input: { background: '#1e1f22', color: '#dbdee1', border: '1px solid #3f4147', borderRadius: 4, padding: 8, width: '100%', boxSizing: 'border-box', marginBottom: 8 },
  btn: { background: '#5865F2', color: '#fff', border: 0, borderRadius: 4, padding: '8px 16px', cursor: 'pointer' },
  chip: (on, c) => ({ border: `1px solid ${c}`, background: on ? c : 'transparent', color: '#fff', borderRadius: 12, padding: '2px 10px', margin: 3, cursor: 'pointer', fontSize: 13 }),
};
const hex = (n) => (n ? '#' + n.toString(16).padStart(6, '0') : '#99aab5');
const api = (url, body) => fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined).then((r) => r.json());

function ChannelSelect({ data, value, onChange }) {
  const group = (cat) => data.channels.filter((c) => c.parent === (cat?.id ?? null));
  return (
    <select style={S.input} value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">— choisir un salon —</option>
      {group(null).map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
      {data.categories.map((cat) => (
        <optgroup key={cat.id} label={cat.name.toUpperCase()}>
          {group(cat).map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

function Preview({ content, title, description, color, image, footer }) {
  return (
    <div style={{ background: '#313338', borderRadius: 8, padding: 16 }}>
      <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>Bot <span style={{ background: '#5865F2', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>BOT</span></div>
      {content && <div style={{ marginBottom: 6, whiteSpace: 'pre-wrap' }}>{content}</div>}
      <div style={{ borderLeft: `4px solid ${color || '#5865F2'}`, background: '#2b2d31', borderRadius: 4, padding: 12, maxWidth: 480 }}>
        {title && <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{title}</div>}
        {description && <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{description}</div>}
        {/^https?:\/\//.test(image || '') && <img src={image} alt="" style={{ maxWidth: '100%', borderRadius: 4, marginTop: 8 }} />}
        {footer && <div style={{ fontSize: 12, color: '#949ba4', marginTop: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('perms');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [welcome, setWelcome] = useState(null);
  const [ann, setAnn] = useState({ channelId: '', content: '', title: '', description: '', color: '#5865F2', image: '', footer: '' });

  const load = async () => {
    const d = await api('/api/guild');
    if (d.error) { setData(null); setErr(d.error === 'Non connecté' ? '' : d.error); return; }
    setData(d); setErr('');
    setWelcome(d.welcome || { enabled: false, channelId: '', content: '{user}', title: 'Bienvenue {username} !', description: 'Bienvenue sur **{server}** ! Tu es le membre n°{count}.', image: '', color: '#5865F2' });
  };
  useEffect(() => { load(); }, []);
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };

  if (!data) return (
    <div style={{ maxWidth: 360, margin: '15vh auto' }}>
      <div style={S.card}>
        <h2 style={{ marginTop: 0 }}>Dashboard du bot</h2>
        <input style={S.input} type="password" placeholder="Mot de passe" value={pw} onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && document.getElementById('go').click()} />
        <button id="go" style={S.btn} onClick={async () => { const r = await api('/api/login', { password: pw }); r.error ? setErr(r.error) : load(); }}>Se connecter</button>
        {err && <p style={{ color: '#f23f42' }}>{err}</p>}
      </div>
    </div>
  );

  const toggleRole = async (cmd, roleId) => {
    const cur = data.permissions[cmd] || [];
    const next = cur.includes(roleId) ? cur.filter((x) => x !== roleId) : [...cur, roleId];
    setData({ ...data, permissions: { ...data.permissions, [cmd]: next } });
    const r = await api('/api/permissions', { command: cmd, roleIds: next });
    flash(r.error ? '❌ ' + r.error : '✅ Enregistré (pris en compte par le bot en ~20 s)');
  };
  const sample = (t) => (t || '').replaceAll('{user}', '@Membre').replaceAll('{username}', 'Membre').replaceAll('{server}', 'Mon serveur').replaceAll('{count}', '123');
  const W = (k) => (e) => setWelcome({ ...welcome, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const A = (k) => (e) => setAnn({ ...ann, [k]: e.target.value });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['perms', '🔐 Permissions'], ['welcome', '👋 Bienvenue'], ['ann', '📢 Annonce']].map(([k, l]) => (
          <button key={k} style={{ ...S.btn, background: tab === k ? '#5865F2' : '#3f4147' }} onClick={() => setTab(k)}>{l}</button>
        ))}
        <span style={{ marginLeft: 'auto', alignSelf: 'center' }}>{msg}</span>
      </div>

      {tab === 'perms' && (<>
        <p>Clique sur un rôle pour lui donner (ou retirer) l'accès à une commande. Le propriétaire et les rôles « accès total » ont toujours accès à tout. Sans rôle coché, la commande garde son réglage actuel dans le bot.</p>
        {COMMANDS.map(([group, cmds]) => (
          <div key={group} style={S.card}><h3 style={{ marginTop: 0 }}>{group}</h3>
            {cmds.map((cmd) => (
              <div key={cmd} style={{ marginBottom: 12 }}>
                <code style={{ color: '#fff' }}>/{cmd}</code>
                <div>{data.roles.map((r) => (
                  <span key={r.id} style={S.chip((data.permissions[cmd] || []).includes(r.id), hex(r.color))} onClick={() => toggleRole(cmd, r.id)}>{r.name}</span>
                ))}</div>
              </div>))}
          </div>))}
      </>)}

      {tab === 'welcome' && welcome && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.card}>
            <label><input type="checkbox" checked={welcome.enabled} onChange={W('enabled')} /> Activé</label>
            <ChannelSelect data={data} value={welcome.channelId} onChange={(v) => setWelcome({ ...welcome, channelId: v })} />
            <input style={S.input} placeholder="Texte au-dessus" value={welcome.content} onChange={W('content')} />
            <input style={S.input} placeholder="Titre" value={welcome.title} onChange={W('title')} />
            <textarea style={{ ...S.input, height: 100 }} placeholder="Description" value={welcome.description} onChange={W('description')} />
            <input style={S.input} placeholder="URL d'image" value={welcome.image} onChange={W('image')} />
            <input style={S.input} placeholder="#5865F2" value={welcome.color} onChange={W('color')} />
            <small>Variables : {'{user} {username} {server} {count}'}</small><br /><br />
            <button style={S.btn} onClick={async () => { const r = await api('/api/welcome', welcome); flash(r.error ? '❌ ' + r.error : '✅ Enregistré'); }}>Enregistrer</button>
          </div>
          <div><h3>Aperçu</h3><Preview content={sample(welcome.content)} title={sample(welcome.title)} description={sample(welcome.description)} color={welcome.color} image={welcome.image} /></div>
        </div>
      )}

      {tab === 'ann' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.card}>
            <ChannelSelect data={data} value={ann.channelId} onChange={(v) => setAnn({ ...ann, channelId: v })} />
            <input style={S.input} placeholder="Texte au-dessus (optionnel)" value={ann.content} onChange={A('content')} />
            <input style={S.input} placeholder="Titre" value={ann.title} onChange={A('title')} />
            <textarea style={{ ...S.input, height: 120 }} placeholder="Texte (Markdown accepté)" value={ann.description} onChange={A('description')} />
            <input style={S.input} placeholder="URL d'image" value={ann.image} onChange={A('image')} />
            <input style={S.input} placeholder="Pied de page" value={ann.footer} onChange={A('footer')} />
            <input style={S.input} placeholder="#5865F2" value={ann.color} onChange={A('color')} />
            <button style={S.btn} onClick={async () => { const r = await api('/api/send', ann); flash(r.error ? '❌ ' + r.error : '✅ Envoyé'); }}>Envoyer</button>
          </div>
          <div><h3>Aperçu</h3><Preview {...ann} /></div>
        </div>
      )}
    </div>
  );
}
