import { api, fetch, InputFile, BotApiError } from 'sdk';

const cap = (info) =>
  [info.author && `👤 ${info.author}`, info.title].filter(Boolean).join('\n').slice(0, 1000);

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

export function sendVideo(chat_id, info) {
  return withFallback('sendVideo', 'video', info.video, `${info.id}.mp4`, 'video/mp4',
    { chat_id, caption: cap(info), supports_streaming: true });
}

export function sendAudio(chat_id, info) {
  return withFallback('sendAudio', 'audio', info.audio, `${info.id}.mp3`, 'audio/mpeg',
    { chat_id, title: info.title.slice(0, 60) || 'TikTok audio', performer: info.author });
}

export function sendPhoto(chat_id, url, caption) {
  return withFallback('sendPhoto', 'photo', url, 'slide.jpg', 'image/jpeg', { chat_id, caption });
}

export async function sendImages(chat_id, info) {
  const imgs = info.images;
  for (let i = 0; i < imgs.length; i += 10) {
    const chunk = imgs.slice(i, i + 10);
    const caption = i + chunk.length === imgs.length ? cap(info) : undefined;
    if (chunk.length === 1) { await sendPhoto(chat_id, chunk[0], caption); continue; }
    try {
      await api.sendMediaGroup({
        chat_id,
        media: chunk.map((m, k) => ({ type: 'photo', media: m, ...(k === chunk.length - 1 && caption ? { caption } : {}) })),
      });
    } catch (e) {
      if (!(e instanceof BotApiError) || e.code === 403) throw e;
      for (let k = 0; k < chunk.length; k++) await sendPhoto(chat_id, chunk[k], k === chunk.length - 1 ? caption : undefined);
    }
  }
}
