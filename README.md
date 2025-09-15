# Fyndra Telegram Mini App (Static Web Mini App)

This is a static Telegram Mini App (web app) that simulates the "Fyndra Miner" UI and can be opened inside Telegram via a bot button.

**One-time password for login (hardcoded):** `KP!9vX7zQ`

## Files
- `index.html` — Main app (includes login screen, miner UI, settings).
- `app.js` — JavaScript logic for UI, timer, wallet generation, Telegram WebApp hooks.
- `styles.css` — Basic styling.
- `assets/logo.png` — Placeholder file (replace with a real logo).
- `README.md` — This file.

## How to use
1. Host the contents of this folder on any HTTPS-capable static host (Vercel, Netlify, GitHub Pages).
2. In BotFather, set your domain and use a button with web_app url to open the app inside Telegram. Example server-side bot code (python-telegram-bot v20+):

```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler

BOT_TOKEN = "YOUR_BOT_TOKEN"

async def start(update, context):
    keyboard = [
        [InlineKeyboardButton("🚀 Open Fyndra", web_app={"url": "https://your-host/your-path/index.html"})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Welcome! Click below to launch Fyndra:", reply_markup=reply_markup)

app = Application.builder().token(BOT_TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.run_polling()
```

3. When the app opens it shows a **login screen** — enter the password above to access the miner UI.
4. Use Settings to set **starting elapsed** and **target seconds** (when a wallet will be "found").
5. When the target time is reached the miner stops, shows the found wallet & balance. Click the wallet to copy the full address.

## Notes / Security
- The password is stored in client-side JS. This is a demo convenience — **not secure**. For production, implement server-side authentication.
- The app generates fake wallet-like strings locally and does not interact with any blockchain or external systems.
