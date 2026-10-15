import { EndpointError } from 'sdk';
import { extractUrl, getInfo } from '../lib/tiktok.js';

export default async function (input) {
  const url = extractUrl(input.url);
  if (!url) throw new EndpointError('TikTok havolasi noto‘g‘ri', { code: 'BAD_URL' });
  try {
    return { ...(await getInfo(url)), url };
  } catch (e) {
    throw new EndpointError(e.message, { code: 'NOT_FOUND' });
  }
}
