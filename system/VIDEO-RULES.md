# Aturan produksi video

Aturan 3D di bawah khusus template 3D; renderer custom mengikuti brief/style yang dipilih. Urutan intake dan automation mengikuti `CLAUDE-WORKFLOW.md`.

## Aturan kualitas naskah dan visual (agar layak posting dan bersaing)
- **Hook** di 2 detik pertama: baris 1 = pertanyaan/fakta mengejutkan, maks 10 kata, adegan `title` dengan visual. Penutup mudah diingat atau mengajak menonton lagi (loop). Tanpa CTA yang mengarang nama kanal.
- ~14 baris per menit, 8-16 kata per baris, satu ide per baris; kata kunci `*kata*` (satu-dua per adegan). Ganti visual/adegan tiap 3-5 detik (sudah otomatis lewat adegan per baris).
- **Setiap adegan punya visual 3D** kecuali `number`/`list`/1-2 adegan ringan; **jangan pakai `kind` yang sama dua kali berturut-turut**; variasikan >= 6 jenis. Pilih visual yang menjelaskan isi kalimat.
- Tipe adegan: `title{head,sub}`, `statement{head,sub}`, `number{value,prefix,suffix,label}` (animasi hitung-naik, pakai untuk angka penting), `list{head,items[]}` (maks 4 item pendek), `quote{head,by}`. `title/statement/quote` boleh punya `visual:{kind,...}`. Sub pendek (satu baris); head <= 5-6 kata.
- **Visual 3D** (`system/lib/kinds3d.js`): `network{nodes:[{icon,label}]}` (2-5 node), `globe{points}`, `cable{}`, `packets{}`, `bars{values,labels}`, `line{values}`, `steps{items[]}` (2-4), `neural{layers}`, `icons{items:[{icon,label}]}` (2-6), `ring{value,suffix}`, `orbit{center,items:[icon]}`, `timeline{items[]}` (2-4), `compare{left:{title,items},right:{title,items}}`.
- **Ikon 3D**: phone laptop router server cloud globe lock check magnifier book chat bolt gear clock star heart mail camera chart user doc shield cart bulb play wifi.
- Setiap film otomatis mendapat: dunia 3D (neon/glass/clay/cosmos), gerakan kamera berbeda tiap adegan (push/orbit/crane/pan/drift), tipografi 3D kata-per-kata, transisi, caption pendek (2-4 kata, pop/impact/kinetic/karaoke) di dalam safe zone Shorts/Reels/TikTok, SFX dan musik khas dunia itu.
- Jangan memakai merek dagang/logo/orang nyata (nama platform sebagai fakta boleh). Contoh domain/IP: `contoh.id`, `192.0.2.1`. Jangan menyebut domain berbahaya.
- Adegan dengan visual otomatis >= 4,2 dtk; teks otomatis diberi waktu baca; >= 2 keheningan nyata (otomatis).
- Mode lama 2D (`--engine 2d`, 16:9 bisa) hanya bila diminta.

## Aturan keras
- Tidak ada .srt. SFX tidak dobel (ditegakkan `system/audio/mixlib.py`). Jangan edit `_lib/`/`fonts/` di dalam film; ubah di `system/`. Jangan edit library upstream `~/lemo-opuscar` atau proyek lain.
- Perubahan di `system/lib` atau `system/audio`: jalankan `node system/tools/caption-lab.mjs` (caption 2D lama) dan satu build uji (`python system/selftest.py`).
- Jangan pernah mengklaim sudah menonton video penuh atau mendengar audio.

## Tambahan v3 (2026-11-12): wajib diikuti
- **Brand**: setiap video otomatis memakai watermark `ngetehnology` di kiri atas (`system/brand.json`; jangan dihapus). Seri: chip kanan atas "Judul singkat · EP n/N" dan kartu "Berikutnya" di akhir.
- **Look dari topik**: `new-film.sh` memanggil `system/py/art_director.py` (palet, motif, dan, bila style AUTO, dunia/caption/mood dari topik). Style yang dipilih pengguna tetap menentukan dunia.
- **Hook**: tulis 3-5 kandidat hook (kontrarian, kesenjangan rasa ingin tahu, taruhan spesifik, POV/empati, pattern interrupt), skor, pilih satu. Frame 1 sudah berisi visual dan teks (engine memberi pre-roll). Penutup harus menggemakan kata hook (loop).
- **Beat**: baris panjang dipecah dengan `"beats":[{"at":0,...scene},{"at":<indeks kata>,...scene}]` supaya visual berganti tiap 2,5-4 detik. Teks tiap beat harus pendek (bantalan baca 1,0 dtk di 3D). `system/py/lint_script.py` (dipanggil build.sh) memeriksa hook, variasi, kecepatan, loop.
- **Deliverable wajib** di `final/`: mp4, thumbnail.jpg, **CAPTION.txt, HASHTAGS.txt**, POST.md, QA-REPORT.md, CREDITS. Tulis `films/<slug>/post.json` SEBELUM atau SETELAH build lalu jalankan `make_post.py`; `build.sh` mencetak `NOT COMPLETE` bila ada yang hilang (`system/py/check_deliverables.py`). Hashtag: Instagram maks 5 (termasuk #ngetehnology, ditambahkan otomatis).
- **RAM**: `build.sh` memilih jumlah worker dari RAM bebas (1 worker bila < 3,5 GB). Minta pengguna menutup aplikasi berat bila render lambat. Jangan memakai `?hq=1` (AO/DOF) kecuali RAM longgar: tidak stabil di iGPU Intel.
