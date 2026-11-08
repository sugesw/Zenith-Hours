"use strict";

/**
 * Zenith Hours  v3.2  -  Steam Saat + Kart Kasma Botu  (Termux / Node.js)  -  COKLU HESAP
 *
 * Kullanim:
 *   node index.js                  -> normal calistir (kayitli TUM hesaplar icin canli panel)
 *   node index.js --sade           -> panel yok, duz log modu
 *   node index.js --liste          -> kasilan oyunlarin isimlerini goster ve cik
 *   node index.js --hesap-ekle     -> acilista yeni hesap ekle, sonra hepsini kas
 *   node index.js --sifirla        -> kayitli TUM hesaplari sil, yeniden giris yap
 *   node index.js --token <TOKEN>  -> refresh token ile hesap ekle (sifre / 2FA yok)
 *   node index.js --sadece-giris   -> yeni hesap ekle, token'i kaydet/goster ve cik (PC'de kullan)
 *   node index.js --kontrol        -> hangi oyunlar hesapta yok, onu da soyle
 *   node index.js --yardim
 *
 * Ana menu:        [s] hesap sec   [a] hesap ekle   [d] hesap sil   [g] guns.lol   [q] cikis
 * Hesap ekraninda: [1-9] hesaplar arasi gecis   [e] oyun ekle (AppID)   [r] oyun cikar (AppID)
 *                  [x] hepsini cikar   [l] oyun listesi sayfasi   [m] ana menuye don
 * Oyun ekleme/cikarma aninda uygulanir ve hesaplar.json'a OTOMATIK kaydedilir.
 * Her hesabin oyun listesi ayri tutulur. Liste BOS baslar; oyunlari hesap ekraninda [e] ile AppID girerek ekle. Liste
 * hesaplar.json icinde o hesabin "games" alanina yazilir.
 * Renkleri kapatmak icin: NO_COLOR=1 node index.js
 * Ortam degiskeni: STEAM_REFRESH_TOKEN=<token>
 *
 * Ana menude [g] tusu: guns.lol ekrani. [1] Owner 1 / [2] Owner 2 -> tarayicida siteyi acar, [m] ana menu.
 * Owner / Creator: Sugesw / Exufo
 *
 * Hesaplar "hesaplar.json" dosyasinda saklanir (icindeki token'lar SIFRE GIBIDIR, paylasma).
 * Eski surumdeki steam_session.json varsa ilk calistirmada otomatik tasinir.
 */

const VERSION = "3.2";
const APP_NAME = "Zenith Hours";
process.title = APP_NAME; // pencere / islem basligi

// Yapimcilar / Owner & Creator
const CREDITS = [
    { role: "Owner 1", name: "Sugesw", url: "https://guns.lol/sugws" },
    { role: "Owner 2", name: "Exufo", url: "https://guns.lol/exufo" }
];
const CREDIT_LINE = CREDITS.map((x) => x.name).join(" / "); // "Sugesw / Exufo"

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execFile } = require("child_process");
const SteamUser = require("steam-user");
const { LoginSession, EAuthTokenPlatformType } = require("steam-session");

let qrcode = null;
try { qrcode = require("qrcode-terminal"); } catch (_) { /* opsiyonel */ }

// ───────────────────────────── OYUN LISTESI ─────────────────────────────
// Varsayilan liste BOS. Oyunlar panelden eklenir: ana menu [s] > hesap > [e] > AppID.
// (Istege bagli: yeni eklenen her hesabin baslangic listesi olsun istersen AppID'leri buraya yazabilirsin.)
const RAW_GAMES = [];

// Steam ayni anda en fazla 32 oyuna izin verir. Tekrarlar da otomatik temizlenir.
const UNIQUE_GAMES = [...new Set(RAW_GAMES)];
const GAMES = UNIQUE_GAMES.slice(0, 32);

// Emin oldugum isimler (yedek). Magaza API'sinden gelen isim bunlarin ustune yazar.
const FALLBACK_NAMES = {
    3240220: "Grand Theft Auto V Enhanced",
    271590: "Grand Theft Auto V",
    730: "Counter-Strike 2",
    3527290: "PEAK",
    2281730: "Combat Master",
    291550: "Brawlhalla",
    203140: "Hitman: Absolution",
    1659040: "HITMAN World of Assassination",
    863550: "HITMAN 2",
    945360: "Among Us",
    477160: "Human: Fall Flat",
    233450: "Prison Architect",
    578080: "PUBG: BATTLEGROUNDS",
    359550: "Tom Clancy's Rainbow Six Siege",
    220: "Half-Life 2",
    1568590: "Goose Goose Duck",
    227300: "Euro Truck Simulator 2",
    1172470: "Apex Legends",
    346110: "ARK: Survival Evolved",
    304930: "Unturned",
    620: "Portal 2",
    1625450: "Muck"
};

// ───────────────────────────── AYARLAR ─────────────────────────────
const DIR = __dirname;
const ACCOUNTS_FILE = path.join(DIR, "hesaplar.json");
const OLD_SESSION_FILE = path.join(DIR, "steam_session.json"); // eski surum (otomatik tasinir)
const NAMES_FILE = path.join(DIR, "oyun_isimleri.json");

const HEARTBEAT_MS = 30 * 60 * 1000;       // duz log modunda 30 dk'da bir durum yazdir
const RETRY_BASE_MS = 10 * 1000;           // ilk yeniden deneme: 10 sn
const RETRY_MAX_MS = 5 * 60 * 1000;        // en fazla 5 dk'ya kadar katlanir
const ELSEWHERE_WAIT_MS = 5 * 60 * 1000;   // baska yerde giris yapildiysa 5 dk bekle
const THROTTLE_WAIT_MS = 30 * 60 * 1000;   // rate limit / throttle ise 30 dk bekle
const MAX_GAMES = 32;                      // Steam ayni anda en fazla 32 oyun
const START_STAGGER_MS = 3000;             // acilista hesaplari 3 sn arayla baglat (rate limit'e takilmamak icin)

// EResult kodlari
const ER = { InvalidPassword: 5, LoggedInElsewhere: 6, AccessDenied: 15, Expired: 27, RateLimitExceeded: 84, AccountLoginDeniedThrottle: 87 };

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
function argValue(f) {
    const i = args.findIndex((a) => a === f || a.startsWith(f + "="));
    if (i < 0) return null;
    const a = args[i];
    return a.includes("=") ? a.split("=").slice(1).join("=") : (args[i + 1] || null);
}

const CHECK_OWNERSHIP = hasFlag("--kontrol");
const LOGIN_ONLY = hasFlag("--sadece-giris");

