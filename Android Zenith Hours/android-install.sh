#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Zenith Hours - Android (Termux) kurulum / guncelleme
#  Owner / Creator: Sugesw / Exufo
#
#  Kurulum  : curl -fsSL https://raw.githubusercontent.com/SugeswChr/Zenith-Hours/main/Android/android-install.sh | bash
#  Baslat   : zenith
#  Guncelle : zenith-guncelle
#
#  Bu betik SADECE kod dosyalarini (index.js, package.json ...) GitHub'dan indirir.
#  Giris bilgilerin, token'in ve oyun listen (hesaplar.json) telefonunda kalir:
#  betik onlara dokunmaz, silmez ve hicbir yere gondermez.
# ─────────────────────────────────────────────────────────────────────────────
set -u

DEFAULT_REPO="SugeswChr/Zenith-Hours"
DEFAULT_BRANCH="main"
DEFAULT_SUBDIR="Android"   # kod dosyalari depodaki Android/ klasorunde

# Ortam degiskenleriyle de degistirilebilir: ZENITH_REPO, ZENITH_BRANCH, ZENITH_SUBDIR, ZENITH_DIR
DIR="${ZENITH_DIR:-$HOME/ZenithHours}"
MODE="kur"
[ "${1:-}" = "--guncelle" ] && MODE="guncelle"

# daha once kurulduysa kaynak bilgisi .kaynak dosyasinda saklanir
KAYNAK_REPO=""; KAYNAK_BRANCH=""; KAYNAK_SUBDIR=""
[ -f "$DIR/.kaynak" ] && . "$DIR/.kaynak"
REPO="${ZENITH_REPO:-${KAYNAK_REPO:-$DEFAULT_REPO}}"
BRANCH="${ZENITH_BRANCH:-${KAYNAK_BRANCH:-$DEFAULT_BRANCH}}"
SUBDIR="${ZENITH_SUBDIR:-${KAYNAK_SUBDIR:-$DEFAULT_SUBDIR}}"
RAW="${ZENITH_RAW:-https://raw.githubusercontent.com/$REPO/$BRANCH${SUBDIR:+/$SUBDIR}}"

# Zorunlu kod dosyalari / isteğe bagli dosyalar. (hesaplar.json burada YOK - bilerek.)
REQUIRED="index.js package.json android-install.sh"
OPTIONAL="README.md PRIVACY.md"

if [ -t 1 ]; then G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; C=$'\e[36m'; B=$'\e[1m'; N=$'\e[0m'; else G=""; Y=""; R=""; C=""; B=""; N=""; fi
ok()   { echo "${G}[+]${N} $*"; }
warn() { echo "${Y}[!]${N} $*"; }
err()  { echo "${R}[x]${N} $*" >&2; }
step() { echo; echo "${C}${B}$*${N}"; }

echo "${C}╔════════════════════════════════════╗${N}"
echo "${C}║${N}${B}  ZENITH HOURS - ANDROID            ${N}${C}║${N}"
echo "${C}║${N}  by Sugesw / Exufo                 ${C}║${N}"
echo "${C}╚════════════════════════════════════╝${N}"

case "$REPO" in
    ""|KULLANICI/*)
        err "GitHub deposu ayarli degil."
        err "Betigin basindaki DEFAULT_REPO satirini kendi deponla degistir (ornek: sugesw/zenith-hours)"
        err "veya su sekilde calistir:  ZENITH_REPO=kullanici/depo bash android-install.sh"
        exit 1 ;;
esac

# ── 1) Gerekli paketler ──────────────────────────────────────────────────────
step "1/4  Gerekli paketler"
if [ "$MODE" = "kur" ] && command -v pkg >/dev/null 2>&1; then
    pkg update -y >/dev/null 2>&1 || warn "pkg update basarisiz oldu, devam ediliyor."
fi
if ! command -v node >/dev/null 2>&1; then
    if command -v pkg >/dev/null 2>&1; then
        pkg install -y nodejs curl || { err "Node.js kurulamadi. Internetini kontrol edip tekrar dene."; exit 1; }
    else
        err "Node.js bulunamadi. Once Node.js 18+ kur: https://nodejs.org"
        exit 1
    fi
fi
command -v curl >/dev/null 2>&1 || { command -v pkg >/dev/null 2>&1 && pkg install -y curl; }
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$NODE_MAJOR" -lt 18 ]; then
    err "Node.js 18 veya uzeri gerekli (bulunan: $(node -v)). 'pkg upgrade' ile guncelle."
    exit 1
fi
ok "Node.js $(node -v)"

# ── 2) Kod dosyalarini indir ─────────────────────────────────────────────────
step "2/4  Kod dosyalari indiriliyor ($REPO @ $BRANCH)"
mkdir -p "$DIR" || { err "$DIR olusturulamadi."; exit 1; }

fetch() {   # fetch <dosya> <1=zorunlu | 0=istege bagli>
    local f="$1" must="$2" tmp="$DIR/.indiriliyor.$1"
    if curl -fsSL --retry 3 --connect-timeout 15 "$RAW/$f" -o "$tmp"; then
        mv -f "$tmp" "$DIR/$f" && ok "$f"
    else
        rm -f "$tmp"
        if [ "$must" = "1" ]; then
            err "$f indirilemedi: $RAW/$f"
            err "Depo adini, dal adini ve internetini kontrol et. (Mevcut dosyalara dokunulmadi.)"
            exit 1
        fi
        warn "$f indirilemedi (istege bagli, atlandi)."
    fi
}
for f in $REQUIRED; do fetch "$f" 1; done
for f in $OPTIONAL; do fetch "$f" 0; done
chmod +x "$DIR/android-install.sh" 2>/dev/null
printf 'KAYNAK_REPO=%s\nKAYNAK_BRANCH=%s\nKAYNAK_SUBDIR=%s\n' "$REPO" "$BRANCH" "$SUBDIR" > "$DIR/.kaynak"

# ── 3) Bagimliliklar ─────────────────────────────────────────────────────────
step "3/4  Bagimliliklar (npm install)"
( cd "$DIR" && npm install --omit=dev --no-audit --no-fund ) || { err "npm install basarisiz oldu."; exit 1; }
ok "Bagimliliklar hazir."

# ── 4) Kisayol komutlari ─────────────────────────────────────────────────────
step "4/4  Kisayol komutlari"
BIN="${PREFIX:-$HOME/.local}/bin"
mkdir -p "$BIN"
cat > "$BIN/zenith" <<EOF
#!/usr/bin/env bash
cd "$DIR" && exec node index.js "\$@"
EOF
cat > "$BIN/zenith-guncelle" <<EOF
#!/usr/bin/env bash
exec bash "$DIR/android-install.sh" --guncelle
EOF
chmod +x "$BIN/zenith" "$BIN/zenith-guncelle"
ok "zenith          -> botu baslatir"
ok "zenith-guncelle -> kodu GitHub'dan gunceller (hesaplarina dokunmaz)"

echo
echo "${G}${B}Hazir!${N}"
if [ -f "$DIR/hesaplar.json" ]; then
    echo "Kayitli hesaplarin ve oyun listen korundu: $DIR/hesaplar.json"
fi
echo "Baslatmak icin yaz:  ${B}zenith${N}"
case ":$PATH:" in *":$BIN:"*) ;; *) warn "$BIN PATH icinde degil. Su komutla da baslatabilirsin: cd $DIR && node index.js" ;; esac
