import { EndpointError, BotApiError } from 'sdk';
import { extractUrl, getInfo } from '../lib/tiktok.js';
import { sendVideo, sendAudio, sendImages, sendPhoto } from '../lib/send.js';

// kind: 'video' | 'audio' | 'images' (hammasi) | 'image' (bitta, index bilan)
export default async function (input, ctx) {
  const chat_id = ctx.initData.user.id;
  const url = extractUrl(input.url);
  if (!url) throw new EndpointError('Havola noto‘g‘ri', { code: 'BAD_URL' });

  try {
    const info = await getInfo(url);
    if (input.kind === 'video' && info.type === 'video') await sendVideo(chat_id, info);
    else if (input.kind === 'audio') await sendAudio(chat_id, info);
    else if (input.kind === 'images') await sendImages(chat_id, info);
    else if (input.kind === 'image') await sendPhoto(chat_id, info.images[input.index || 0]);
    else throw new EndpointError('Bu format mavjud emas', { code: 'BAD_KIND' });
    return { ok: true };
  } catch (e) {
    if (e instanceof EndpointError) throw e;
    if (e instanceof BotApiError && (e.code === 403 || /chat not found/i.test(e.description))) {
      throw new EndpointError('Avval botda /start bosing', { code: 'START_BOT' });
    }
    throw new EndpointError(e.description || e.message, { code: 'SEND_FAILED' });
  }
}
