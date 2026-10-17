import { mediaCaption } from '../lib/caption.js';
import { api, db } from 'sdk';
import { links } from '../schema.js';
import { APP_URL } from '../lib/config.js';
import { extractUrl, getInfo } from '../lib/tiktok.js';

export default async function (message) {
  const chat_id = message.chat.id;
  const text = message.text || '';

  if (text.startsWith('/start') || text.startsWith('/help')) {
    return api.sendMessage({
      chat_id,
      text: '👋 TikTok havolasini yuboring — video, rasmli slayd yoki GIF’ni yuklab beraman.\n\nQulay ko‘rish uchun Web App’ni oching.',
      reply_markup: { inline_keyboard: [[{ text: '🌐 Web App', web_app: { url: APP_URL } }]] },
    });
  }

  const url = extractUrl(text);
  if (!url) {
    return api.sendMessage({ chat_id, text: '🔗 TikTok havolasini yuboring (tiktok.com yoki vm.tiktok.com).' });
  }

  const wait = await api.sendMessage({ chat_id, text: '⏳ Qidirilmoqda...' });
  let info;
  try {
    info = await getInfo(url);
  } catch (e) {
    return api.editMessageText({ chat_id, message_id: wait.message_id, text: '❌ ' + e.message });
  }

  const [row] = await db.insert(links).values({ url }).returning().run();
  const first = info.type === 'slides'
    ? { text: `🖼 Rasmlar (${info.images.length})`, callback_data: `i:${row.id}` }
    : { text: '🎬 Video', callback_data: `v:${row.id}` };

  const reply_markup = {
    inline_keyboard: [
      [first, { text: '🎵 Audio', callback_data: `a:${row.id}` }],
    ],
  };
  const caption = await mediaCaption(info);

  try {
    await api.sendPhoto({ chat_id, photo: info.cover, caption, parse_mode: 'HTML', reply_markup });
  } catch (e) {
    await api.sendMessage({ chat_id, text: caption, parse_mode: 'HTML', reply_markup });
  }
  try { await api.deleteMessage({ chat_id, message_id: wait.message_id }); } catch (e) {}
}
