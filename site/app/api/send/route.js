import { discord, isAuthed, deny } from '@/lib/server';
export async function POST(req) {
  if (!isAuthed()) return deny();
  const { channelId, content, title, description, color, image, footer } = await req.json();
  if (!/^\d+$/.test(channelId || '')) return Response.json({ error: 'Salon invalide' }, { status: 400 });
  const embed = { description: description || undefined, title: title || undefined, footer: footer ? { text: footer } : undefined,
    color: parseInt((/^#[0-9a-f]{6}$/i.test(color) ? color : '#5865F2').slice(1), 16),
    image: /^https?:\/\//.test(image || '') ? { url: image } : undefined };
  try {
    await discord(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({
      content: content || undefined, embeds: [embed], allowed_mentions: { parse: [] } }) });
    return Response.json({ ok: true });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
