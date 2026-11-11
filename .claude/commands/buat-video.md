---
description: Buat satu video vertikal (Shorts/Reels/TikTok/Facebook) siap posting dari judul. Tanya sekali (deskripsi + style), lalu semuanya otomatis.
argument-hint: "Judul [| deskripsi] [| style]"
---

Baca juga `system/QUALITY-GATES.md`: kualitas upstream dan danger zone (UI/crop serta pitfalls style) adalah quality gate untuk setiap hasil. Claude menanganinya otomatis dari brief; jangan meminta user mengedit file. Jangan melaporkan kualitas setara atau siap posting sebelum ada bukti review video, safe zone, audio dan QA.

Kamu memproduksi satu video VERTIKAL 9:16 (1080x1920) di root checkout proyek saat ini untuk YouTube Shorts, Instagram Reels, TikTok dan Facebook Reels, ditonton di HP. Tidak diposting otomatis. Baca `system/README.md` dan CLAUDE.md bila belum. Istilah teknis boleh bahasa Inggris. Input: $ARGUMENTS (format `Judul | deskripsi | style`; bagian setelah judul opsional).

## Routing engine

Default command ini tetap Lemo-Opuscar. Jika pengguna secara eksplisit meminta toolkit/engine `make-an-anime` atau alur `/buat-anime`, muat `.claude/skills/make-an-anime/SKILL.md` dan jalankan workflow anime dengan brief, style, durasi dan jumlah episode yang sama. Untuk seri anime, pertahankan style/cast bersama dan rencana per episode di workspace `anime/<slug>/`; jangan menjalankan `system/series.py` pada format anime. Kata “anime” sebagai deskripsi look saja tidak otomatis mengizinkan Fal berbayar atau mengganti engine.

## Arahan visual dinamis dari chat

Pengguna cukup memberi judul, cerita dan gaya dengan bahasa bebas di `$ARGUMENTS` atau percakapan lanjutan. Contoh: “anime pastel, kamera pelan, teks minimal”, “seperti contoh yang saya unggah”, atau “pakai template yang tadi tapi lebih gelap”. Jangan meminta user mengedit STYLE.md/JSON/renderer; Claude yang menyusun dan memperbaruinya otomatis. Terima gaya di luar 66 katalog dan campurannya. Tanya hanya bagian penting yang belum jelas; bila gaya sudah disebut, jangan meminta user memilih katalog lagi.

## Pilihan template/style (prioritas atas default lama)

Baca `system/STYLE-WORKFLOW.md`. Gunakan root checkout saat ini, termasuk saat dijalankan di cloud/WSL. Input boleh menambahkan `| template` atau `| custom` setelah style. Claude menentukan mode implementasi dari permintaan; jangan membebani pengguna dengan pilihan teknis template/custom bila look yang diminta sudah jelas. Jika pengguna menyebut style resmi tanpa memilih template, gunakan custom. Pilihan eksplisit menang atas default 3D dan art director topik.

Pada custom dari style resmi, baca spesifikasi library Opuscar; untuk gaya bebas, turunkan ciri visual langsung dari brief pengguna. Claude sendiri yang menulis `STYLE-CONTRACT.md`, set `film.json` → `render: "custom"`, lalu buat `main.js` khusus sesuai style; stub template harus diganti sebelum build. Terapkan caption, brand dan timeline dalam renderer custom. Jika engine tidak tersedia, laporkan BLOCKED. Gaya bebas tidak membutuhkan file STYLE.md yang sudah ada; jangan fallback diam-diam. Pada template, nyatakan hasil adalah template bersama dengan tema pilihan, bukan renderer asli dari 66 style. Periksa frame terhadap kontrak sebelum final; nama style/palet saja tidak cukup. Aturan visual 3D di bawah hanya berlaku untuk template 3D; style custom mengikuti renderer dan ciri STYLE.md.

## 1. Tanya SEKALI (hanya bila belum ada di input)
Jika diperlukan, satu panggilan AskUserQuestion: **Deskripsi** ("Bebas, Claude riset dan tentukan (Recommended)" / "Saya tulis sendiri") dan **Gaya/template** (input bebas; bila belum punya pilihan, tawarkan 3 rekomendasi sesuai topik atau katalog sebagai contoh + "Otomatis"; jangan batasi ke katalog). Default: 9:16, 30 fps (60 bila style 60 fps), durasi 45-75 detik (maks 90 detik agar muat di Reels), bahasa narasi = bahasa judul. Setelah ini JANGAN bertanya lagi sampai laporan akhir.

