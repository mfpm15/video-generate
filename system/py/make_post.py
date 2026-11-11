"""make_post.py <post.json> <out POST.md> [film.json]: posting pack for MANUAL posting. Writes POST.md (detailed) AND CAPTION.txt + HASHTAGS.txt (plain text, copy-paste) next to it.
post.json: {"title","caption","hashtags":["#..."],"description","pinned_comment","keywords":[...],"sources":[...],"notes"}
Rules (platform limits reported by 2026 sources; verify on the official help pages): Instagram max 5 hashtags, TikTok 5 hashtags and a short caption (150-300 characters perform best, API limit 2200),
YouTube Shorts title <= 100 characters (we keep <= 70), first 3 hashtags are shown above the title. The brand tag #ngetehnology is added to every platform set. No hashtag guarantees reach."""
import json, os, re, sys
P = json.load(open(sys.argv[1], encoding='utf-8')); out = sys.argv[2]; d = os.path.dirname(os.path.abspath(out))
F = json.load(open(sys.argv[3], encoding='utf-8')) if len(sys.argv) > 3 and os.path.exists(sys.argv[3]) else {}
BRAND = '#ngetehnology'; w = []
tags = [t if t.startswith('#') else '#' + t for t in P.get('hashtags', [])]; tags = [t for t in tags if t.lower() != BRAND]
if len(set(t.lower() for t in tags)) != len(tags): w.append('duplicate hashtags')
if not 4 <= len(tags) <= 8: w.append(f'{len(tags)} topic hashtags (want 4-8)')
if any(re.search(r'\s', t) for t in tags): w.append('a hashtag contains a space')
if len(P.get('title', '')) > 70: w.append(f"title is {len(P['title'])} characters (want <= 70)")
if len(P.get('caption', '')) > 300: w.append(f"caption is {len(P['caption'])} characters (want <= 300)")
if not P.get('pinned_comment'): w.append('no pinned comment')
if not P.get('sources'): w.append('no sources listed: facts are unverified for the poster')
def tagset(n): return ' '.join(tags[:n - 1] + [BRAND])            # n tags total including the brand tag
ig, tt, yt = tagset(5), tagset(5), ' '.join(tags[:2] + [BRAND])    # YouTube shows the first three above the title
sec = F.get('series'); th = F.get('thumb', {}); title = P.get('title', F.get('title', '')); cap = P.get('caption', '')
txt = [f'== YOUTUBE SHORTS ==', 'Judul:', title, '', 'Deskripsi:', (P.get('description') or cap) + '\n\n' + ' '.join(tags[:2] + [BRAND]), '',
       '== TIKTOK ==', cap, tt, '', '== INSTAGRAM REELS ==', cap, ig, '', '== FACEBOOK REELS ==', cap, tagset(3), '', '== KOMENTAR TERSEMAT (tulis sendiri setelah posting) ==', P.get('pinned_comment', '')]
os.makedirs(d, exist_ok=True); open(os.path.join(d, 'CAPTION.txt'), 'w', encoding='utf-8').write('\n'.join(txt) + '\n')
open(os.path.join(d, 'HASHTAGS.txt'), 'w', encoding='utf-8').write('\n'.join([f'YouTube Shorts: {yt}', f'TikTok: {tt}', f'Instagram Reels (maks 5): {ig}', f'Semua hashtag topik: {" ".join(tags)} {BRAND}']) + '\n')
L = [f'# POST: {title}', '']
if sec: L += [f"Seri **{sec['name']}**, episode {sec['n']}/{sec['total']}.", '']
if th: L += [f"Thumbnail: `final/thumbnail.jpg` (teks: {th.get('text', '')})", '']
L += ['## YouTube Shorts', f'**Judul:** {title}', '', '**Deskripsi:**', P.get('description') or cap, '', yt + '   (tiga hashtag pertama tampil di atas judul)', '', f"**Tags/keywords:** {', '.join(P.get('keywords', []))}", '',
      '## TikTok', cap, tt, '', '## Instagram Reels (maks 5 hashtag)', cap, ig, '', '## Facebook Reels', cap, tagset(3), '', '## Komentar tersemat', P.get('pinned_comment', ''), '', '## Sumber (verifikasi sebelum posting)'] + [f'- {s}' for s in P.get('sources', [])] + ['']
if P.get('notes'): L += ['## Catatan', P['notes'], '']
L += ['## Checklist', '- [ ] Tonton videonya sekali dengan suara (proses build tidak bisa mendengar).', '- [ ] Baca sumber di atas untuk angka yang meragukan.', '- [ ] Aktifkan label konten AI/sintetis bila platform menyediakannya (suara sintetis).', '- [ ] Cek posisi watermark ngetehnology di HP untuk tiap platform.', '- [ ] Masukkan ke playlist seri (YouTube) dan sebut episode berikutnya di komentar tersemat.', '']
if w: L += ['## Peringatan make_post.py'] + [f'- {x}' for x in w] + ['']
open(out, 'w', encoding='utf-8').write('\n'.join(L)); print('wrote', out, '+ CAPTION.txt + HASHTAGS.txt | warnings:', w or 'none')
