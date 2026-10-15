import { table, integer, text, sql } from 'sdk/db';

// callback_data 64 baytdan oshmasligi uchun havolani bazada saqlaymiz
export const links = table('links', {
  id:      integer('id').primaryKey({ autoIncrement: true }),
  url:     text('url').notNull(),
  created: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
