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

// Telegram native slideshow: arrows and dots are drawn by the Telegram client.
export async function sendImages(chat_id, info) {
  const images = info.images;
  if (!images?.length) throw new Error('Rasmlar topilmadi');
  const caption = await mediaCaption(info);
  if (images.length === 1) return sendPhoto(chat_id, images[0], caption);

  const media = images.map((url, index) => ({
    id: `slide_${index}`,
    media: { type: 'photo', media: url }
  }));
  const slides = media.map(item => `<img src="tg://photo?id=${item.id}"/>`).join('');
  const rich_message = {
    html: `<tg-slideshow>${slides}<figcaption>${caption.replace(/\n/g, '<br/>')}</figcaption></tg-slideshow>`,
    media
  };
  try {
    return await api.sendRichMessage({ chat_id, rich_message });
  } catch (e) {
    // Retry only failed URL downloads, not permission, rate-limit or format errors.
    if (!(e instanceof BotApiError) || e.code !== 400 ||
        !/failed to get.*(?:url|content)|wrong (?:file|http url)|webpage_curl_failed|failed to fetch/i.test(e.description || e.message)) throw e;
    for (let index = 0; index < images.length; index++) {
      media[index].media.media = await download(images[index], `slide-${index + 1}.jpg`, 'image/jpeg');
    }
    return await api.sendRichMessage({ chat_id, rich_message });
  }
}