// ───────────────────────────── RENK & TEMEL YARDIMCILAR ─────────────────────────────
const USE_COLOR = !!process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb";
const paint = (code) => (s) => (USE_COLOR ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const c = { red: paint(31), green: paint(32), yellow: paint(33), cyan: paint(36), gray: paint(90), bold: paint(1) };

const ANSI_RE = /\x1b\[[0-9;?]*[A-Za-z]/g;
const vlen = (s) => String(s).replace(ANSI_RE, "").length;
function fit(s, w) {
    s = String(s);
    if (vlen(s) <= w) return s;
    return s.replace(ANSI_RE, "").slice(0, Math.max(0, w - 1)) + "…";
}
function wrap(text, w) {
    const out = [];
    let rest = String(text);
    while (rest.length > w) {
        let cut = rest.lastIndexOf(" ", w);
        if (cut < Math.floor(w / 2)) cut = w;
        out.push(rest.slice(0, cut));
        rest = rest.slice(cut).trimStart();
    }
    out.push(rest);
    return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, "0");
function ts() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

function fmtDur(ms) {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return `${d ? d + "g " : ""}${h}sa ${m}dk`;
}
function fmtShort(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return s >= 60 ? `${Math.floor(s / 60)}dk ${pad(s % 60)}sn` : `${s}sn`;
}

// ───────────────────────────── GENEL DURUM ─────────────────────────────
let shuttingDown = false;
let rl = null;
let pendingQuestion = false;

const accounts = [];        // calisan Account nesneleri
let archivedHours = 0;      // silinen hesaplarin kazandigi oyun-saati (toplam bozulmasin)
let view = "main";          // main | select | account
let selAcc = null;          // hesap ekraninda secili hesap
let gunsMsg = null;         // guns.lol ekraninda gosterilen durum mesaji ("tarayicida aciliyor" vb.)
let gamePage = 0;           // hesap ekraninda oyun listesi sayfasi (0'dan baslar)
let namesStarted = false;
let throttleUntil = 0;      // Steam rate limit uyarisi gelirse TUM hesaplar bu zamana kadar bekler (IP bazli limit)
let lastFrame = "";         // son cizilen ekran; ayniysa tekrar yazilmaz (konsol yazma sayisini azaltir)
let rendering = false;
let heartbeatTimer = null;
const events = [];

const STATUS = {
    connecting: ["BAGLANIYOR", c.cyan],
    idling: ["KASIYOR", c.green],
    paused: ["DURAKLADI", c.yellow],
    reconnecting: ["YENIDEN BAG.", c.yellow],
    waiting: ["BEKLIYOR", c.red],
    empty: ["OYUN YOK", c.gray]
};

const gameLists = () => accounts.map((x) => ({ label: x.label(), games: x.games }));
const totalGameHours = () => archivedHours + accounts.reduce((s, a) => s + a.gameHours(), 0);

// oyun isimleri
let names = { ...FALLBACK_NAMES };
const nameOf = (id) => names[id] || "(isim bulunamadi)";

// ───────────────────────────── LOG ─────────────────────────────
const LEVEL_COLOR = { ok: c.green, warn: c.yellow, err: c.red, info: (x) => x };
function plainLine(e) { return `${c.gray("[" + e.t + "]")} ${LEVEL_COLOR[e.level](e.msg)}`; }

function emit(level, a, acc) {
    let msg = a.map((x) => (typeof x === "string" ? x : (x && x.message) || String(x))).join(" ");
    if (acc && accounts.length > 1) msg = `[${acc.label()}] ${msg}`;
    const e = { t: ts(), level, msg };
    // Panel acikken VEYA kullanici bir soru cevaplarken hesap mesajlari kuyruga girer (soruyu bozmasin)
    if (ui.active || (ui.enabled && ui.depth > 0 && acc)) {
        events.push(e);
        if (events.length > 60) events.shift();
        if (ui.active) render();
        return;
    }
    console.log(plainLine(e));
}
function makeLogger(acc) {
    const f = (...a) => emit("info", a, acc);
    f.ok = (...a) => emit("ok", a, acc);
    f.warn = (...a) => emit("warn", a, acc);
    f.err = (...a) => emit("err", a, acc);
    return f;
}
const log = makeLogger(null);

// ───────────────────────────── CANLI PANEL ─────────────────────────────
function accountRow(a, n, W) {
    const [st, col] = STATUS[a.statusKey];
    const dot = "●";
    let right = col(st);
    if (a.statusKey === "idling") right += c.gray(" " + fmtDur(a.totalIdle()));
    else if (a.reconnectAt > Date.now()) right += c.gray(" " + fmtShort(a.reconnectAt - Date.now()));
    right += " ";
    const left = fit(` ${c.gray(String(n).padStart(2))} ${col(dot)} ${c.bold(a.label())}`, Math.max(4, W - vlen(right) - 1));
    return left + " ".repeat(Math.max(1, W - vlen(left) - vlen(right))) + right;
}

const K = (k, label) => `${c.cyan("[" + k + "]")} ${label}`;

// render hata verirse program donmasin / sonsuz donguye girmesin diye sarmalayici
function render() {
    if (!ui.active || rendering) return;
    rendering = true;
    try { renderFrame(); } catch (_) { /* bir sonraki turda tekrar denenir */ } finally { rendering = false; }
}
const onResize = () => { lastFrame = ""; render(); };

function renderFrame() {
    const cols = process.stdout.columns || 40;
    const H = process.stdout.rows || 30;
    const W = Math.max(28, Math.min(cols, 56));
    const inner = W - 2;
    const sep = (title) => { const t = `─ ${title} `; return c.gray(t + "─".repeat(Math.max(0, W - vlen(t)))); };
    const center = (s) => { const l = Math.max(0, Math.floor((inner - vlen(s)) / 2)); return " ".repeat(l) + s + " ".repeat(Math.max(0, inner - vlen(s) - l)); };
    const row = (k, v) => fit(` ${c.gray(k.padEnd(8))}${v}`, W);

    // gorunum hala gecerli mi? (hesap silinmis olabilir)
    const N = accounts.length;
    if ((view === "select" || view === "account") && !N) view = "main";
    if (view === "account" && !accounts.includes(selAcc)) selAcc = accounts[0];

    const out = [];
    out.push(c.cyan("╔" + "═".repeat(inner) + "╗"));
    out.push(c.cyan("║") + center(c.bold(`ZENITH HOURS  v${VERSION}`)) + c.cyan("║"));
    out.push(c.cyan("║") + center(c.gray("by ") + c.cyan(CREDIT_LINE)) + c.cyan("║"));
    out.push(c.cyan("╚" + "═".repeat(inner) + "╝"));

    let helpLines;

    if (view === "account") {
        // ───── HESAP EKRANI: secili hesabin bilgisi + oyun listesi ─────
        const a = selAcc, idx = accounts.indexOf(a);
        const [stText, stCol] = STATUS[a.statusKey];
        let st = stCol(`● ${stText}`);
        if (a.reconnectAt > Date.now()) st += c.gray(` ${fmtShort(a.reconnectAt - Date.now())}`);
        out.push(row("Hesap", c.bold(a.label()) + c.gray(` (${idx + 1}/${N})`)));
        out.push(row("Durum", st));
        out.push(row("Sure", fmtDur(a.totalIdle())));
        out.push(row("Oyun", `${a.games.length}/${MAX_GAMES}`));
        out.push(row("Kazanc", `~${a.gameHours().toFixed(1)} oyun-saati`));

        // hesap numaralari: secili olan [ ] icinde
        let from = 0, to = N;
        if (N > 10) { from = Math.max(0, Math.min(idx - 4, N - 10)); to = from + 10; }
        let tabs = "";
        for (let i = from; i < to; i++) tabs += i === idx ? c.cyan(c.bold(`[${i + 1}]`)) : c.gray(` ${i + 1} `);
        out.push(sep("Hesap sec"));
        out.push(fit(` ${from > 0 ? c.gray("… ") : ""}${tabs}${to < N ? c.gray(" …") : ""}`, W));

        helpLines = [
            ` ${K("e", "oyun ekle")}  ${K("r", "oyun cikar")}`,
            ` ${K("x", "hepsini cikar")}  ${K("l", "sayfa")}`,
            ` ${K(N > 9 ? "1-9,n,p" : N > 1 ? `1-${N}` : "1", "hesap")}  ${K("m", "ana menu")}`
        ];
        const avail = Math.max(3, H - out.length - 3 - helpLines.length);
        const games = a.games;
        const pages = Math.max(1, Math.ceil(games.length / avail));
        if (gamePage >= pages) gamePage = 0;
        out.push(sep(`Oyunlar ${gamePage + 1}/${pages}`));
        if (!games.length) out.push(fit(` ${c.yellow("Liste bos - [e] ile oyun ekle")}`, W));
        games.slice(gamePage * avail, (gamePage + 1) * avail)
            .forEach((id) => out.push(fit(` ${c.gray(String(id).padEnd(8))}${nameOf(id)}`, W)));
    } else if (view === "gunslol") {
        // ───── GUNS.LOL: yapimcilarin baglantilari ─────
        out.push(sep("guns.lol"));
        CREDITS.forEach((cr, i) => {
            out.push(fit(` ${c.cyan("[" + (i + 1) + "]")} ${c.bold(cr.role)} ${c.gray("-")} ${c.green(cr.name)}  ${c.yellow("siteye git")}`, W));
            out.push(fit(`     ${c.gray(cr.url)}`, W));
        });
        out.push(fit(` ${K("m", "ana menu")}`, W));
        out.push("");
        if (gunsMsg) out.push(fit(` ${gunsMsg}`, W));
        helpLines = [` ${K("1-" + CREDITS.length, "siteye git")}  ${K("m", "ana menu")}`, ` ${K("q", "cikis")}`];
    } else {
        // ───── ANA MENU / HESAP SEC ─────
        const active = accounts.filter((a) => a.statusKey === "idling").length;
        const counts = accounts.map((a) => a.games.length);
        const lo = counts.length ? Math.min(...counts) : GAMES.length, hi = counts.length ? Math.max(...counts) : GAMES.length;
        out.push(row("Hesap", c.bold(String(N)) + c.gray(` (${active} kasiyor)`)));
        out.push(row("Oyun", hi === 0 && N ? c.yellow("yok - [s] hesap > [e] ile ekle") : lo === hi ? `${lo} oyun / hesap` : `${lo}-${hi} oyun / hesap`));
        out.push(row("Kazanc", `~${totalGameHours().toFixed(1)} oyun-saati`));
        out.push(sep(view === "select" ? "Hesap sec" : "Hesaplar"));

        helpLines = view === "select"
            ? [` Hesap no sec: ${K(N > 9 ? "1-9" : N > 1 ? `1-${N}` : "1", "")}${N > 9 ? c.gray(" veya [n]") : ""}`, ` ${K("m", "ana menu")}  ${K("q", "cikis")}`]
            : [` ${K("s", "hesap sec")}  ${K("a", "hesap ekle")}`, ` ${K("d", "hesap sil")}  ${K("g", "guns.lol")}`, ` ${K("q", "cikis")}`];

        if (!N) {
            out.push(fit(` ${c.yellow("Hesap yok - [a] ile hesap ekle")}`, W));
        } else {
            // ekrana en fazla bu kadar hesap satiri sigar (altta olaylar icin yer birakilir)
            const maxAcc = Math.max(1, H - 1 - out.length - 4 - 1 - helpLines.length);
            if (N <= maxAcc) {
                accounts.forEach((a, i) => out.push(accountRow(a, i + 1, W)));
            } else {
                accounts.slice(0, maxAcc - 1).forEach((a, i) => out.push(accountRow(a, i + 1, W)));
                out.push(fit(` ${c.gray(`+${N - (maxAcc - 1)} hesap daha`)}`, W));
            }
        }

        // alt bolum icin kalan satir: baslik(1) + ayirac(1) + tus satirlari + son satirda kaydirmayi onlemek icin 1
        const avail = Math.max(3, H - out.length - 3 - helpLines.length);
        out.push(sep("Son olaylar"));
        const lines = [];
        for (let i = events.length - 1; i >= 0 && lines.length < avail; i--) {
            const e = events[i];
            const parts = wrap(e.msg, Math.max(10, W - 7));
            const block = parts.map((p, k) => (k === 0 ? ` ${c.gray(e.t.slice(0, 5))} ` : "       ") + LEVEL_COLOR[e.level](p));
            for (let k = block.length - 1; k >= 0; k--) lines.unshift(block[k]);
        }
        lines.slice(-avail).forEach((l) => out.push(l));
    }

    out.push(sep(""));
    helpLines.forEach((l) => out.push(fit(l, W)));

    const frame = out.slice(0, Math.max(1, H - 1)).map((l) => l + "\x1b[K").join("\n");
    if (frame === lastFrame) return; // degisiklik yoksa konsola hic yazma
    lastFrame = frame;
    process.stdout.write("\x1b[H" + frame + "\x1b[J");
}

// Varsayilan tarayicida (Chrome vb.) adresi acar. cb(true/false)
function openUrl(url, cb) {
    let cmd, a;
    if (process.platform === "win32") { cmd = "cmd"; a = ["/c", "start", "", url]; }
    else if (process.platform === "darwin") { cmd = "open"; a = [url]; }
    else if ((process.env.PREFIX || "").includes("com.termux")) { cmd = "termux-open-url"; a = [url]; }
    else { cmd = "xdg-open"; a = [url]; }
    try { execFile(cmd, a, { windowsHide: true }, (e) => cb(!e)); } catch (_) { cb(false); }
}

function visitGuns(i) {
    const cr = CREDITS[i];
    if (!cr) return;
    gunsMsg = c.yellow(`Tarayicida aciliyor: ${cr.name}...`);
    render();
    openUrl(cr.url, (ok) => {
        gunsMsg = ok ? c.green(`${cr.name} sayfasi tarayicida acildi.`) : c.red(`Acilamadi, linki elle ac: ${cr.url}`);
        render();
    });
}

function openAccount(i) {
    const a = accounts[i];
    if (!a) return;
    selAcc = a;
    view = "account";
    gamePage = 0;
    ensureNames(a.games);
    render();
}

function onKey(str, key) {
    if (key && key.ctrl && key.name === "c") return shutdown("SIGINT");
    if (!str) return;
    const k = str.toLowerCase();
    if (k === "q") return shutdown("q tusu");
    const N = accounts.length;

    if (view === "main") {
        if (k === "a") { addAccountFlow().catch((e) => log.err("Hesap eklenemedi:", e)); return; }
        if (k === "d") { removeAccountFlow().catch((e) => log.err("Hesap silinemedi:", e)); return; }
        if (k === "s" && N) { view = "select"; render(); }
        if (k === "g") { view = "gunslol"; gunsMsg = null; render(); }
        return;
    }

    // guns.lol ekrani: sadece geri don
    if (view === "gunslol") {
        if (k === "m" || k === "g") { view = "main"; gunsMsg = null; render(); return; }
        if (/^[1-9]$/.test(k)) visitGuns(Number(k) - 1);
        return;
    }

    // select ve account gorunumlerinde ortak tuslar
    if (k === "m") { view = "main"; render(); return; }
    if (/^[1-9]$/.test(k)) { openAccount(Number(k) - 1); return; }
    if (view === "select") { if ((k === "n" || k === "p") && N) openAccount(0); return; }

    // hesap ekrani
    if (!accounts.includes(selAcc)) return;
    if (k === "n" || k === "p") { openAccount((accounts.indexOf(selAcc) + (k === "n" ? 1 : -1) + N) % N); return; }
    if (k === "l") { gamePage += 1; render(); return; }
    if (k === "e") { addGamesFlow(selAcc).catch((e) => log.err("Oyun eklenemedi:", e)); return; }
    if (k === "r") { removeGamesFlow(selAcc).catch((e) => log.err("Oyun cikarilamadi:", e)); return; }
    if (k === "x") { removeAllGamesFlow(selAcc).catch((e) => log.err("Oyunlar cikarilamadi:", e)); return; }
}
function enableKeys() {
    try {
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.on("keypress", onKey);
        process.stdin.resume();
    } catch (_) { /* tus destegi yoksa panel yine calisir */ }
}
function disableKeys() {
    process.stdin.removeListener("keypress", onKey);
    try { process.stdin.setRawMode(false); } catch (_) {}
    process.stdin.pause();
}

const ui = {
    // panel sadece gercek terminalde ve --sade verilmediyse acilir
    enabled: !!(process.stdout.isTTY && process.stdin.isTTY) && process.env.TERM !== "dumb" && !hasFlag("--sade"),
    active: false,
    depth: 0, // >0 ise bir soru/menu ekranda, panel arkada kapali kalir
    timer: null,
    start() {
        if (!this.enabled || this.active || this.depth > 0 || shuttingDown) return;
        if (rl) { try { rl.close(); } catch (_) {} rl = null; }
        this.active = true;
        process.stdout.write("\x1b[?1049h\x1b[?25l"); // alternatif ekran + imleci gizle
        enableKeys();
        this.timer = setInterval(render, 1000);
        lastFrame = "";
        process.stdout.on("resize", onResize);
        render();
    },
    stop(flush = false) {
        if (!this.active) return;
        this.active = false;
        clearInterval(this.timer);
        process.stdout.removeListener("resize", onResize);
        disableKeys();
        process.stdout.write("\x1b[?25h\x1b[?1049l"); // imleci geri getir + normal ekran
        if (flush) events.slice(-6).forEach((e) => console.log(plainLine(e)));
    },
    // Panel aciksa kapatir, fn (menu/soru) bitince paneli geri acar.
    // Sorular SIRAYLA calisir: ayni anda iki soru sorulursa readline ikincisini yutar ve program kilitlenirdi
    // (ornegin oyun eklerken baska hesaptan Steam Guard sorusu gelince).
    chain: Promise.resolve(),
    prompt(fn) {
        const run = async () => {
            this.depth++;
            this.stop(true);
            try { return await fn(); }
            finally { this.depth--; this.start(); }
        };
        const p = this.chain.then(run, run);
        this.chain = p.catch(() => {});
        return p;
    }
};
process.on("exit", () => ui.stop());

// ───────────────────────────── GIRDI (SORU) YARDIMCILARI ─────────────────────────────
function getRl() {
    if (!rl) {
        rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.on("SIGINT", () => shutdown("SIGINT"));
        rl.on("close", () => {
            // Giris sorusu beklenirken girdi kapandiysa (ornegin nohup / arka plan) sessizce takilma
            if (pendingQuestion && !shuttingDown) {
                console.error("\nGiris bilgisi isteniyor ama terminal girdisi yok. Once etkilesimli calistirip QR ile giris yap veya --token <TOKEN> kullan.");
                process.exit(1);
            }
        });
    }
    return rl;
}
// Not: soru/menu akislari ui.prompt(...) icinde cagrilmalidir (panel kapali olsun diye)
const ask = (q) => new Promise((res) => {
    pendingQuestion = true;
    getRl().question(q, (a) => { pendingQuestion = false; res(a); });
});
function askHidden(q) {
    return new Promise((res) => {
        const r = getRl();
        const orig = r._writeToOutput;
        let muted = false;
        r._writeToOutput = function (s) { if (!muted) orig.call(r, s); };
        pendingQuestion = true;
        r.question(q, (ans) => { pendingQuestion = false; r._writeToOutput = orig; process.stdout.write("\n"); res(ans); });
        muted = true; // soru yazildi, simdi yazilanlari gizle
    });
}

// ───────────────────────────── OYUN ISIMLERI ─────────────────────────────
function readNamesCache() {
    try { return JSON.parse(fs.readFileSync(NAMES_FILE, "utf8")); } catch (_) { return {}; }
}

async function fetchName(id) {
    try {
        const r = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&filters=basic&l=english`, {
            signal: AbortSignal.timeout(8000)
        });
        const j = await r.json();
        return (j && j[id] && j[id].data && j[id].data.name) || null;
    } catch (_) { return null; /* ag hatasi / rate limit - sessizce gec */ }
}

async function resolveNames(ids) {
    const cache = readNamesCache();
    const found = {};
    for (const id of ids) {
        if (cache[id]) continue;
        const n = await fetchName(id);
        if (n) found[id] = n;
        await sleep(400);
    }
    if (Object.keys(found).length) {
        try { fs.writeFileSync(NAMES_FILE, JSON.stringify({ ...readNamesCache(), ...found }, null, 2)); } catch (_) {}
    }
    names = { ...names, ...cache, ...found };
}

// Hesap ekraninda ismi bilinmeyen oyunlar icin arka planda bir kez dener
const triedNames = new Set();
function ensureNames(ids, force = false) {
    const missing = ids.filter((id) => !names[id] && (force || !triedNames.has(id)));
    if (!missing.length) return;
    missing.forEach((id) => triedNames.add(id));
    resolveNames(missing).then(() => render()).catch(() => {});
}

// list: [{ label, games }]  -> her hesabin oyun listesini isimleriyle yazdirir
function printGames(list) {
    if (!list.length) console.log(`\n${c.yellow("Kayitli hesap yok.")}`);
    for (const { label, games } of list) {
        console.log(`\n${c.bold(`${label} - kasilan oyunlar (${games.length}):`)}`);
        if (!games.length) console.log(c.yellow("  Liste bos - ana menu [s] > hesap > [e] ile AppID ekle."));
        games.forEach((id, i) => console.log(`  ${c.gray(String(i + 1).padStart(2))}. ${c.gray(String(id).padEnd(8))} ${nameOf(id)}`));
    }
    if (UNIQUE_GAMES.length > 32) log.warn(`Uyari: Steam limiti 32 oyun, ${UNIQUE_GAMES.length - 32} oyun disarida kaldi.`);
    console.log();
}

function banner() {
    console.log(c.cyan("╔" + "═".repeat(28) + "╗"));
    console.log(c.cyan("║") + c.bold(`  ZENITH HOURS  v${VERSION}`.padEnd(28)) + c.cyan("║"));
    console.log(c.cyan("║") + c.gray("  by ") + c.cyan(CREDIT_LINE.padEnd(23)) + c.cyan("║"));
    console.log(c.cyan("╚" + "═".repeat(28) + "╝"));
    console.log(c.gray("  Owner / Creator : ") + c.bold(CREDIT_LINE));
    console.log(c.gray("  guns.lol        : ") + c.cyan("ana menude [g]\n"));
}

// ───────────────────────────── HESAP DOSYASI / TOKEN ─────────────────────────────
function sanitizeGames(g) {
    if (!Array.isArray(g)) return undefined;
    return [...new Set(g.map(Number).filter((n) => Number.isSafeInteger(n) && n > 0))].slice(0, MAX_GAMES);
}
const sameAsDefault = (list) => list.length === GAMES.length && list.every((id, i) => id === GAMES[i]);

function loadSavedEntries() {
    if (fs.existsSync(ACCOUNTS_FILE)) {
        try {
            const arr = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf8"));
            return Array.isArray(arr) ? arr.filter((e) => e && typeof e.token === "string" && e.token) : [];
        } catch (e) {
            console.error("Uyari: hesaplar.json okunamadi:", e.message);
            return [];
        }
    }
    // eski surumden tasi (tek hesap)
    try {
        const t = fs.readFileSync(OLD_SESSION_FILE, "utf8").trim();
        if (t) return [{ token: t, name: "", sid: "" }];
    } catch (_) {}
    return [];
}

function saveAccounts() {
    const data = accounts
        .filter((a) => a.entry.token)
        .map((a) => {
            const o = { token: a.entry.token, name: a.entry.name || "", sid: a.entry.sid || "" };
            if (a.entry.games) o.games = a.entry.games; // sadece ozel liste varsa yazilir
            return o;
        });
    const json = JSON.stringify(data, null, 2);
    // once gecici dosyaya yaz, sonra yerine tasi: yazarken kapanma/elektrik kesilmesi dosyayi bozmaz
    try {
        const tmp = ACCOUNTS_FILE + ".tmp";
        fs.writeFileSync(tmp, json, { mode: 0o600 });
        fs.renameSync(tmp, ACCOUNTS_FILE);
        return true;
    } catch (_) {
        try { fs.writeFileSync(ACCOUNTS_FILE, json, { mode: 0o600 }); return true; }
        catch (e) { log.err("Hesap dosyasi yazilamadi:", e.message); return false; }
    }
}

function resetAccounts() {
    for (const f of [ACCOUNTS_FILE, OLD_SESSION_FILE]) { try { fs.unlinkSync(f); } catch (_) {} }
}

function inspectToken(token) {
    const parts = String(token).split(".");
    if (parts.length !== 3) return { ok: false, reason: "JWT formatinda degil" };
    try {
        const p = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
        const exp = p.exp ? p.exp * 1000 : null;
        if (exp && exp < Date.now()) return { ok: false, reason: "suresi dolmus" };
        return { ok: true, exp, aud: Array.isArray(p.aud) ? p.aud : [], sub: p.sub ? String(p.sub) : "" };
    } catch (_) {
        return { ok: false, reason: "cozumlenemedi" };
    }
}

// Token'i dogrular, giris secenekleri nesnesi dondurur (kaydetmez; kayit hesap eklenince yapilir)
function useToken(t, quiet = false) {
    const info = inspectToken(t);
    if (!info.ok) { log.warn("Token gecersiz:", info.reason); return null; }
    if (info.aud.length && !info.aud.includes("client")) {
        log.warn("Uyari: Bu token Steam istemcisi icin degil gibi gorunuyor, giris basarisiz olabilir. En iyisi QR ile giris yap.");
    }
    if (!quiet && info.exp) log(`Token ${Math.max(0, Math.floor((info.exp - Date.now()) / 86400000))} gun daha gecerli.`);
    return { refreshToken: t };
}

async function loginWithQR() {
    if (!qrcode) throw new Error("qrcode-terminal yuklu degil. 'npm install' calistir.");
    for (let attempt = 1; attempt <= 3; attempt++) {
        const session = new LoginSession(EAuthTokenPlatformType.SteamClient);
        const done = new Promise((resolve, reject) => {
            session.on("remoteInteraction", () => log("QR tarandi - telefondaki Steam uygulamasinda onay ver..."));
            session.on("authenticated", () => resolve(session.refreshToken));
            session.on("timeout", () => reject(new Error("QR suresi doldu")));
            session.on("error", reject);
        });
        done.catch(() => {}); // yakalanmamis hata olmasin
        try {
            const { qrChallengeUrl } = await session.startWithQR();
            console.log(`\n${c.bold("Steam mobil uygulamasi")} > Steam Guard / Hesap > 'QR kodu tara' ile okut:\n`);
            qrcode.generate(qrChallengeUrl, { small: true });
            console.log(c.gray("(QR ekrana sigmadiysa terminali uzaklastir/yazi boyutunu kucult)\n"));
            const token = await done;
            log.ok("QR ile giris onaylandi.");
            return token;
        } catch (e) {
            log.warn(`QR denemesi ${attempt}/3 basarisiz:`, e.message);
            try { session.cancelLoginAttempt(); } catch (_) {}
        }
    }
    throw new Error("QR girisi basarisiz oldu");
}

// Doner: giris secenekleri nesnesi | null (basarisiz) | false (kullanici vazgecti)
async function chooseLogin(allowCancel = false) {
    console.log(`\n${c.bold(accounts.length ? "Hesap ekle - giris yontemi sec:" : "Giris yontemi sec:")}`);
    console.log(`  ${c.cyan("1)")} QR kod   (Steam mobil uygulamasiyla tara - sifre/kod gerekmez) ${c.green("[onerilir]")}`);
    console.log(`  ${c.cyan("2)")} Kullanici adi + sifre (+ Steam Guard kodu)`);
    console.log(`  ${c.cyan("3)")} Refresh token yapistir (PC'den alinan)`);
    if (allowCancel) console.log(`  ${c.cyan("0)")} Vazgec`);
    console.log();
    const ch = (await ask(`Secim [${allowCancel ? "0/" : ""}1/2/3]: `)).trim();

    if (allowCancel && ch === "0") return false;
    if (ch === "2") {
        const accountName = (await ask("Steam Kullanici Adi: ")).trim();
        const password = await askHidden("Steam Sifre (yazarken gorunmez): ");
        if (!accountName || !password) { log.warn("Kullanici adi ve sifre bos olamaz."); return null; }
        return { accountName, password };
    }
    if (ch === "3") {
        return useToken((await ask("Refresh token: ")).trim());
    }
    try {
        const token = await loginWithQR();
        return { refreshToken: token };
    } catch (e) {
        log.err("Hata:", e.message);
        return null;
    }
}

// Menu acar; gecerli giris secenegi gelene kadar (veya vazgecilene kadar) tekrarlar. Vazgecilirse null.
function promptForLogin(allowCancel) {
    return ui.prompt(async () => {
        for (;;) {
            const o = await chooseLogin(allowCancel);
            if (o === false) return null;
            if (o) return o;
        }
    });
}

// ───────────────────────────── HESAP (HER HESABIN KENDI STEAM ISTEMCISI) ─────────────────────────────
class Account {
    constructor(entry, opts) {
        this.entry = entry;      // { token, name, sid }  -> hesaplar.json'a yazilan kisim
        this.opts = opts;        // logOn secenekleri
        this.tmpName = opts.accountName || "";
        this.statusKey = "connecting";
        this.reconnectAt = 0;
        this.idleMs = 0;
        this.gameMs = 0;         // oyun sayisiyla carpilmis sure (liste degisse de gecmis bozulmaz)
        this.segStart = null;
        this.online = false;
        this.isBlocked = false;
        this.retryCount = 0;
        this.timer = null;
        this.removed = false;
        this.log = makeLogger(this);
        this.client = new SteamUser({
            autoRelogin: true,
            renewRefreshTokens: true,
            enablePicsCache: CHECK_OWNERSHIP
        });
        this.bind();
    }

    label() {
        if (this.entry.name) return this.entry.name;
        if (this.tmpName) return this.tmpName;
        const i = accounts.indexOf(this);
        return `Hesap ${i >= 0 ? i + 1 : "?"}`;
    }

    segBegin() { if (!this.segStart) this.segStart = Date.now(); }
    segEnd() {
        if (!this.segStart) return;
        const d = Date.now() - this.segStart;
        this.idleMs += d;
        this.gameMs += d * this.games.length;
        this.segStart = null;
    }
    totalIdle() { return this.idleMs + (this.segStart ? Date.now() - this.segStart : 0); }
    gameHours() { return (this.gameMs + (this.segStart ? (Date.now() - this.segStart) * this.games.length : 0)) / 3600000; }

    // Bu hesabin kasacagi oyunlar: ozel liste varsa o, yoksa varsayilan
    get games() { return this.entry.games || GAMES; }

    startIdling() {
        const g = this.games;
        this.client.gamesPlayed(g);
        if (!g.length) {
            this.segEnd();
            this.statusKey = "empty";
            this.log.warn("Oyun listesi bos - ana menu [s] > bu hesap > [e] ile AppID ekle.");
            return;
        }
        this.segBegin();
        this.statusKey = "idling";
        this.log.ok(`${g.length} oyun icin saat/kart kasiliyor.`);
    }

    // Oyun listesini degistirir, kaydeder, hesap bagliysa aninda uygular
    setGames(list) {
        this.segEnd(); // eski oyun sayisiyla o ana kadarki saati hesapla
        this.entry.games = sameAsDefault(list) ? undefined : list;
        const saved = saveAccounts();
        if (this.online && !this.isBlocked) this.startIdling(); // sadece BU hesabin istemcisine uygulanir
        return saved;
    }

    connect() {
        if (shuttingDown || this.removed) return;
        if (Date.now() < throttleUntil) {
            // Steam limiti IP basinadir; baska bir hesap limite takildiysa bu hesap da denemesin
            return this.scheduleReconnect(throttleUntil - Date.now() + Math.floor(Math.random() * 5000), "Steam rate limit bekleniyor");
        }
        this.reconnectAt = 0;
        this.statusKey = "connecting";
        try {
            this.client.logOn(this.opts);
        } catch (e) {
            this.log.err("logOn hatasi:", e.message);
            this.scheduleReconnect(this.nextBackoff(), "logOn hatasi");
        }
    }

    connectIn(ms) {
        if (ms <= 0) return this.connect();
        this.statusKey = "connecting";
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.connect(), ms);
    }

    nextBackoff() {
        this.retryCount = Math.min(this.retryCount + 1, 10);
        return Math.min(RETRY_BASE_MS * 2 ** (this.retryCount - 1), RETRY_MAX_MS);
    }

    scheduleReconnect(ms, reason) {
        if (shuttingDown || this.removed) return;
        clearTimeout(this.timer);
        this.statusKey = "waiting";
        this.reconnectAt = Date.now() + ms;
        this.log.warn(`${reason} - ${ms >= 60000 ? Math.round(ms / 60000) + " dk" : Math.round(ms / 1000) + " sn"} sonra yeniden denenecek...`);
        this.timer = setTimeout(() => this.connect(), ms);
    }

    // Hesabi durdurur, listeden ve dosyadan cikarir
    remove(reason) {
        if (this.removed) return;
        this.log.warn(`${reason} - hesap listeden cikarildi.`);
        this.removed = true;
        this.online = false;
        this.segEnd();
        clearTimeout(this.timer);
        archivedHours += this.gameHours();
        const i = accounts.indexOf(this);
        if (i >= 0) accounts.splice(i, 1);
        try { this.client.gamesPlayed([]); this.client.logOff(); } catch (_) {}
        saveAccounts();
        if (!accounts.length && !ui.enabled && !shuttingDown && ui.depth === 0) {
            log.err("Hic hesap kalmadi, cikiliyor. Hesap eklemek icin: node index.js --hesap-ekle");
            process.exit(1);
        }
    }

    bind() {
        const a = this, cl = this.client, log = this.log;
        // her olay isleyicisi korumali: bir hesapta hata cikarsa program ve diger hesaplar etkilenmez
        const on = (ev, fn) => cl.on(ev, (...args) => {
            try {
                const r = fn(...args);
                if (r && typeof r.catch === "function") r.catch((e) => log.err(`${ev} olayinda hata:`, e));
            } catch (e) { log.err(`${ev} olayinda hata:`, e); }
        });

        on("loggedOn", () => {
            if (a.removed) return;
            a.retryCount = 0;
            a.isBlocked = false;
            a.reconnectAt = 0;
            a.online = true;

            // ayni hesap iki kez eklenmis mi? (kullanici adi/sifre ile eklenince ancak burada anlasilir)
            const sid = cl.steamID && cl.steamID.getSteamID64();
            if (sid) {
                const dup = accounts.find((o) => o !== a && o.entry.sid === sid);
                if (dup) return a.remove("Bu hesap zaten ekli (yinelenen kayit)");
                if (a.entry.sid !== sid) { a.entry.sid = sid; saveAccounts(); }
            }

            log.ok("Steam oturumu basariyla acildi!");
            cl.setPersona(SteamUser.EPersonaState.Online);
            a.startIdling();

            // isimleri arka planda coz (kasmayi geciktirmez); panelde 'l' ile gorulur, duz modda liste yazdirilir
            if (!namesStarted) {
                namesStarted = true;
                const done = () => { if (ui.active) render(); else if (!ui.enabled) printGames(gameLists()); };
                const ids = [...new Set(accounts.flatMap((x) => x.games))];
                ids.forEach((id) => triedNames.add(id));
                resolveNames(ids).then(done).catch(() => { if (!ui.enabled) printGames(gameLists()); });
            }
        });

        on("accountInfo", (name) => {
            if (a.removed) return;
            if (a.entry.name !== name) { a.entry.name = name; saveAccounts(); }
            log(`Hesap: ${name}`);
        });

        on("playingState", (blocked, playingApp) => {
            if (a.removed) return;
            if (blocked) {
                a.isBlocked = true;
                a.statusKey = "paused";
                a.segEnd();
                log.warn(`Hesap baska yerde oyun oynuyor (AppID ${playingApp}) - kasma duraklatildi, bosalinca otomatik devam eder.`);
            } else if (a.isBlocked) {
                a.isBlocked = false;
                log.ok("Diger oturum kapandi, kasma devam ediyor.");
                a.startIdling();
            }
        });

        on("appOwnershipCached", () => {
            if (a.removed) return;
            const missing = a.games.filter((id) => !cl.ownsApp(id));
            if (!missing.length) return log.ok("Kontrol: tum oyunlar hesapta mevcut.");
            log.warn(`Kontrol: ${missing.length} oyun hesapta YOK (saat sayilmaz):`);
            missing.forEach((id) => log.warn(`  - ${id} ${nameOf(id)}`));
        });

        on("refreshToken", (token) => {
            if (a.removed) return;
            a.entry.token = token;
            a.opts = { refreshToken: token };
            if (!a.entry.sid) a.entry.sid = inspectToken(token).sub || "";
            saveAccounts();
            if (LOGIN_ONLY) {
                printTokenInfo(token);
                try { cl.logOff(); } catch (_) {}
                setTimeout(() => process.exit(0), 500);
            }
        });

        on("steamGuard", async (domain, callback, lastCodeWrong) => {
            if (a.removed) return;
            if (lastCodeWrong) log.warn("Girilen kod yanlis, tekrar dene.");
            const where = domain ? `e-postana (${domain}) gelen` : "Steam mobil uygulamasindaki";
            const code = (await ui.prompt(() => ask(`[${a.label()}] Steam Guard kodu (${where}): `))).trim();
            callback(code);
        });

        on("disconnected", (eresult, msg) => {
            a.online = false;
            a.segEnd();
            if (!shuttingDown && !a.removed) {
                a.statusKey = "reconnecting";
                log.warn(`Baglanti koptu (${msg || eresult}). Otomatik yeniden baglaniliyor...`);
            }
        });

        on("error", (err) => {
            a.online = false;
            a.segEnd();
            if (shuttingDown || a.removed) return;

            const code = err && err.eresult;
            const msg = (err && err.message) || String(err);
            log.err("Oturum hatasi:", msg);

            if ([ER.InvalidPassword, ER.AccessDenied, ER.Expired].includes(code) || /refresh token|expired/i.test(msg)) {
                return a.remove("Kayitli oturum/sifre gecersiz (tekrar eklemek icin hesap ekle)");
            }
            if (code === ER.LoggedInElsewhere) {
                return a.scheduleReconnect(ELSEWHERE_WAIT_MS, "Hesap baska bir yerde acildi");
            }
            if (code === ER.RateLimitExceeded || code === ER.AccountLoginDeniedThrottle) {
                throttleUntil = Math.max(throttleUntil, Date.now() + THROTTLE_WAIT_MS);
                return a.scheduleReconnect(THROTTLE_WAIT_MS, "Steam cok fazla deneme gordu (rate limit)");
            }
            a.scheduleReconnect(a.nextBackoff(), "Hata");
        });
    }
}

// opts: { refreshToken } veya { accountName, password }. Yeni Account dondurur (zaten ekliyse null).
function createAccount(opts, entry, quiet = false) {
    const token = opts.refreshToken || null;
    const sid = (entry && entry.sid) || (token ? inspectToken(token).sub : "") || "";
    if (sid && accounts.some((a) => a.entry.sid === sid)) {
        if (!quiet) log.warn("Bu hesap zaten ekli, tekrar eklenmedi.");
        return null;
    }
    const acc = new Account({ token, name: (entry && entry.name) || "", sid, games: sanitizeGames(entry && entry.games) }, opts);
    accounts.push(acc);
    return acc;
}

// ───────────────────────────── PANELDEN HESAP EKLE / SIL ─────────────────────────────
let adding = false;
async function addAccountFlow() {
    if (adding || ui.depth > 0) return null;
    adding = true;
    try {
        const opts = await promptForLogin(true); // panel kapanir, menu acilir, bitince panel geri gelir
        if (!opts) return null;
        const acc = createAccount(opts);
        if (!acc) return null;
        saveAccounts();
        acc.log.ok(opts.refreshToken ? "Hesap eklendi, baglaniyor..." : "Hesap ekleniyor, baglaniyor...");
        acc.connect();
        return acc;
    } finally {
        adding = false;
    }
}

async function removeAccountFlow() {
    if (!accounts.length || ui.depth > 0) return;
    await ui.prompt(async () => {
        console.log(`\n${c.bold("Silinecek hesabi sec:")}`);
        accounts.forEach((a, i) => console.log(`  ${c.cyan(i + 1 + ")")} ${a.label()}  ${c.gray(STATUS[a.statusKey][0])}`));
        console.log(`  ${c.cyan("0)")} Vazgec\n`);
        const n = parseInt((await ask("Secim: ")).trim(), 10);
        if (!n || n < 1 || n > accounts.length) return;
        const acc = accounts[n - 1];
        const sure = (await ask(`"${acc.label()}" silinsin mi? [e/H]: `)).trim().toLowerCase();
        if (sure !== "e" && sure !== "evet") return;
        acc.remove("Kullanici sildi");
    });
}

// ───────────────────────────── HESABA OYUN EKLE / CIKAR ─────────────────────────────
function parseIds(raw) {
    const ids = [], bad = [];
    for (const t of raw.split(/[\s,;]+/).filter(Boolean)) {
        if (/^\d{1,10}$/.test(t) && Number(t) > 0) { const n = Number(t); if (!ids.includes(n)) ids.push(n); }
        else bad.push(t);
    }
    return { ids, bad };
}

const SAVE_MSG = (saved, n) => saved
    ? ["ok", `Liste otomatik kaydedildi (${n} oyun).`]
    : ["err", "Liste KAYDEDILEMEDI! hesaplar.json yazilamadi (disk/izin kontrol et)."];

async function addGamesFlow(acc) {
    if (ui.depth > 0) return;
    const msgs = []; // panel geri gelince olaylar bolumunde gorunur
    let added = [];
    await ui.prompt(async () => {
        console.log(`\n${c.bold(acc.label())} - oyun ekle  (${acc.games.length}/${MAX_GAMES})`);
        const raw = (await ask("Eklenecek AppID (birden fazlaysa bosluk/virgulle ayir, bos = vazgec): ")).trim();
        if (!raw) return;
        const { ids, bad } = parseIds(raw);
        if (bad.length) msgs.push(["warn", `Gecersiz AppID atlandi: ${bad.join(", ")}`]);
        const list = [...acc.games];
        for (const id of ids) {
            if (list.includes(id)) msgs.push(["warn", `${id} zaten listede.`]);
            else if (list.length >= MAX_GAMES) msgs.push(["warn", `${id} eklenemedi: Steam limiti ${MAX_GAMES} oyun.`]);
            else { list.push(id); added.push(id); }
        }
        if (!added.length || acc.removed) return;
        // Isimleri BEKLEMEDEN ekle (ag yavassa ekran takilmasin); isimler arka planda gelir
        const saved = acc.setGames(list);
        added.forEach((id) => msgs.push(["ok", `Eklendi: ${id} ${names[id] || ""}`.trim()]));
        msgs.push(SAVE_MSG(saved, list.length));
    });
    msgs.forEach(([lvl, m]) => acc.log[lvl](m));
    gamePage = 0;
    if (added.length) ensureNames(added, true);
    render();
}

async function removeGamesFlow(acc) {
    if (ui.depth > 0) return;
    const msgs = [];
    await ui.prompt(async () => {
        console.log(`\n${c.bold(acc.label())} - oyun cikar  (${acc.games.length} oyun)`);
        const raw = (await ask("Cikarilacak AppID (birden fazlaysa bosluk/virgulle ayir, bos = vazgec): ")).trim();
        if (!raw) return;
        const { ids, bad } = parseIds(raw);
        if (bad.length) msgs.push(["warn", `Gecersiz AppID atlandi: ${bad.join(", ")}`]);
        let list = [...acc.games], removedAny = false;
        for (const id of ids) {
            if (list.includes(id)) { list = list.filter((x) => x !== id); removedAny = true; msgs.push(["ok", `Cikarildi: ${id} ${names[id] || ""}`.trim()]); }
            else msgs.push(["warn", `${id} listede yok.`]);
        }
        if (removedAny && !acc.removed) msgs.push(SAVE_MSG(acc.setGames(list), list.length));
    });
    msgs.forEach(([lvl, m]) => acc.log[lvl](m));
    gamePage = 0;
    render();
}

async function removeAllGamesFlow(acc) {
    if (ui.depth > 0) return;
    const msgs = [];
    await ui.prompt(async () => {
        const n = acc.games.length;
        console.log(`\n${c.bold(acc.label())} - hepsini cikar`);
        if (!n) { msgs.push(["warn", "Listede zaten oyun yok."]); return; }
        const sure = (await ask(`${n} oyunun HEPSI cikarilsin mi? [e/H]: `)).trim().toLowerCase();
        if (sure !== "e" && sure !== "evet") return;
        if (acc.removed) return;
        msgs.push(["ok", `${n} oyunun hepsi cikarildi.`]);
        msgs.push(SAVE_MSG(acc.setGames([]), 0));
    });
    msgs.forEach(([lvl, m]) => acc.log[lvl](m));
    gamePage = 0;
    render();
}

// ───────────────────────────── DIGER ─────────────────────────────
function printTokenInfo(token) {
    console.log("\nHesap kaydedildi: " + ACCOUNTS_FILE);
    console.log("Telefona tasimak icin bu dosyayi kopyala VEYA asagidaki token'i kullan:");
    console.log("  node index.js --token <TOKEN>   (ya da hesap ekle menusunde 3. secenek)");
    console.log("\nRefresh token (SIFRE GIBI - kimseyle paylasma):\n" + token + "\n");
}

function wakeLock(on) {
    if (!(process.env.PREFIX || "").includes("com.termux")) return;
    execFile(on ? "termux-wake-lock" : "termux-wake-unlock", [], (e) => {
        if (on && !e) log.ok("Termux wake-lock aktif (ekran kapaliyken de calisir).");
    });
}

function shutdown(sig) {
    if (shuttingDown) return;
    shuttingDown = true;
    accounts.forEach((a) => a.segEnd());
    ui.stop(); // normal ekrana don, imleci geri getir
    log(`${sig} alindi, cikis yapiliyor... ${accounts.length} hesap | toplam ~${totalGameHours().toFixed(1)} oyun-saati`);
    clearInterval(heartbeatTimer);
    accounts.forEach((a) => {
        clearTimeout(a.timer);
        try { a.client.gamesPlayed([]); a.client.logOff(); } catch (_) {}
    });
    wakeLock(false);
    setTimeout(() => process.exit(0), 1500);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (e) => log.err("Beklenmeyen hata:", (e && e.message) || e));
process.on("uncaughtException", (e) => log.err("Beklenmeyen hata:", (e && e.message) || e));

// Program belli bir sure hic calismazsa (konsolda yazi secimi / QuickEdit, PC veya telefon uykusu) bunu loga yazar
function startWatchdog() {
    let last = Date.now();
    const t = setInterval(() => {
        const now = Date.now(), gap = now - last;
        last = now;
        if (gap > 8000 && !shuttingDown) {
            log.warn(`Program ~${Math.round(gap / 1000)} sn durmus! Konsolda yazi secimi (QuickEdit), PC/telefon uykusu veya sistem yuku olabilir.`);
        }
    }, 2000);
    t.unref();
}

function startHeartbeat() {
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
        if (ui.active) return; // panelde zaten canli gorunuyor
        accounts.forEach((a) => {
            a.log(`Durum: ${a.isBlocked ? "DURAKLATILDI (baska yerde oyun var)" : STATUS[a.statusKey][0].toLowerCase()} | ${fmtDur(a.totalIdle())} | ~${a.gameHours().toFixed(1)} oyun-saati`);
        });
        log(`Toplam: ${accounts.length} hesap | ~${totalGameHours().toFixed(1)} oyun-saati`);
    }, HEARTBEAT_MS);
}

function help() {
    console.log(`
Zenith Hours v${VERSION}  -  Steam saat + kart kasma botu  (coklu hesap)

  node index.js                  Normal calistir (tum kayitli hesaplar, canli panel)
  node index.js --sade           Panel yok, duz log
  node index.js --liste          Kasilan oyunlarin isimlerini goster
  node index.js --hesap-ekle     Acilista yeni hesap ekle, sonra hepsini kas
  node index.js --sifirla        Kayitli TUM hesaplari sil, yeniden giris yap
  node index.js --token <TOKEN>  Refresh token ile hesap ekle (2FA/sifre yok)
  node index.js --sadece-giris   Yeni hesap ekle, token'i kaydet/goster, cik (PC icin)
  node index.js --kontrol        Hesapta olmayan oyunlari raporla

Ana menu:        [s] hesap sec   [a] hesap ekle   [d] hesap sil   [g] guns.lol   [q] cikis
Hesap ekraninda: [1-9] hesaplar arasi gecis   [e] oyun ekle   [r] oyun cikar
                 [x] hepsini cikar   [l] oyun listesi sayfasi   [m] ana menuye don

Owner / Creator: ${CREDIT_LINE}
${CREDITS.map((x) => `  ${x.role}: ${x.url}`).join("\n")}
`);
}

async function main() {
    if (hasFlag("--yardim") || hasFlag("-h")) return help();

    if (hasFlag("--liste")) {
        const lists = loadSavedEntries().map((e, i) => ({ label: e.name || `Hesap ${i + 1}`, games: sanitizeGames(e.games) || GAMES }));
        await resolveNames([...new Set(lists.flatMap((x) => x.games))]);
        printGames(lists);
        process.exit(0);
    }

    if (process.stdout.isTTY && process.platform !== "win32") process.stdout.write(`\x1b]0;${APP_NAME}\x07`); // terminal basligi
    banner();
    if (ui.enabled) await sleep(2000); // acilis ekraninda isimler gorunsun
    if (hasFlag("--sifirla")) { resetAccounts(); log("Kayitli tum hesaplar silindi."); }

    wakeLock(true);

    // kayitli hesaplari yukle
    for (const e of loadSavedEntries()) {
        const info = inspectToken(e.token);
        if (!info.ok) { log.warn(`${e.name || "Bir hesabin"} tokeni gecersiz (${info.reason}), atlandi. Tekrar eklemen gerekecek.`); continue; }
        createAccount({ refreshToken: e.token }, e, true);
    }

    // --token / ortam degiskeni ile verilen token (zaten ekliyse sessizce gec)
    const extra = argValue("--token") || process.env.STEAM_REFRESH_TOKEN;
    if (extra) {
        const o = useToken(extra.trim(), true);
        if (o) createAccount(o, null, true);
    }

    // sadece giris: yeni hesabi ekle, token'i goster, cik
    if (LOGIN_ONLY) {
        const o = await promptForLogin(false);
        const acc = createAccount(o, null, true);
        if (o.refreshToken) {
            saveAccounts();
            printTokenInfo(o.refreshToken);
            process.exit(0);
        }
        acc.connect(); // refreshToken olayi tokeni yazdirip cikacak
        return;
    }

    // hesap yoksa ya da --hesap-ekle verildiyse once giris menusu
    const wantAdd = hasFlag("--hesap-ekle");
    if (wantAdd || !accounts.length) {
        const o = await promptForLogin(wantAdd);
        if (o) createAccount(o);
    }

    saveAccounts();
    if (fs.existsSync(ACCOUNTS_FILE)) { try { fs.unlinkSync(OLD_SESSION_FILE); } catch (_) {} } // eski dosya tasindi

    accounts.forEach((a, i) => a.connectIn(i * START_STAGGER_MS));
    startHeartbeat();
    startWatchdog();
    ui.start();
}

main().catch((e) => { console.error("Baslatma hatasi:", e.message); process.exit(1); });
