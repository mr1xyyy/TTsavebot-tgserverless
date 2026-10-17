import { api, fetch, InputFile, BotApiError } from 'sdk';

import { mediaCaption } from './caption.js';

// URL orqali yuborib bo'lmasa, baytlarni yuklab olib fayl sifatida yuboramiz
async function download(url, name, type) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Yuklab olib bo‘lmadi: ' + res.status);
  const parts = [];
  let total = 0;
  for await (const c of res.body) { parts.push(c); total += c.length; }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of parts) { out.set(c, o); o += c.length; }
  return new InputFile(out, name, { type });
}

async function withFallback(method, field, url, name, type, extra) {
  try {
    return await api[method]({ ...extra, [field]: url });
  } catch (e) {
    if (!(e instanceof BotApiError) || e.code === 403) throw e;
    return await api[method]({ ...extra, [field]: await download(url, name, type) });
  }
}

export async function sendVideo(chat_id, info) {
  return withFallback('sendVideo', 'video', info.video, `${info.id}.mp4`, 'video/mp4',
    { chat_id, caption: await mediaCaption(info), parse_mode: 'HTML', supports_streaming: true });
}

export async function sendAudio(chat_id, info) {
  const audio = await download(info.audio, 'Audio.mp4', 'audio/mp4');
  return api.sendAudio({ chat_id, audio, title: 'Audio.mp4', performer: info.author });
}

export function sendPhoto(chat_id, url, caption) {
  return withFallback('sendPhoto', 'photo', url, 'slide.jpg', 'image/jpeg', { chat_id, caption, parse_mode: 'HTML' });
}

export async function sendImages(chat_id, info) {
  const imgs = info.images;
  const finalCaption = await mediaCaption(info);
  for (let i = 0; i < imgs.length; i += 10) {
    const chunk = imgs.slice(i, i + 10);
    const caption = i + chunk.length === imgs.length ? finalCaption : undefined;
    if (chunk.length === 1) { await sendPhoto(chat_id, chunk[0], caption); continue; }
    try {
      await api.sendMediaGroup({
        chat_id,
        media: chunk.map((m, k) => ({ type: 'photo', media: m, ...(k === chunk.length - 1 && caption ? { caption, parse_mode: 'HTML' } : {}) })),
      });
    } catch (e) {
      if (!(e instanceof BotApiError) || e.code === 403) throw e;
      for (let k = 0; k < chunk.length; k++) await sendPhoto(chat_id, chunk[k], k === chunk.length - 1 ? caption : undefined);
    }
  }
}
