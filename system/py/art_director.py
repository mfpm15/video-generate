"""art_director.py "<title>" "<description>" [--style-world W] [--seed S]: picks the look from the TOPIC (not only from the chosen style).
register (mood of the topic) -> hue + harmony scheme -> palette (bg1, bg2, accent, alt, alt2) with WCAG contrast check, world, caption effect, sound mood, motif icons.
Prints JSON. new-film.sh merges it into film.json (--art topic, default). The style the user picks still supplies the world unless it is overridden here.
Colour associations are tendencies, not science (sources: general branding guides); contrast follows WCAG 2.x (4.5:1 normal text)."""
import colorsys, json, re, sys, zlib

REG = {   # register: (keywords, hue, scheme, world, caption, mood, motifs)
 'threat':  (r'malware|peretas|hack|curi|bahaya|penipu|scam|virus|siber|phishing|bocor|ransom|kredensial|serang|ancam|waspada|palsu|dibajak|stealer', 6, 'complement', 'cosmos', 'impact', 'cinematic', ['lock', 'shield', 'magnifier', 'user', 'mail']),
 'money':   (r'uang|keuangan|saham|investasi|kripto|bitcoin|bank|ekonomi|gaji|pajak|bisnis|harga|untung|rugi|dompet|cuan', 142, 'analogous', 'glass', 'pop', 'tech', ['chart', 'cart', 'star', 'doc', 'bulb']),
 'health':  (r'kesehatan|tubuh|sehat|penyakit|obat|tidur|gizi|diet|olahraga|medis|otak|jantung|stres|mental', 172, 'analogous', 'glass', 'karaoke', 'organic', ['heart', 'user', 'clock', 'check', 'bulb']),
 'science': (r'sains|fisika|kimia|biologi|semesta|angkasa|planet|atom|energi|teknologi|internet|komputer|\bai\b|robot|jaringan|data|cahaya|lensa|mikroskop', 214, 'triadic', 'neon', 'pop', 'tech', ['globe', 'gear', 'bolt', 'wifi', 'server']),
 'nature':  (r'alam|hewan|tumbuhan|lingkungan|iklim|laut|hutan|makanan|kuliner|masak|cuaca|bumi', 98, 'analogous', 'clay', 'kinetic', 'organic', ['heart', 'star', 'bulb', 'globe', 'camera']),
 'history': (r'sejarah|perang|kuno|kerajaan|budaya|tradisi|peradaban|candi|masa lalu', 38, 'complement', 'cosmos', 'karaoke', 'cinematic', ['book', 'clock', 'star', 'doc', 'globe']),
 'fun':     (r'lucu|unik|trivia|fakta|tips|motivasi|kreatif|hobi|game|film|musik|hiburan', 318, 'triadic', 'clay', 'kinetic', 'organic', ['star', 'play', 'heart', 'chat', 'camera']),
 'news':    (r'berita|terbaru|viral|politik|kebijakan|pemerintah|resmi|laporan|rilis|update', 44, 'complement', 'neon', 'impact', 'tech', ['chat', 'doc', 'globe', 'mail', 'clock']),
}
def lum(rgb):
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    r, g, b = map(f, rgb); return .2126 * r + .7152 * g + .0722 * b
def contrast(a, b): la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + .05) / (lb + .05)
def hsl(h, s, l): r, g, b = colorsys.hls_to_rgb((h % 360) / 360, l, s); return (r, g, b)
hexc = lambda rgb: '#%02X%02X%02X' % tuple(round(x * 255) for x in rgb)
def palette(h, scheme, light=False, seed=0):
    jit = (seed % 7) - 3                                                  # small per-film hue jitter so two videos of the same register still differ
    h = h + jit; off = {'complement': (180, 40), 'analogous': (32, -32), 'triadic': (120, 240)}[scheme]
    bg1, bg2 = hsl(h, .32, .05), hsl(h, .30, .13)
    l = .62
    while True:                                                           # lift the accent until it reads on the background (WCAG 4.5:1)
        acc = hsl(h, .88, l)
        if contrast(acc, bg1) >= 4.5 or l >= .8: break
        l += .03
    return dict(bg1=hexc(bg1), bg2=hexc(bg2), accent=hexc(acc), alt=hexc(hsl(h + off[0], .78, .62)), alt2=hexc(hsl(h + off[1], .8, .66)), pattern='plain', contrast_accent_on_bg=round(contrast(acc, bg1), 1))
def direct(title, desc='', style_world=None, seed=0):
    text_t, text_d = title.lower(), (desc or '').lower(); best, score = None, 0
    for name, (kw, *_r) in REG.items():
        sc = 2 * len(re.findall(kw, text_t)) + len(re.findall(kw, text_d))
        if sc > score: best, score = name, sc
    if not best: return dict(register='curious', palette=None, world=style_world, caption=None, mood=None, motifs=['star', 'bulb', 'globe', 'chat', 'bolt'], matched=0)
    kw, hue, scheme, world, cap, mood, motifs = REG[best]
    return dict(register=best, palette=palette(hue, scheme, False, seed), world=world, caption=cap, mood=mood, motifs=motifs, matched=score)
if __name__ == '__main__':
    a = sys.argv[1:]; seed = zlib.crc32(a[0].encode()) if a else 0
    print(json.dumps(direct(a[0], a[1] if len(a) > 1 and not a[1].startswith('--') else '', None, seed), ensure_ascii=False))
