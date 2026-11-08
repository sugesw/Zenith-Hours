<div align="center">

# 🔒 Privacy Policy · Gizlilik Politikası

**Zenith Hours** · Steam Hour & Card Idler · Steam Saat & Kart Kasma Botu

**Owner / Creator: Sugesw / Exufo**

[🇬🇧 English](#-english) &nbsp;•&nbsp; [🇹🇷 Türkçe](#-türkçe) &nbsp;•&nbsp; [📖 README](README.md)

</div>

---

## 🇬🇧 English

*Last updated: 2026-11-08*

**In short: this program runs entirely on your own device. The creators do not operate any server, and we do not collect, receive, store, sell or share any of your data.**

**1. What is stored on your device**

| Data | Where | Why |
|---|---|---|
| Steam refresh token, account name, SteamID64, custom game list | `hesaplar.json` | To sign in again automatically and remember your lists |
| Game names | `oyun_isimleri.json` | To show game names without downloading them every time |

Your **password is never written to disk.** It is used only to sign in and then discarded from memory. File permissions are restricted to your user on Linux/macOS/Termux; on Windows the file is protected only by your normal user-account permissions.

**2. Network connections the program makes**

- **Steam servers** – to sign in and report the games you are "playing" (through the `steam-user` and `steam-session` libraries).
- **store.steampowered.com** – to look up game names by AppID.
- **npm registry** – only when you run `npm install`, to download the dependencies.

There are **no analytics, telemetry, advertising or tracking** features, and no connection to any server owned by the creators.

**3. Third parties**

Data sent to Steam is handled by Valve under the [Steam Privacy Policy](https://store.steampowered.com/privacy_agreement/). Dependencies are third-party open-source packages distributed by npm.

**4. Your control**

- Remove one account: press `d` in the main menu.
- Remove all accounts: run `node index.js --sifirla` or delete `hesaplar.json`.
- Remove cached names: delete `oyun_isimleri.json`.
- Revoke a stolen/leaked session: change your Steam password and sign out of all devices.

**5. Children**

This software is not intended for children under the minimum age required to use Steam.

**6. Changes and contact**

This policy may be updated with new versions; the date above shows the latest revision. Questions can be sent to the creators through the links in [Credits](README.md#14-credits).

---

## 🇹🇷 Türkçe

*Son güncelleme: 2026-11-08*

**Kısaca: bu program tamamen senin kendi cihazında çalışır. Yapımcılar herhangi bir sunucu işletmez; verilerini toplamaz, almaz, saklamaz, satmaz veya paylaşmaz.**

**1. Cihazında saklanan veriler**

| Veri | Konum | Neden |
|---|---|---|
| Steam refresh token, hesap adı, SteamID64, özel oyun listesi | `hesaplar.json` | Otomatik tekrar giriş yapmak ve listelerini hatırlamak için |
| Oyun isimleri | `oyun_isimleri.json` | Oyun isimlerini her seferinde indirmeden göstermek için |

**Şifren asla diske yazılmaz.** Sadece giriş için kullanılır ve sonra bellekten atılır. Linux/macOS/Termux'ta dosya izinleri yalnızca senin kullanıcınla sınırlandırılır; Windows'ta dosya sadece normal kullanıcı hesabı izinleriyle korunur.

**2. Programın kurduğu ağ bağlantıları**

- **Steam sunucuları** – giriş yapmak ve "oynadığın" oyunları bildirmek için (`steam-user` ve `steam-session` kütüphaneleri üzerinden).
- **store.steampowered.com** – AppID'ye göre oyun isimlerini öğrenmek için.
- **npm kayıt sistemi** – yalnızca `npm install` çalıştırdığında, bağımlılıkları indirmek için.

**Analiz, telemetri, reklam veya takip özelliği yoktur** ve yapımcılara ait hiçbir sunucuya bağlantı kurulmaz.

**3. Üçüncü taraflar**

Steam'e gönderilen veriler Valve tarafından [Steam Gizlilik Politikası](https://store.steampowered.com/privacy_agreement/) kapsamında işlenir. Bağımlılıklar, npm üzerinden dağıtılan üçüncü taraf açık kaynak paketlerdir.

**4. Kontrol sende**

- Tek hesabı silmek: ana menüde `d` tuşuna bas.
- Tüm hesapları silmek: `node index.js --sifirla` çalıştır veya `hesaplar.json` dosyasını sil.
- Önbellekteki isimleri silmek: `oyun_isimleri.json` dosyasını sil.
- Çalınmış/sızmış bir oturumu iptal etmek: Steam şifreni değiştir ve tüm cihazlardaki oturumları kapat.

**5. Çocuklar**

Bu yazılım, Steam'i kullanmak için gereken asgari yaşın altındaki çocuklara yönelik değildir.

**6. Değişiklikler ve iletişim**

Bu politika yeni sürümlerle güncellenebilir; yukarıdaki tarih son düzenlemeyi gösterir. Sorularını [Yapımcılar](README.md#14-yapımcılar) bölümündeki bağlantılardan yapımcılara iletebilirsin.

---

**Owner / Creator**

| Name | Link |
|---|---|
| **Sugesw** | https://guns.lol/sugws |
| **ExUfo** | https://guns.lol/exufo |
