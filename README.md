# TikTok yuklovchi bot

Telegram Serverless uchun TikTok video, rasm va audiolarini yuklovchi bot hamda Mini App. Frontend oddiy HTML, CSS va JavaScript bilan yozilgan; alohida build talab qilmaydi.

## Imkoniyatlar

- TikTok havolasidan video, rasmlar va audioni olish.
- Bot chatida media turini tugmalar orqali tanlash. Fayllar yuborilgach, tanlash xabari o‘chiriladi.
- Rasmlarni 10 tagacha albomlarga bo‘lib yuborish; izoh faqat oxirgi rasmga qo‘shiladi.
- Telefon va kompyuterga mos Mini App, media nisbatini saqlovchi ko‘rinish va animatsiyali slaydlar.
- Mini App’dan bitta rasmni, barcha rasmlarni, video yoki audioni botga yuborish. Muvaffaqiyatli yuborilgach ilova yopiladi.

## O‘rnatish

Node.js va npm o‘rnatilgan bo‘lishi kerak.

1. @BotFather → botingiz → Serverless orqali xizmatni yoqing va CLI Access tokenini oling. Bu odatiy Bot API tokenidan alohida token.
2. Loyiha papkasida quyidagi buyruqlarni bajaring:

   ```powershell
   npm install
   npm run cloud:login
   ```

   So‘ralganda CLI Access tokenini terminalga kiriting.

3. Loyihani cloud’ga yuboring:

   ```powershell
   npm run cloud:push
   ```

4. Chiqqan Mini App manzilini `tgcloud/lib/config.js` ichidagi `APP_URL` ga yozing. Namunaviy `https://app123456.tgcloud.ai/` manzilini o‘z manzilingiz bilan almashtiring.
5. Yangilangan sozlamani yuboring va baza sxemasini qo‘llang:

   ```powershell
   npm run cloud:push
   npm run cloud:migrate
   ```

6. @BotFather orqali Mini App / Menu Button URL sifatida shu manzilni sozlang.
7. Telegram’da botga `/start` yuboring, keyin TikTok havolasi bilan sinab ko‘ring.

CLI kirish ma’lumotlari saqlanadigan `.tgcloud/` papkasi `.gitignore` ga kiritilgan. Tokenni kodga yoki README’ga yozmang.

## Foydalanish

Botga TikTok havolasini yuboring va Video, Rasmlar yoki Audio tugmasini bosing. Mini App’ni bot menyusidan yoki `/start` xabaridagi Web App tugmasidan oching. Media natijasi xabarida alohida Web App tugmasi yo‘q.

Mini App’da havolani kiriting, **Qidirish** tugmasini bosing va kerakli yuborish amalini tanlang. Rasmlarni surish yoki yon tugmalar orqali almashtirish mumkin. Bot fayllarni yubora olishi uchun avval uning chatida `/start` bosing.

## Buyruqlar

| Buyruq | Vazifasi |
| --- | --- |
| `npm install` | CLI va bog‘liqliklarni o‘rnatish |
| `npm run cloud:login` | Loyihani botga ulash |
| `npm run cloud:status` | Mahalliy o‘zgarishlar holatini ko‘rish |
| `npm run cloud:push` | Bot kodi va frontendni cloud’ga yuborish |
| `npm run cloud:migrate` | Baza sxemasidagi o‘zgarishlarni qo‘llash |

Frontend yoki bot kodini o‘zgartirgach `npm run cloud:push` bajaring. Baza sxemasi o‘zgarsa, `npm run cloud:migrate` ham bajaring. Frontendni tekshirish uchun Mini App’ni yopib qayta oching.

## Loyiha tuzilishi

```text
public/index.html                  Mini App interfeysi, uslublari va slaydlar
tgcloud/handlers/message.js        Xabarlar, /start va /help
tgcloud/handlers/callback_query.js  Bot tugmalarini qayta ishlash
tgcloud/endpoints/resolve.js       Mini App uchun media ma’lumotlari
tgcloud/endpoints/send.js          Mini App’dan fayl yuborish
tgcloud/lib/tiktok.js              TikTok havolalari va TikWM so‘rovlari
tgcloud/lib/send.js                Video, audio, rasm va albom yuborish
tgcloud/lib/config.js              Mini App manzili
tgcloud/schema.js                  Havolalarni saqlovchi baza sxemasi
tgcloud.jsonc                     public/ papkasini hosting qilish sozlamasi
```

## Muammolarni tekshirish

- **`package.json` topilmadi:** buyruqni loyiha ildizida, `package.json` joylashgan papkada bajaring.
- **`tgcloud` topilmadi:** `npm install` bajaring va `npm run cloud:...` buyruqlaridan foydalaning.
- **Mini App ochilmayapti:** `APP_URL` va BotFather’dagi URL cloud bergan manzilga mosligini tekshiring.
- **Baza jadvali bilan xatolik:** `npm run cloud:migrate` bajaring.
- **Media topilmadi:** havolani tekshiring va qayta urinib ko‘ring. Media olish TikWM tashqi xizmatiga bog‘liq.

`public/index.html` faylini oddiy brauzerda ochish interfeysni ko‘rishga yordam beradi. Qidirish va botga yuborish amallari Telegram Mini App muhiti hamda deploy qilingan Serverless endpointlarini talab qiladi.
