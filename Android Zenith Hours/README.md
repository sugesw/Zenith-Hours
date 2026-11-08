<a id="top"></a>

<div align="center">

# 🎮 Zenith Hours

**Steam Hour & Card Idler · Steam Saat & Kart Kasma Botu**

**Multi-account · Live terminal panel · Windows / Linux / macOS / Termux**
**Çoklu hesap · Canlı terminal paneli · Windows / Linux / macOS / Termux**

`v3.2` &nbsp;|&nbsp; Node.js ≥ 18

**Owner / Creator: Sugesw / Exufo**

[🇬🇧 English](#-english) &nbsp;•&nbsp; [🇹🇷 Türkçe](#-türkçe)

🔒 [Privacy Policy](#12-privacy-policy) &nbsp;•&nbsp; [Gizlilik Politikası](#12-gizlilik-politikası) &nbsp;•&nbsp; [PRIVACY.md](PRIVACY.md)

</div>

---

<a id="-english"></a>

# 🇬🇧 English

## Table of contents

1. [What is it?](#1-what-is-it)
2. [Features](#2-features)
3. [Requirements](#3-requirements)
4. [Installation](#4-installation)
5. [Logging in](#5-logging-in)
6. [Using the panel](#6-using-the-panel)
7. [Command-line options](#7-command-line-options)
8. [Configuration](#8-configuration)
9. [Starting and stopping on Windows](#9-starting-and-stopping-on-windows)
10. [Troubleshooting](#10-troubleshooting)
11. [Ban risk and safety](#11-ban-risk-and-safety)
12. [Privacy Policy](#12-privacy-policy)
13. [Disclaimer](#13-disclaimer)
14. [Credits](#14-credits)

## 1. What is it?

**Zenith Hours** signs in to your Steam account(s) and tells Steam that you are "playing" a list of games. Steam then counts playtime for those games and, for games that have trading cards, can drop cards while you idle. **No game is downloaded or launched**, so it uses almost no CPU, RAM or bandwidth.

The bot talks to Steam the same way the official client does, through the open-source [`steam-user`](https://www.npmjs.com/package/steam-user) and [`steam-session`](https://www.npmjs.com/package/steam-session) libraries.

## 2. Features

- **Multiple accounts** at the same time, each with its own Steam connection.
- **Up to 32 games per account** (Steam's limit). The list starts **empty** – you choose which games to idle.
- **Per-account game lists.** Add or remove games by AppID while the bot runs; changes apply instantly and are saved automatically.
- **Three login methods:** QR code (recommended), username + password (+ Steam Guard), or refresh token.
- **Live terminal panel** with status, idle time and earned game-hours for each account.
- **Automatic recovery:** reconnects after disconnects, backs off on errors, and waits when Steam rate-limits you.
- **Pauses automatically** if you start playing a real game on the same account, and resumes when you are done.
- **Ownership check** (`--kontrol`): reports which games are not in your library (those do not earn hours).
- **Termux support:** keeps the phone awake with a wake-lock so it keeps running with the screen off.
- **Guns.lol page** in the main menu (`[g]`) with the creators' links.

## 3. Requirements

| Requirement | Details |
|---|---|
| Node.js | Version 18 or newer (LTS recommended) – https://nodejs.org |
| Internet | Needed for `npm install` (once) and while the bot runs |
| Steam account | Games must be in the account's library (owned, or free-to-play games that were added) |
| Steam Guard | Recommended. The QR login uses your Steam mobile app |

## 4. Installation

### 🪟 Windows

1. **Install Node.js** (LTS) from https://nodejs.org and finish the installer.
2. **Extract the ZIP** to a folder of your choice (for example the Desktop). Keep all files together in the same folder.
3. **Install the dependencies (one time only):** open the folder, click the address bar, type `cmd` and press Enter. In the window that opens, run:
   ```bash
   npm install
   ```
   Wait until it finishes. You can close this window afterwards.
4. **Start the bot:** double-click `ZenithHours_Baslat.vbs` (or run `node index.js` in the folder).
5. On the first run the bot asks how you want to sign in – see [Logging in](#5-logging-in).
6. **Add your games.** The list is empty at first – see [Adding your games](#adding-your-games). Idling starts as soon as you add the first AppID.

### 📱 Android (Termux)

**You need:** an Android phone, the **Termux** app and an internet connection. Install Termux from **F-Droid** or the official GitHub releases (`termux/termux-app`) – very old Play Store builds may not be able to install packages.

#### Option A – one command *(recommended – no long code to type)*

1. Open Termux and paste this single line:
   ```bash
   pkg install -y curl && curl -fsSL https://raw.githubusercontent.com/SugeswChr/Zenith-Hours/main/Android/android-install.sh | bash
   ```

   The installer sets up Node.js, downloads `index.js` and `package.json` from GitHub into `~/ZenithHours`, installs the dependencies and creates two shortcut commands.
2. **Start the bot:**
   ```bash
   zenith
   ```
3. Sign in (QR is easiest) and add your games – see [Logging in](#5-logging-in) and [Adding your games](#adding-your-games).
4. **Update later** (new code from GitHub):
   ```bash
   zenith-guncelle
   ```

**What stays on your phone:** your login, refresh token and game lists live in `~/ZenithHours/hesaplar.json` on **your** device. The installer/updater only downloads code files – it never reads, replaces, deletes or uploads `hesaplar.json`.

> ⚠️ The updater downloads and runs code from the GitHub repository. Only use the **official** repository link.

#### Option B – move the ZIP to your phone manually

1. Get `ZenithHours.zip` onto the phone: download it, send it to yourself (Telegram "Saved Messages", Google Drive, WhatsApp…) or copy it with a USB cable. It usually ends up in the **Download** folder.
2. In Termux run these lines one by one:
   ```bash
   termux-setup-storage                 # tap "Allow" on the popup (only once)
   pkg update && pkg install -y nodejs unzip
   cp ~/storage/downloads/ZenithHours.zip ~/
   unzip ZenithHours.zip -d ZenithHours
   cd ZenithHours
   npm install
   node index.js
   ```
   If the file has a different name (for example `ZenithHours (1).zip`), run `ls ~/storage/downloads` to see it, then use the name in quotes: `cp ~/storage/downloads/"ZenithHours (1).zip" ~/ZenithHours.zip`.
3. Next time, start it with:
   ```bash
   cd ~/ZenithHours && node index.js
   ```

#### Termux basics – opening and editing files

Termux keeps your files in its own private home folder (`~`), which the normal Files app cannot see. Use these commands:

| Command | What it does |
|---|---|
| `ls` | List files in the current folder |
| `cd ZenithHours` | Enter the `ZenithHours` folder (`cd ~` goes home, `cd ..` goes up) |
| `pwd` | Show where you are |
| `cat README.md` | Print a file on screen |
| `pkg install nano` then `nano index.js` | Open a file for editing (save: `CTRL+O`, `Enter` – exit: `CTRL+X`) |
| `cp hesaplar.json ~/storage/downloads/` | Copy a file out to your phone's Download folder (**backup – keep it private!**) |

#### Keeping it running on Android

- Keep Termux open. The bot asks Termux for a **wake-lock**, so it keeps running with the screen off.
- In Android settings, set Termux's battery usage to **Unrestricted / Don't optimise** and lock it in the recent-apps list. Some phones kill background apps aggressively otherwise.
- Prefer plain logs? Start with `zenith --sade`.
- Stop the bot with `q` (or `CTRL+C`) inside Termux.

### 🐧 Linux / 🍎 macOS

```bash
unzip ZenithHours.zip -d ZenithHours
cd ZenithHours
npm install
node index.js
```

To keep it running on a server, use `tmux` or `screen` and start it in plain-log mode:

```bash
node index.js --sade
```

> **Tip:** when there is no interactive terminal (for example `nohup`), the bot cannot ask for a login. Sign in once interactively, or use `--token <TOKEN>`.

## 5. Logging in

On the first run (or when you press `[a]` in the main menu) you can choose:

| # | Method | Notes |
|---|---|---|
| 1 | **QR code** *(recommended)* | Open the Steam mobile app → Steam Guard → scan the QR code and approve. No password or code is typed on the PC. |
| 2 | **Username + password** | Steam Guard code is requested if needed. Your password is only used to sign in and is **never saved**. |
| 3 | **Refresh token** | Paste a token obtained on another device (`--sadece-giris` creates one). |

After a successful login a long-lived refresh token is stored in `hesaplar.json`, so the next start signs in automatically. If a saved login ever expires, the account is removed from the list and you can simply add it again.

## 6. Using the panel

### Adding your games

The bot does **not** come with a game list – you add the games you want, per account. It takes less than a minute:

1. Start the bot and wait until the account shows up in the main menu.
2. Press **`s`** (select account), then press the account's number (for example **`1`**).
3. Press **`e`** (add game).
4. Type one or more **AppIDs** and press Enter. Separate several IDs with spaces or commas, for example:
   ```
   730 570 440
   ```
5. Done. Idling starts immediately for the whole list, and the list is **saved automatically** – you only do this once. The bot remembers it the next time you start it.

**How to find an AppID:** open the game's Steam store page – the number in the address is the AppID (`store.steampowered.com/app/`**`730`**`/Counter-Strike_2/`). Sites like [SteamDB](https://steamdb.info) also show it.

| Example AppID | Game |
|---|---|
| `730` | Counter-Strike 2 |
| `570` | Dota 2 |
| `440` | Team Fortress 2 |

**Good to know**

- The game must be **in the account's library** (bought, or a free-to-play game that was added to the account). Otherwise it earns no hours – check with `node index.js --kontrol`.
- Maximum **32 games per account**; extra IDs are ignored with a warning.
- Each account has its **own list**. Switch accounts with `1`–`9` / `n` / `p` on the account screen and add games to each one.
- Remove games with **`r`** (specific AppIDs) or **`x`** (everything). Changes apply instantly.
- While the list is empty the account shows `OYUN YOK` (no games) and nothing is idled.

**Main menu**

| Key | Action |
|---|---|
| `s` | Select an account |
| `a` | Add an account |
| `d` | Delete an account |
| `g` | **guns.lol** – owner pages with "go to site" options (see below) |
| `q` | Quit (all accounts are signed off cleanly) |

**guns.lol screen** (`g`)

```
[1] Owner 1 - Sugesw  siteye git
    https://guns.lol/sugws
[2] Owner 2 - Exufo   siteye git
    https://guns.lol/exufo
[m] ana menu
```

| Key | Action |
|---|---|
| `1` | **Go to site** – opens Owner 1's page (Sugesw) in your default browser |
| `2` | **Go to site** – opens Owner 2's page (Exufo) in your default browser |
| `m` | Back to the main menu |

If no browser can be opened (for example on a headless server), the link is shown on screen so you can open it manually.

**Account screen**

| Key | Action |
|---|---|
| `1`–`9`, `n`, `p` | Switch between accounts |
| `e` | Add game(s) by AppID (separate several with spaces or commas) |
| `r` | Remove game(s) by AppID |
| `x` | Remove all games from this account |
| `l` | Next page of the game list |
| `m` | Back to the main menu |

Status labels: `BAGLANIYOR` connecting · `KASIYOR` idling · `DURAKLADI` paused (you are playing elsewhere) · `YENIDEN BAG.` reconnecting · `BEKLIYOR` waiting before retry · `OYUN YOK` no games in the list.

You can find any game's AppID in its Steam store URL: `store.steampowered.com/app/`**`730`**`/`.

## 7. Command-line options

| Command | Description |
|---|---|
| `node index.js` | Normal start – all saved accounts with the live panel |
| `node index.js --sade` | Plain log output, no panel |
| `node index.js --liste` | Print each saved account's game list with game names, then exit |
| `node index.js --hesap-ekle` | Add a new account at startup, then idle all accounts |
| `node index.js --sifirla` | Delete **all** saved accounts and start fresh |
| `node index.js --token <TOKEN>` | Add an account with a refresh token (no password / 2FA) |
| `node index.js --sadece-giris` | Add an account, save/print its token and exit (useful on a PC) |
| `node index.js --kontrol` | Report which configured games are missing from the account |
| `node index.js --yardim` | Show help |

Other options: `NO_COLOR=1` disables colours; `STEAM_REFRESH_TOKEN=<token>` adds a token from the environment.

## 8. Configuration

**Game lists:** use `e` / `r` / `x` in the panel (see [Adding your games](#adding-your-games)). Each account's list is saved in `hesaplar.json` under that account's `games` field.

**Optional starting list for new accounts:** the built-in list is empty. If you want every *new* account to start with the same games, put their AppIDs into the `RAW_GAMES` array near the top of `index.js`, for example `const RAW_GAMES = [730, 570];` (max 32, duplicates are removed automatically).

**Updating from an older version:** earlier versions shipped a 28-game default list. Accounts that were using that default now start with an empty list – add your games again with `e`. Accounts that already had their own custom list keep it.

**Files created by the bot**

| File | Purpose |
|---|---|
| `hesaplar.json` | Saved accounts: refresh token, account name, SteamID64 and optional custom game list. **Treat it like a password.** |
| `oyun_isimleri.json` | Cache of game names downloaded from the Steam store |
| `steam_session.json` | Legacy file from old versions; migrated automatically and then removed |

## 9. Starting and stopping on Windows

- **`ZenithHours_Baslat.vbs`** opens the bot in a console window. **Keep that window open** (you can minimise it) – closing the window stops the bot. You can place a shortcut to this file on the Desktop.
- **`ZenithHours_Kapat.vbs`** stops the bot by ending **every** `node.exe` process on the computer. If you run other Node.js programs, close the bot with `q` or `Ctrl+C` in its window instead.
- Windows Defender or an antivirus may warn about `.vbs` files because that file type is often abused. These two files are short plain-text scripts – open them in Notepad to see exactly what they do.

## 10. Troubleshooting

| Problem | Solution |
|---|---|
| `'npm' is not recognized` / `'node' is not recognized` | Node.js is not installed or the terminal was opened before the install. Install Node.js and open a new window. |
| `Cannot find module 'steam-user'` | Run `npm install` in the bot folder. |
| *Account is playing elsewhere* → `DURAKLADI` | Steam allows one active play session per account. Idling resumes automatically when the other session ends. |
| *Account logged in elsewhere* | The bot waits 5 minutes and tries again. |
| *Rate limit / too many attempts* | Steam limits logins per IP. All accounts wait 30 minutes automatically. Avoid restarting the bot repeatedly. |
| *Saved login is invalid / expired* | The account is removed. Press `a` and add it again. |
| Account shows `OYUN YOK` / nothing is idled | The game list is empty. Press `s` → account number → `e` and add AppIDs (see [Adding your games](#adding-your-games)). |
| Hours do not increase | Run `node index.js --kontrol`. Games that are not in your library do not earn hours. Steam can also take a while to refresh the numbers on your profile. |
| No cards dropped | Only games with trading cards enabled can drop cards, and only while drops remain. Idling does not guarantee drops. |
| Panel looks broken | Enlarge the terminal window, or use `--sade`. |
| Windows console freezes | Clicking inside the console can pause it (QuickEdit). Press `Enter` or `Esc`, and disable QuickEdit mode in the console properties. |

## 11. Ban risk and safety

We want to be honest with you: **there is no way to promise that an account can never be penalised.** Please read this section before using the bot.

**What the bot does *not* do**

- It does not start, modify or inject into any game, and it does not touch game files or game memory. **VAC (Valve Anti-Cheat) is not involved** because no game process ever runs.
- It does not trade, sell, send gifts, use the Steam Market, read your inventory or chat, or add friends.
- It does not scrape Steam; it only reports the "now playing" list through the standard client protocol.

**What you should still know**

- **Terms of use.** Valve does not officially endorse "hour boosting" tools, and the Steam Subscriber Agreement can change. Tools of this type (including well-known ones) have been used for many years, but Valve could change its stance at any time. **You use this bot at your own risk.**
- **Refunds.** Idled time counts as playtime. Games with inflated playtime are normally **no longer refundable** (Steam's refund limit is under 2 hours of playtime).
- **Fake playtime.** Do not use inflated hours to mislead others – for example in reviews, when selling or trading an account, or for servers/groups with hour requirements. This is the most realistic way to get into trouble.
- **Other people see it.** The bot sets your status to *Online*, so friends can see you as "In-Game". Use Steam's privacy settings if you do not want your game details visible.
- **Login limits.** Many logins from one IP in a short time trigger Steam's temporary rate-limit. The bot backs off automatically (30 min), but avoid restarting it again and again, and avoid running a very large number of accounts from a single connection.
- **Your credentials.** The refresh token in `hesaplar.json` gives access to your session. Never share the file, and do not upload it anywhere.

**Recommendations**

1. **Do not use your main or valuable account** if you are worried about risk.
2. Prefer **QR login** and keep **Steam Guard** enabled.
3. Do not start a real game on the same account while idling (the bot pauses itself, but keep it simple).
4. Keep the bot folder private; do not send `hesaplar.json` to anyone.
5. If you think a token leaked, change your Steam password and sign out of all devices from Steam Guard settings; this invalidates saved sessions.

## 12. Privacy Policy

*Last updated: 2026-11-08*

**In short: this program runs entirely on your own device. The creators do not operate any server, and we do not collect, receive, store, sell or share any of your data.**

**12.1 What is stored on your device**

| Data | Where | Why |
|---|---|---|
| Steam refresh token, account name, SteamID64, custom game list | `hesaplar.json` | To sign in again automatically and remember your lists |
| Game names | `oyun_isimleri.json` | To show game names without downloading them every time |

Your **password is never written to disk.** It is used only to sign in and then discarded from memory. File permissions are restricted to your user on Linux/macOS/Termux; on Windows the file is protected only by your normal user-account permissions.

**12.2 Network connections the program makes**

- **Steam servers** – to sign in and report the games you are "playing" (through the `steam-user` and `steam-session` libraries).
- **store.steampowered.com** – to look up game names by AppID.
- **npm registry** – only when you run `npm install`, to download the dependencies.
- **raw.githubusercontent.com (GitHub)** – only if you use the Android installer / updater (`android-install.sh`, `zenith-guncelle`), to download the program's code files (`index.js`, `package.json`, …). Nothing from your device is sent; `hesaplar.json` is never read or uploaded.

There are **no analytics, telemetry, advertising or tracking** features, and no connection to any server owned by the creators.

**12.3 Third parties**

Data sent to Steam is handled by Valve under the [Steam Privacy Policy](https://store.steampowered.com/privacy_agreement/). Dependencies are third-party open-source packages distributed by npm. Code downloads through the Android installer are served by GitHub under [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

**12.4 Your control**

- Remove one account: press `d` in the main menu.
- Remove all accounts: run `node index.js --sifirla` or delete `hesaplar.json`.
- Remove cached names: delete `oyun_isimleri.json`.
- Revoke a stolen/leaked session: change your Steam password and sign out of all devices.

**12.5 Children**

This software is not intended for children under the minimum age required to use Steam.

**12.6 Changes and contact**

This policy may be updated with new versions; the date above shows the latest revision. Questions can be sent to the creators through the links in [Credits](#14-credits).

## 13. Disclaimer

This project is **not affiliated with, endorsed by or sponsored by Valve Corporation or Steam.** Steam and the Steam logo are trademarks of Valve Corporation. The software is provided **"as is", without warranty of any kind.** The creators are not responsible for any penalty, restriction, ban, data loss or other damage resulting from its use. Use it responsibly and follow the rules of the platforms you use.

## 14. Credits

| Role | Name | Link |
|---|---|---|
| **Owner / Creator** | **Sugesw** | https://guns.lol/sugws |
| **Owner / Creator** | **Exufo** | https://guns.lol/exufo |

The names and links are also shown inside the program: on the start screen, in the panel header, and under **`[g] guns.lol`** in the main menu.

Built with [`steam-user`](https://www.npmjs.com/package/steam-user), [`steam-session`](https://www.npmjs.com/package/steam-session) and [`qrcode-terminal`](https://www.npmjs.com/package/qrcode-terminal).

<p align="right"><a href="#top">⬆ Back to top</a></p>

---

<a id="-türkçe"></a>

# 🇹🇷 Türkçe

## İçindekiler

1. [Nedir?](#1-nedir)
2. [Özellikler](#2-özellikler)
3. [Gereksinimler](#3-gereksinimler)
4. [Kurulum](#4-kurulum)
5. [Giriş yapma](#5-giriş-yapma)
6. [Paneli kullanma](#6-paneli-kullanma)
7. [Komut satırı seçenekleri](#7-komut-satırı-seçenekleri)
8. [Ayarlar](#8-ayarlar)
9. [Windows'ta başlatma ve kapatma](#9-windowsta-başlatma-ve-kapatma)
10. [Sorun giderme](#10-sorun-giderme)
11. [Ban riski ve güvenlik](#11-ban-riski-ve-güvenlik)
12. [Gizlilik Politikası](#12-gizlilik-politikası)
13. [Sorumluluk reddi](#13-sorumluluk-reddi)
14. [Yapımcılar](#14-yapımcılar)

## 1. Nedir?

**Zenith Hours**, Steam hesabına (hesaplarına) giriş yapar ve Steam'e bir oyun listesini "oynuyormuş" gibi bildirir. Steam de bu oyunlar için oynama süresi sayar; koleksiyon kartı olan oyunlarda kart düşmesi de sağlanabilir. **Hiçbir oyun indirilmez veya açılmaz**, bu yüzden işlemciyi, RAM'i ve interneti neredeyse hiç yormaz.

Bot, Steam ile resmi istemcinin kullandığı yöntemle, açık kaynaklı [`steam-user`](https://www.npmjs.com/package/steam-user) ve [`steam-session`](https://www.npmjs.com/package/steam-session) kütüphaneleri üzerinden konuşur.

## 2. Özellikler

- **Çoklu hesap:** aynı anda birden fazla hesap, her biri kendi Steam bağlantısıyla.
- **Hesap başına en fazla 32 oyun** (Steam sınırı). Liste **boş** başlar – hangi oyunların kasılacağını sen seçersin.
- **Hesaba özel oyun listesi:** bot çalışırken AppID ile oyun ekleyip çıkarabilirsin; değişiklik anında uygulanır ve otomatik kaydedilir.
- **Üç giriş yöntemi:** QR kod (önerilir), kullanıcı adı + şifre (+ Steam Guard) veya refresh token.
- **Canlı terminal paneli:** her hesap için durum, kasma süresi ve kazanılan oyun-saati.
- **Otomatik toparlanma:** bağlantı koparsa yeniden bağlanır, hatalarda bekleme süresini artırır, Steam hız sınırı koyarsa bekler.
- **Otomatik duraklatma:** aynı hesapla gerçek bir oyun açarsan kasma durur, oyunu kapatınca devam eder.
- **Sahiplik kontrolü** (`--kontrol`): hesapta olmayan oyunları söyler (bunlar saat kazandırmaz).
- **Termux desteği:** telefon ekranı kapalıyken de çalışsın diye wake-lock kullanır.
- **Ana menüde guns.lol sayfası** (`[g]`): yapımcıların bağlantıları.

## 3. Gereksinimler

| Gereksinim | Ayrıntı |
|---|---|
| Node.js | 18 veya üzeri sürüm (LTS önerilir) – https://nodejs.org/tr |
| İnternet | `npm install` için (bir kez) ve bot çalışırken gerekli |
| Steam hesabı | Oyunlar hesabın kütüphanesinde olmalı (satın alınmış veya kütüphaneye eklenmiş ücretsiz oyunlar) |
| Steam Guard | Önerilir. QR girişi Steam mobil uygulamanı kullanır |

## 4. Kurulum

### 🪟 Windows

1. **Node.js'i kur** (LTS): https://nodejs.org/tr adresinden indir ve kurulumu bitir.
2. **ZIP dosyasını bir klasöre çıkar** (örneğin Masaüstü). Tüm dosyaları aynı klasörde tut.
3. **Bağımlılıkları kur (sadece bir kez):** klasörü aç, adres çubuğuna tıkla, `cmd` yazıp Enter'a bas. Açılan pencerede şunu çalıştır:
   ```bash
   npm install
   ```
   İşlem bitene kadar bekle. Bittikten sonra pencereyi kapatabilirsin.
4. **Botu başlat:** `ZenithHours_Baslat.vbs` dosyasına çift tıkla (veya klasörde `node index.js` çalıştır).
5. İlk açılışta bot nasıl giriş yapmak istediğini sorar – bkz. [Giriş yapma](#5-giriş-yapma).
6. **Oyunlarını ekle.** Liste başta boştur – bkz. [Oyun ekleme](#oyun-ekleme). İlk AppID'yi ekler eklemez kasma başlar.

### 📱 Android (Termux)

**Gerekenler:** Android telefon, **Termux** uygulaması ve internet. Termux'u **F-Droid**'den veya resmî GitHub sürümlerinden (`termux/termux-app`) kur – çok eski Play Store sürümleri paket kuramayabilir.

#### Seçenek A – tek komut *(önerilir – uzun kod yazmana gerek yok)*

1. Termux'u aç ve bu tek satırı yapıştır:
   ```bash
   pkg install -y curl && curl -fsSL https://raw.githubusercontent.com/SugeswChr/Zenith-Hours/main/Android/android-install.sh | bash
   ```

   Kurulum betiği Node.js'i kurar, `index.js` ve `package.json` dosyalarını GitHub'dan `~/ZenithHours` klasörüne indirir, bağımlılıkları yükler ve iki kısayol komutu oluşturur.
2. **Botu başlat:**
   ```bash
   zenith
   ```
3. Giriş yap (en kolayı QR) ve oyunlarını ekle – bkz. [Giriş yapma](#5-giriş-yapma) ve [Oyun ekleme](#oyun-ekleme).
4. **Sonra güncelle** (GitHub'daki yeni kod):
   ```bash
   zenith-guncelle
   ```

**Telefonunda ne kalır:** giriş bilgin, refresh token'ın ve oyun listelerin **senin** cihazındaki `~/ZenithHours/hesaplar.json` dosyasında durur. Kurulum/güncelleme betiği sadece kod dosyalarını indirir – `hesaplar.json` dosyasını okumaz, değiştirmez, silmez ve yüklemez.

> ⚠️ Güncelleme, GitHub deposundaki kodu indirir ve çalıştırır. Sadece **resmî** depo bağlantısını kullan.

#### Seçenek B – ZIP'i telefona elle aktar

1. `ZenithHours.zip` dosyasını telefona getir: indir, kendine gönder (Telegram "Kayıtlı Mesajlar", Google Drive, WhatsApp…) veya USB kabloyla kopyala. Genellikle **İndirilenler (Download)** klasörüne düşer.
2. Termux'ta şu satırları sırayla çalıştır:
   ```bash
   termux-setup-storage                 # çıkan izin penceresinde "İzin ver"e bas (sadece bir kez)
   pkg update && pkg install -y nodejs unzip
   cp ~/storage/downloads/ZenithHours.zip ~/
   unzip ZenithHours.zip -d ZenithHours
   cd ZenithHours
   npm install
   node index.js
   ```
   Dosyanın adı farklıysa (örneğin `ZenithHours (1).zip`) `ls ~/storage/downloads` ile adı gör, sonra tırnak içinde kullan: `cp ~/storage/downloads/"ZenithHours (1).zip" ~/ZenithHours.zip`.
3. Sonraki seferlerde şöyle başlat:
   ```bash
   cd ~/ZenithHours && node index.js
   ```

#### Termux temelleri – dosyaları açma ve düzenleme

Termux dosyalarını kendi özel ana klasöründe (`~`) tutar; normal Dosyalar uygulaması burayı göremez. Şu komutları kullan:

| Komut | Ne yapar |
|---|---|
| `ls` | Bulunduğun klasördeki dosyaları listeler |
| `cd ZenithHours` | `ZenithHours` klasörüne girer (`cd ~` ana klasöre, `cd ..` bir üste gider) |
| `pwd` | Nerede olduğunu gösterir |
| `cat README.md` | Dosyayı ekrana yazdırır |
| `pkg install nano` sonra `nano index.js` | Dosyayı düzenlemek için açar (kaydet: `CTRL+O`, `Enter` – çık: `CTRL+X`) |
| `cp hesaplar.json ~/storage/downloads/` | Dosyayı telefonun İndirilenler klasörüne kopyalar (**yedek – gizli tut!**) |

#### Android'de çalışır halde tutma

- Termux'u açık tut. Bot Termux'tan **wake-lock** ister, böylece ekran kapalıyken de çalışır.
- Android ayarlarından Termux'un pil kullanımını **Kısıtlanmamış / Optimize etme** yap ve son uygulamalar listesinde kilitle. Aksi halde bazı telefonlar arka plandaki uygulamaları agresifçe kapatır.
- Düz log mu istiyorsun? `zenith --sade` ile başlat.
- Botu Termux içinde `q` (veya `CTRL+C`) ile kapat.

### 🐧 Linux / 🍎 macOS

```bash
unzip ZenithHours.zip -d ZenithHours
cd ZenithHours
npm install
node index.js
```

Sunucuda sürekli çalışması için `tmux` veya `screen` kullan ve sade log modunda başlat:

```bash
node index.js --sade
```

> **İpucu:** etkileşimli terminal yoksa (örneğin `nohup`) bot giriş soramaz. Bir kez etkileşimli olarak giriş yap veya `--token <TOKEN>` kullan.

## 5. Giriş yapma

İlk açılışta (veya ana menüde `[a]` tuşuna bastığında) şunlardan birini seçebilirsin:

| # | Yöntem | Not |
|---|---|---|
| 1 | **QR kod** *(önerilir)* | Steam mobil uygulaması → Steam Guard → QR kodu tara ve onayla. PC'ye şifre veya kod yazmazsın. |
| 2 | **Kullanıcı adı + şifre** | Gerekirse Steam Guard kodu istenir. Şifren sadece giriş için kullanılır ve **asla kaydedilmez**. |
| 3 | **Refresh token** | Başka bir cihazdan alınan token'ı yapıştır (`--sadece-giris` ile oluşturulur). |

Giriş başarılı olunca uzun ömürlü bir refresh token `hesaplar.json` dosyasına kaydedilir; sonraki açılışlarda otomatik giriş yapılır. Kayıtlı oturumun süresi dolarsa hesap listeden çıkarılır, tekrar eklemen yeterlidir.

## 6. Paneli kullanma

### Oyun ekleme

Botta hazır oyun listesi **yoktur** – istediğin oyunları hesap başına kendin eklersin. Bir dakikadan kısa sürer:

1. Botu başlat ve hesabın ana menüde görünmesini bekle.
2. **`s`** (hesap seç) tuşuna bas, sonra hesabın numarasına bas (örneğin **`1`**).
3. **`e`** (oyun ekle) tuşuna bas.
4. Bir veya daha fazla **AppID** yaz ve Enter'a bas. Birden fazlaysa boşluk veya virgülle ayır, örneğin:
   ```
   730 570 440
   ```
5. Bitti. Kasma tüm liste için hemen başlar ve liste **otomatik kaydedilir** – bunu sadece bir kez yaparsın. Bot bir sonraki açılışta listeni hatırlar.

**AppID nasıl bulunur:** oyunun Steam mağaza sayfasını aç – adresteki sayı AppID'dir (`store.steampowered.com/app/`**`730`**`/Counter-Strike_2/`). [SteamDB](https://steamdb.info) gibi siteler de gösterir.

| Örnek AppID | Oyun |
|---|---|
| `730` | Counter-Strike 2 |
| `570` | Dota 2 |
| `440` | Team Fortress 2 |

**Bilmen gerekenler**

- Oyun, **hesabın kütüphanesinde** olmalı (satın alınmış veya hesaba eklenmiş ücretsiz oyun). Aksi halde saat kazandırmaz – `node index.js --kontrol` ile kontrol edebilirsin.
- Hesap başına en fazla **32 oyun**; fazlası uyarıyla yok sayılır.
- Her hesabın **kendi listesi** vardır. Hesap ekranında `1`–`9` / `n` / `p` ile hesap değiştirip her birine oyun ekle.
- Oyun çıkarmak için **`r`** (belirli AppID'ler) veya **`x`** (hepsi) kullan. Değişiklikler anında uygulanır.
- Liste boşken hesapta `OYUN YOK` yazar ve hiçbir şey kasılmaz.

**Ana menü**

| Tuş | İşlev |
|---|---|
| `s` | Hesap seç |
| `a` | Hesap ekle |
| `d` | Hesap sil |
| `g` | **guns.lol** – "siteye git" seçenekli yapımcı sayfaları (aşağıya bak) |
| `q` | Çıkış (tüm hesapların oturumu düzgünce kapatılır) |

**guns.lol ekranı** (`g`)

```
[1] Owner 1 - Sugesw  siteye git
    https://guns.lol/sugws
[2] Owner 2 - Exufo   siteye git
    https://guns.lol/exufo
[m] ana menu
```

| Tuş | İşlev |
|---|---|
| `1` | **Siteye git** – Owner 1'in (Sugesw) sayfasını varsayılan tarayıcında açar |
| `2` | **Siteye git** – Owner 2'nin (Exufo) sayfasını varsayılan tarayıcında açar |
| `m` | Ana menüye dön |

Tarayıcı açılamazsa (örneğin ekransız sunucuda) bağlantı ekranda gösterilir, elle açabilirsin.

**Hesap ekranı**

| Tuş | İşlev |
|---|---|
| `1`–`9`, `n`, `p` | Hesaplar arasında geçiş |
| `e` | AppID ile oyun ekle (birden fazlaysa boşluk veya virgülle ayır) |
| `r` | AppID ile oyun çıkar |
| `x` | Bu hesaptaki tüm oyunları çıkar |
| `l` | Oyun listesinin sonraki sayfası |
| `m` | Ana menüye dön |

Durum etiketleri: `BAGLANIYOR` bağlanıyor · `KASIYOR` kasıyor · `DURAKLADI` duraklatıldı (başka yerde oyun oynuyorsun) · `YENIDEN BAG.` yeniden bağlanıyor · `BEKLIYOR` tekrar denemeden önce bekliyor · `OYUN YOK` listede oyun yok.

Bir oyunun AppID'sini Steam mağaza adresinden bulabilirsin: `store.steampowered.com/app/`**`730`**`/`.

## 7. Komut satırı seçenekleri

| Komut | Açıklama |
|---|---|
| `node index.js` | Normal başlatma – kayıtlı tüm hesaplar, canlı panel |
| `node index.js --sade` | Panel yok, düz log çıktısı |
| `node index.js --liste` | Kayıtlı her hesabın oyun listesini isimleriyle yazdırıp çık |
| `node index.js --hesap-ekle` | Açılışta yeni hesap ekle, sonra hepsini kas |
| `node index.js --sifirla` | Kayıtlı **tüm** hesapları sil ve baştan başla |
| `node index.js --token <TOKEN>` | Refresh token ile hesap ekle (şifre / 2FA gerekmez) |
| `node index.js --sadece-giris` | Hesap ekle, token'ı kaydet/göster ve çık (PC'de işe yarar) |
| `node index.js --kontrol` | Ayarlı oyunlardan hesapta olmayanları raporla |
| `node index.js --yardim` | Yardımı göster |

Diğer: `NO_COLOR=1` renkleri kapatır; `STEAM_REFRESH_TOKEN=<token>` ortam değişkeniyle token eklenebilir.

## 8. Ayarlar

**Oyun listeleri:** panelde `e` / `r` / `x` tuşlarını kullan (bkz. [Oyun ekleme](#oyun-ekleme)). Her hesabın listesi `hesaplar.json` içinde o hesabın `games` alanına kaydedilir.

**Yeni hesaplar için isteğe bağlı başlangıç listesi:** hazır liste boştur. Eklenen her *yeni* hesap aynı oyunlarla başlasın istersen AppID'lerini `index.js` dosyasının başındaki `RAW_GAMES` dizisine yaz, örneğin `const RAW_GAMES = [730, 570];` (en fazla 32, tekrarlar otomatik temizlenir).

**Eski sürümden güncelleme:** önceki sürümlerde 28 oyunluk varsayılan liste vardı. Bu varsayılanı kullanan hesaplar artık boş listeyle başlar – oyunlarını `e` ile yeniden ekle. Kendi özel listesi olan hesaplar listesini korur.

**Botun oluşturduğu dosyalar**

| Dosya | Amaç |
|---|---|
| `hesaplar.json` | Kayıtlı hesaplar: refresh token, hesap adı, SteamID64 ve isteğe bağlı özel oyun listesi. **Şifre gibi davran.** |
| `oyun_isimleri.json` | Steam mağazasından indirilen oyun isimlerinin önbelleği |
| `steam_session.json` | Eski sürümlerden kalan dosya; otomatik taşınır ve silinir |

## 9. Windows'ta başlatma ve kapatma

- **`ZenithHours_Baslat.vbs`** botu bir konsol penceresinde açar. **Bu pencereyi açık tut** (küçültebilirsin) – pencereyi kapatırsan bot durur. Bu dosyanın kısayolunu Masaüstüne koyabilirsin.
- **`ZenithHours_Kapat.vbs`** botu, bilgisayardaki **tüm** `node.exe` işlemlerini sonlandırarak kapatır. Başka Node.js programları çalıştırıyorsan botu bunun yerine penceresinde `q` veya `Ctrl+C` ile kapat.
- Windows Defender veya antivirüs `.vbs` dosyaları için uyarı verebilir, çünkü bu dosya türü sık kötüye kullanılır. Bu iki dosya kısa, düz metin betiklerdir – Not Defteri ile açıp ne yaptıklarını görebilirsin.

## 10. Sorun giderme

| Sorun | Çözüm |
|---|---|
| `'npm' is not recognized` / `'node' is not recognized` | Node.js kurulu değil veya terminal kurulumdan önce açılmış. Node.js'i kur ve yeni bir pencere aç. |
| `Cannot find module 'steam-user'` | Bot klasöründe `npm install` çalıştır. |
| *Hesap başka yerde oyun oynuyor* → `DURAKLADI` | Steam, hesap başına tek aktif oyun oturumuna izin verir. Diğer oturum kapanınca kasma otomatik devam eder. |
| *Hesap başka bir yerde açıldı* | Bot 5 dakika bekler ve tekrar dener. |
| *Hız sınırı / çok fazla deneme* | Steam, IP başına giriş sayısını sınırlar. Tüm hesaplar otomatik olarak 30 dakika bekler. Botu art arda yeniden başlatmaktan kaçın. |
| *Kayıtlı oturum geçersiz / süresi dolmuş* | Hesap listeden çıkarılır. `a` tuşuna basıp yeniden ekle. |
| Hesapta `OYUN YOK` yazıyor / hiçbir şey kasılmıyor | Oyun listesi boş. `s` → hesap numarası → `e` tuşlarıyla AppID ekle (bkz. [Oyun ekleme](#oyun-ekleme)). |
| Saat artmıyor | `node index.js --kontrol` çalıştır. Kütüphanende olmayan oyunlar saat kazandırmaz. Steam, profildeki sayıları güncellemekte de gecikebilir. |
| Kart düşmedi | Sadece koleksiyon kartı olan oyunlarda ve düşecek kart kaldığı sürece kart düşer. Kasma kart garantisi vermez. |
| Panel bozuk görünüyor | Terminal penceresini büyüt veya `--sade` kullan. |
| Windows konsolu donuyor | Konsolun içine tıklamak onu durdurabilir (QuickEdit). `Enter` veya `Esc`'ye bas ve konsol özelliklerinden QuickEdit modunu kapat. |

## 11. Ban riski ve güvenlik

Sana dürüst olmak istiyoruz: **bir hesabın hiçbir zaman ceza almayacağını garanti etmek mümkün değildir.** Botu kullanmadan önce bu bölümü oku.

**Botun *yapmadıkları***

- Hiçbir oyunu başlatmaz, değiştirmez veya içine kod enjekte etmez; oyun dosyalarına ve oyun belleğine dokunmaz. Hiçbir oyun işlemi çalışmadığı için **VAC (Valve Anti-Cheat) devreye girmez.**
- Takas yapmaz, satış yapmaz, hediye göndermez, Steam Pazarı'nı kullanmaz, envanterini veya sohbetlerini okumaz, arkadaş eklemez.
- Steam'den veri kazımaz; yalnızca standart istemci protokolüyle "şu an oynanan" listesini bildirir.

**Yine de bilmen gerekenler**

- **Kullanım şartları.** Valve, "saat kasma" araçlarını resmî olarak desteklemez ve Steam Abonelik Sözleşmesi değişebilir. Bu türden araçlar (bilinen popüler olanlar dahil) uzun yıllardır kullanılıyor, ancak Valve tutumunu istediği zaman değiştirebilir. **Botu kendi sorumluluğunda kullanırsın.**
- **İade.** Kasılan süre oynama süresi olarak sayılır. Süresi şişirilmiş oyunlar genellikle **artık iade edilemez** (Steam iade sınırı 2 saatin altında oynama süresidir).
- **Sahte oynama süresi.** Şişirilmiş saatleri başkalarını yanıltmak için kullanma – örneğin yorumlarda, hesap satarken/takas ederken veya saat şartı koyan sunucu/gruplarda. Başına iş açmanın en gerçekçi yolu budur.
- **Başkaları görür.** Bot durumunu *Çevrimiçi* yapar, bu yüzden arkadaşların seni "Oyunda" görebilir. Oyun ayrıntılarının görünmesini istemiyorsan Steam gizlilik ayarlarını kullan.
- **Giriş sınırları.** Aynı IP'den kısa sürede çok sayıda giriş, Steam'in geçici hız sınırını tetikler. Bot otomatik olarak bekler (30 dk), ancak onu tekrar tekrar yeniden başlatmaktan ve tek bağlantıdan çok fazla hesap çalıştırmaktan kaçın.
- **Kimlik bilgilerin.** `hesaplar.json` içindeki refresh token oturumuna erişim sağlar. Dosyayı kimseyle paylaşma ve hiçbir yere yükleme.

**Öneriler**

1. Riskten endişeleniyorsan **ana hesabını veya değerli hesaplarını kullanma.**
2. **QR girişi** tercih et ve **Steam Guard**'ı açık tut.
3. Kasarken aynı hesapla gerçek bir oyun açma (bot kendini duraklatır, ama işi basit tut).
4. Bot klasörünü özel tut; `hesaplar.json` dosyasını kimseye gönderme.
5. Token'ın sızdığını düşünüyorsan Steam şifreni değiştir ve Steam Guard ayarlarından tüm cihazlardaki oturumları kapat; bu, kayıtlı oturumları geçersiz kılar.

## 12. Gizlilik Politikası

*Son güncelleme: 2026-11-08*

**Kısaca: bu program tamamen senin kendi cihazında çalışır. Yapımcılar herhangi bir sunucu işletmez; verilerini toplamaz, almaz, saklamaz, satmaz veya paylaşmaz.**

**12.1 Cihazında saklanan veriler**

| Veri | Konum | Neden |
|---|---|---|
| Steam refresh token, hesap adı, SteamID64, özel oyun listesi | `hesaplar.json` | Otomatik tekrar giriş yapmak ve listelerini hatırlamak için |
| Oyun isimleri | `oyun_isimleri.json` | Oyun isimlerini her seferinde indirmeden göstermek için |

**Şifren asla diske yazılmaz.** Sadece giriş için kullanılır ve sonra bellekten atılır. Linux/macOS/Termux'ta dosya izinleri yalnızca senin kullanıcınla sınırlandırılır; Windows'ta dosya sadece normal kullanıcı hesabı izinleriyle korunur.

**12.2 Programın kurduğu ağ bağlantıları**

- **Steam sunucuları** – giriş yapmak ve "oynadığın" oyunları bildirmek için (`steam-user` ve `steam-session` kütüphaneleri üzerinden).
- **store.steampowered.com** – AppID'ye göre oyun isimlerini öğrenmek için.
- **npm kayıt sistemi** – yalnızca `npm install` çalıştırdığında, bağımlılıkları indirmek için.
- **raw.githubusercontent.com (GitHub)** – yalnızca Android kurulum/güncelleme betiğini (`android-install.sh`, `zenith-guncelle`) kullanırsan, programın kod dosyalarını (`index.js`, `package.json`, …) indirmek için. Cihazından hiçbir şey gönderilmez; `hesaplar.json` asla okunmaz veya yüklenmez.

**Analiz, telemetri, reklam veya takip özelliği yoktur** ve yapımcılara ait hiçbir sunucuya bağlantı kurulmaz.

**12.3 Üçüncü taraflar**

Steam'e gönderilen veriler Valve tarafından [Steam Gizlilik Politikası](https://store.steampowered.com/privacy_agreement/) kapsamında işlenir. Bağımlılıklar, npm üzerinden dağıtılan üçüncü taraf açık kaynak paketlerdir. Android kurulum betiğiyle yapılan kod indirmeleri [GitHub Gizlilik Bildirimi](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) kapsamında GitHub tarafından sunulur.

**12.4 Kontrol sende**

- Tek hesabı silmek: ana menüde `d` tuşuna bas.
- Tüm hesapları silmek: `node index.js --sifirla` çalıştır veya `hesaplar.json` dosyasını sil.
- Önbellekteki isimleri silmek: `oyun_isimleri.json` dosyasını sil.
- Çalınmış/sızmış bir oturumu iptal etmek: Steam şifreni değiştir ve tüm cihazlardaki oturumları kapat.

**12.5 Çocuklar**

Bu yazılım, Steam'i kullanmak için gereken asgari yaşın altındaki çocuklara yönelik değildir.

**12.6 Değişiklikler ve iletişim**

Bu politika yeni sürümlerle güncellenebilir; yukarıdaki tarih son düzenlemeyi gösterir. Sorularını [Yapımcılar](#14-yapımcılar) bölümündeki bağlantılardan yapımcılara iletebilirsin.

## 13. Sorumluluk reddi

Bu proje **Valve Corporation veya Steam ile bağlantılı değildir, onlar tarafından onaylanmamış veya desteklenmemiştir.** Steam ve Steam logosu Valve Corporation'ın ticari markalarıdır. Yazılım **"olduğu gibi", hiçbir garanti verilmeden** sunulur. Kullanımından doğabilecek ceza, kısıtlama, ban, veri kaybı veya diğer zararlardan yapımcılar sorumlu değildir. Sorumlu kullan ve kullandığın platformların kurallarına uy.

## 14. Yapımcılar

| Rol | İsim | Bağlantı |
|---|---|---|
| **Owner / Creator** | **Sugesw** | https://guns.lol/sugws |
| **Owner / Creator** | **Exufo** | https://guns.lol/exufo |

İsimler ve bağlantılar programın içinde de görünür: açılış ekranında, panel başlığında ve ana menüdeki **`[g] guns.lol`** seçeneğinde.

[`steam-user`](https://www.npmjs.com/package/steam-user), [`steam-session`](https://www.npmjs.com/package/steam-session) ve [`qrcode-terminal`](https://www.npmjs.com/package/qrcode-terminal) ile yapıldı.

<p align="right"><a href="#top">⬆ Başa dön</a></p>
