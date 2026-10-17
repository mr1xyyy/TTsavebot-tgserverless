import { fetch } from 'sdk';

const HOST = 'https://www.tikwm.com';

export function extractUrl(text) {
  const m = String(text || '').match(/https?:\/\/[^\s]+/i);
  if (!m) return null;
  const url = m[0].replace(/[)\].,!?]+$/, '');
  return /^https?:\/\/([a-z0-9-]+\.)*tiktok\.com(\/|\?|$)/i.test(url) ? url : null;
}

const abs = (u) => (u && u.startsWith('/') ? HOST + u : u);

export async function getInfo(url) {
  const res = await fetch(`${HOST}/api/?hd=1&url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('TikTok xizmati javob bermadi');
  const j = await res.json();
  if (j.code !== 0 || !j.data) throw new Error(j.msg || 'Video topilmadi');
  const d = j.data;
  const images = (d.images || []).map(abs);
  return {
    url,
    type: images.length ? 'slides' : 'video',
    id: d.id,
    title: d.title || '',
    author: (d.author && (d.author.nickname || d.author.unique_id)) || '',
    cover: abs(d.cover),
    duration: d.duration || 0,
    video: abs(d.hdplay || d.play),
    audio: abs(d.music),
    images,
  };
}
