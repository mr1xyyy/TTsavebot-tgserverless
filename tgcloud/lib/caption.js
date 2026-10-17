import { api } from 'sdk';

const escape = (value) => String(value || '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
let username;

export async function mediaCaption(info) {
  if (!username) username = (await api.getMe()).username;
  const description = [info.author && `\u{1F464} ${info.author}`, info.title].filter(Boolean).join('\n').slice(0, 750);
  const footer = [username && `@${escape(username)}`, info.url && `<a href="${escape(info.url)}">Link</a>`].filter(Boolean).join(' | ');
  return [escape(description), footer].filter(Boolean).join('\n\n');
}