## 2. Otomatis sampai selesai
1. **Riset** dengan WebSearch dan sumber primer: klaim penting butuh >= 2 sumber independen; klaim keyakinan rendah tidak masuk naskah; angka perkiraan diberi "sekitar"; jangan mengarang. Catat klaim + URL + keyakinan di `films/<slug>/TREATMENT.md`; setelah naskah jadi, cek tiap baris faktual terhadap catatan itu.
2. `sh system/new-film.sh "<judul>" --style <slug|nomor> --lang <id|en> --minutes <n> --desc "<deskripsi>" --art style` (folder dibuat otomatis dengan stub template; `--art style` menjaga palet style terpilih. Untuk template AUTO yang look-nya dari topik, gunakan `--art topic`. Untuk custom, ikuti kontrak di atas dan pilih engine/fps sesuai brief atau spesifikasi resmi bila relevan sebelum build).
   Untuk gaya bebas di luar katalog, gunakan `--style AUTO` hanya untuk scaffold awal; jangan kirim deskripsi bebas sebagai slug katalog (akan ditolak skrip). Claude lalu mencatat `requested_style`/`style_name` dari chat, menerapkan palet dan renderer custom sesuai brief. Nama bawaan scaffold bukan style final.
3. Tulis `films/<slug>/lines.json` (aturan di bawah); pada custom, tulis juga renderer `main.js` dan bukti frame yang cocok dengan style, bukan hanya JSON. Uji pelafalan kata asing/singkatan dulu bila ragu (sintesis suara kerap keliru): tambahkan `"say"` (cara baca) dan `"asr"` (teks yang diharapkan Whisper).
4. `sh system/build.sh <slug>` (suara dengan retry, ASR, timeline, render 3D, mix, mux, thumbnail, QA, laporan). Jalankan di background (run_in_background) dan tunggu.
5. **Tinjauan visual wajib**: `sh system/review.sh <slug>`; LIHAT `out/review/sheet-*.jpg` dengan Read. Periksa: teks meluber/terpotong di tepi, tumpang tindih, label tidak terbaca, kontras buruk, ilustrasi kecil atau tertutup caption, area kosong. Perbaiki di lines.json (atau `system/lib` bila bug umum), `SKIP_VOICE=1 sh system/build.sh <slug>`, tinjau ulang. Maksimal 2 putaran. Debug posisi teks: `node system/tools/texts3d.mjs films/<slug> <t...>`; lihat cepat: `sh system/tools/stills3d.sh <slug> <t...>`.
6. **Thumbnail 9:16** (hanya untuk Shorts/Reels): isi `film.json` -> `thumb: {text (maks 5 kata, kata kunci diapit *...*, jujur), kicker (mis. "WASPADA"), variant}`; `sh system/thumb.sh <slug>` membuat 3 varian (1 hero, 2 satu kata raksasa + objek 3D, 3 angka/tanda tanya) + `out/thumbs/sheet.jpg` (besar dan 200 px). LIHAT sheet, pilih yang paling terbaca di 200 px dengan satu fokus, jalankan `sh system/thumb.sh <slug> <varian>`.
7. **Paket posting**: tulis `films/<slug>/post.json` (title <= 70 karakter, caption <= 220 karakter: hook + manfaat + satu pertanyaan, hashtags 5-8 dari spesifik ke luas termasuk 1-2 luas seperti #edukasi/#fyp, description, keywords, pinned_comment, sources) lalu `~/lemo-opuscar/.venv/bin/python system/py/make_post.py films/<slug>/post.json films/<slug>/final/POST.md films/<slug>/film.json`. Tidak ada hashtag yang menjamin FYP; jangan menjanjikannya. Jangan memposting apa pun.
8. **Laporan akhir** singkat: path `films/<slug>/final/` (mp4, thumbnail.jpg, POST.md, QA-REPORT.md, CREDITS), status VERIFIED/READY/LIMITED/NOT TESTED/BLOCKED dari QA-REPORT, baris suara yang ditandai Whisper (minta pengguna mendengarkan), catatan Edge-TTS, tawaran `sh system/clean.sh <slug>`.

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
