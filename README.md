# Usta Bot

## Loyihaning tavsifi
Usta Bot - bu Telegram bot bo‘lib, mijozlarga o‘z hududidagi ustalarni topishga yordam beradi. Bot ustalarni reyting, lokatsiya va ism bo‘yicha qidirish imkoniyatini taqdim etadi.

## Funktsiyalar
- Mijozlar ustalarni **reyting** bo‘yicha topishi mumkin
- **Lokatsiya** asosida yaqin atrofdagi ustalarni qidirish
- **Ism bo‘yicha qidirish** funksiyasi
- Har bir usta haqida batafsil ma’lumot (ism, tajriba, sharhlar)
- Mijozlar ustalarni baholash imkoniyatiga ega

## Texnologiyalar
- **Node.js** – botning backend qismi
- **Telegraf** – bot bilan ishlash
- **PostgreSQL** – ma’lumotlarni saqlash

## O‘rnatish va ishlatish

1. Loyihani yuklab oling:
   ```bash
   git clone https://github.com/username/usta-bot.git
   cd usta-bot
   ```

2. Kerakli kutubxonalarni o‘rnating:
   ```bash
   npm install
   ```

3. `.env` faylini to‘ldiring:
   ```env
   BOT_TOKEN=your-telegram-bot-token
   DATABASE_URL=your-database-url
   ```

4. Botni ishga tushuring:
   ```bash
   npm start
   ```

## Muallif
**Rustam Bozorov**
- [Telegram](https://t.me/Rustam_Uktamovich)
- [GitHub](https://github.com/RustamDevel0per)

