import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { links } from '../schema.js';
import { getInfo } from '../lib/tiktok.js';
import { sendVideo, sendAudio, sendImages } from '../lib/send.js';

export default async function (cb) {
  const chat_id = cb.message.chat.id;
  const [kind, id] = (cb.data || '').split(':');
  await api.answerCallbackQuery({ callback_query_id: cb.id, text: '⏳ Yuklanmoqda...' });

  try {
    const row = await db.select().from(links).where(eq(links.id, Number(id))).get();
    if (!row) throw new Error('Havola eskirgan, qaytadan yuboring');
    const info = await getInfo(row.url);

    if (kind === 'v') await sendVideo(chat_id, info);
    else if (kind === 'a') await sendAudio(chat_id, info);
    else if (kind === 'i') await sendImages(chat_id, info);
    else return;

    try {
      await api.deleteMessage({ chat_id, message_id: cb.message.message_id });
    } catch (e) {
      // Fayllar yuborilgan bo'lsa, eski xabarni o'chirish xatosini ko'rsatmaymiz.
    }
  } catch (e) {
    await api.sendMessage({ chat_id, text: '❌ ' + (e.description || e.message) });
  }
}
