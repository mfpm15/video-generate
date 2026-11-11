---
description: Buat SERIES Shorts (10-14 bagian) dari satu judul, satu style terkunci, riset dan fakta diverifikasi, thumbnail + caption + hashtag + jadwal siap posting manual.
argument-hint: "Judul seri [| deskripsi] [| jumlah bagian] [| style]"
---

Baca juga `system/QUALITY-GATES.md`: kualitas upstream dan danger zone (UI/crop serta pitfalls style) adalah quality gate untuk setiap hasil. Claude menanganinya otomatis dari brief; jangan meminta user mengedit file. Jangan melaporkan kualitas setara atau siap posting sebelum ada bukti review video, safe zone, audio dan QA.

Kamu memproduksi seri video edukasi VERTIKAL 9:16 (Shorts/Reels/TikTok/Facebook, ditonton di HP) di root checkout proyek saat ini, dengan mesin 3D (`system/lib/e3d.js`). Istilah teknis boleh bahasa Inggris. Pengguna menjalankan ini malam hari lalu tidur, jadi **bekerja sendiri sampai selesai, boleh memakan waktu lama, tanpa pertanyaan di tengah jalan**. Pengguna memposting MANUAL; kamu tidak memposting apa pun. Baca `system/README.md` dan CLAUDE.md bila belum. Jawab dalam bahasa pengguna. Input: $ARGUMENTS

## Routing engine

Default command ini tetap Lemo-Opuscar. Jika pengguna secara eksplisit meminta toolkit/engine `make-an-anime` atau alur `/buat-anime`, muat `.claude/skills/make-an-anime/SKILL.md` dan jalankan workflow anime dengan brief, style, durasi dan jumlah episode yang sama. Untuk seri anime, pertahankan style/cast bersama dan rencana per episode di workspace `anime/<slug>/`; jangan menjalankan `system/series.py` pada format anime. Kata “anime” sebagai deskripsi look saja tidak otomatis mengizinkan Fal berbayar atau mengganti engine.

## Arahan dinamis dari pengguna

Terima cerita, style bebas, referensi visual, template dan revisi langsung dari chat/$ARGUMENTS, termasuk gaya di luar katalog. Pengguna tidak perlu membuka/mengedit STYLE.md atau file config apa pun. Claude yang menyusun style bible/kontrak dan implementasinya otomatis dari brief; baca STYLE.md hanya bila style resmi diminta. Pertahankan gaya seri kecuali user mengubahnya; perubahan terbaru diterapkan ke episode terkait dengan dampak render/biaya dijelaskan. Jangan mengulang pertanyaan style jika sudah dijawab di chat.

## Pilihan template/style untuk seluruh seri (prioritas atas default lama)

Baca `system/STYLE-WORKFLOW.md`. Gunakan root checkout aktual. Kunci mode `template` atau `custom` bersama style pada `series/<slug>/STYLE-CONTRACT.md`, dan catat mode di `series.json` agar sesi berikutnya mempertahankannya. Jika pengguna memilih style resmi tanpa meminta template, gunakan custom; jangan membatasi semua style menjadi empat dunia 3D. Tentukan mode implementasi dari brief; jangan meminta user memilih detail teknis bila gaya sudah jelas. Pilihan eksplisit menang atas default engine 3D di bawah.

`series.py scaffold` hanya menghasilkan stub template. Sebelum build, terapkan kontrak ke SETIAP `film.json`, palet dan renderer: custom memerlukan `render: "custom"` dan `main.js` khusus yang memenuhi STYLE.md; template memakai renderer bersama dan tidak boleh disebut implementasi asli style. Scaffold memanggil art director topik, jadi pulihkan palet style yang disetujui pada setiap bagian bila style eksplisit. Pertahankan renderer bersama khusus seri bila perlu, tanpa memodifikasi library upstream. Review frame pilot terhadap kontrak sebelum merender semua episode; lanjutkan sendiri bila sesuai, tanpa checkpoint baru kecuali diminta pengguna. Buat thumbnail dari renderer yang benar. Jika library/style belum tersedia atau renderer belum sesuai, laporkan BLOCKED/LIMITED dan jangan mengganti style secara diam-diam.

Untuk gaya bebas di luar katalog, `series.py init --style AUTO` hanya menyiapkan scaffold. Catat `requested_style`/`style_name` dari percakapan di seri dan setiap film, lalu terapkan renderer/palet sesuai brief sebelum build. Jangan kirim deskripsi bebas sebagai slug katalog dan jangan membiarkan label bawaan scaffold menjadi pilihan final.

## 0. Peringatan singkat di awal (satu paragraf, lalu lanjut)
Laptop harus tetap menyala dan tercolok (skrip build mencegah tidur, tapi jangan ditutup). Izin tool (Bash, Edit, WebSearch) sebaiknya sudah diizinkan, karena permintaan izin akan menghentikan pekerjaan sampai pagi. Sebutkan ini sekali.

## 1. Analisis judul, lalu tanya SEKALI
Analisis judul dan deskripsi dulu (topik, penonton, tingkat kesulitan). Lalu satu panggilan AskUserQuestion:
- **Deskripsi** (bila belum ada): "Bebas, Claude riset dan tentukan (Recommended)" / "Saya tulis sendiri" (Other).
- **Jumlah bagian**: 14 (Recommended: 7 hari x 2 post) / 12 / 10; Other = angka lain (maks 14).
- **Style (terkunci untuk seluruh seri)**: input bebas atau 3 rekomendasi berdasar analisis (katalog `system/styles-catalog.json` hanya sumber contoh) (nama, alasan, renderer dan ciri visual sesuai STYLE.md) + "Otomatis (Recommended)". Other = nomor/nama dari `system/styles-catalog.md`. Satu style (jadi satu dunia 3D, palet, caption dan palet suara) untuk SELURUH seri supaya terlihat satu seri; variasi datang dari ilustrasi 3D, kamera dan susunan adegan.
- **Mode**: "Langsung semua sampai selesai (Recommended, bisa ditinggal tidur)" / "Berhenti setelah outline untuk saya setujui" / "Pilot bagian 1-2 dulu".
Default: 9:16 1080x1920, bahasa judul, 30 fps (60 bila style 60 fps), engine 3D. Setelah jawaban, jangan bertanya lagi.

## 2. Riset mendalam (lambat dan teliti itu benar)
- Gunakan WebSearch (mode extended untuk fakta sulit/terbaru) dan WebFetch pada sumber primer: standar/RFC, dokumentasi resmi, universitas, lembaga pemerintah/internasional, jurnal. Hindari blog anonim dan konten generik sebagai satu-satunya sumber.
- Setiap klaim yang akan diucapkan masuk `series/<slug>/RESEARCH.md`: klaim | URL | tanggal/versi | keyakinan (tinggi/sedang/rendah) | bagian. Klaim penting butuh minimal 2 sumber independen. Klaim yang bertentangan: pakai versi paling hati-hati atau buang. Fakta yang bisa kedaluwarsa diberi tanggal. Jangan mengarang angka; perkiraan diberi kata "sekitar". Klaim keyakinan rendah TIDAK boleh masuk naskah.
- Tulis juga miskonsepsi umum (untuk bagian "kesalahpahaman") dan contoh nyata yang bisa diverifikasi.

## 3. Outline (OUTLINE.md) dan pengaturan seri
- `~/lemo-opuscar/.venv/bin/python system/series.py init <slug> --title "<judul seri>" --style <slug-style> --parts <N> --size 1080x1920 --lang id --desc "<deskripsi>"`
- Struktur 14 bagian: 1 hook + gambaran besar; 2-11 satu mekanisme per bagian, berurutan logis (tiap bagian membangun yang sebelumnya tanpa mengharuskannya); 12 kesalahpahaman umum; 13 contoh nyata; 14 rangkuman + langkah berikutnya. Untuk N lain, sesuaikan.
- Tiap bagian: berdiri sendiri (penonton bisa masuk dari bagian mana pun: ulangi konteks satu kalimat), satu ide, hook di 2 detik pertama, payoff, lalu penutup yang mengajak ke bagian berikutnya (rasa ingin tahu, bukan janji palsu), tanpa spoiler yang menipu. Panjang 40-55 detik (sekitar 8-11 baris).
- Isi `series.json` (title, hook, thumb_text tiap bagian) lalu `series.py scaffold <slug>`. Bila mode "berhenti setelah outline": tampilkan OUTLINE.md dan berhenti.

## 4. Naskah tiap bagian (`films/<slug>-pNN/lines.json`)
Aturan sama dengan /buat-video (hook, 8-16 kata per baris, `*kata kunci*`, visual 3D di >= 70% adegan, jenis visual tidak sama dua kali berturut-turut; daftar visual ada di `.claude/commands/buat-video.md`). Tambahan seri:
- Seluruh seri memakai kosakata istilah yang SAMA (satu istilah untuk satu konsep), dan pelafalan istilah asing/singkatan dicatat di `series/<slug>/pronunciation.json` (kata -> cara baca).
- Variasikan kombinasi visual antarbagian agar tidak monoton, tapi pertahankan palet/caption/lencana yang sama.
- Baris pertama setiap bagian = hook; baris terakhir = ajakan ke bagian berikutnya (`film.json` sudah memuat lencana dan kartu "Berikutnya").
- Tidak ada merek dagang, orang nyata, atau klaim medis/keuangan yang bisa menyesatkan.

## 5. Verifikasi fakta (wajib sebelum render)
Buat `series/<slug>/FACTCHECK.md`: untuk SETIAP baris naskah yang memuat klaim faktual, tulis bagian.baris | klaim | baris RESEARCH.md pendukung | OK/PERBAIKI. Baca ulang semua naskah terhadap RESEARCH.md; perbaiki yang tidak didukung atau terlalu pasti. Hanya lanjut bila tidak ada baris yang belum OK.

## 6. Build (dapat dilanjutkan)
`~/lemo-opuscar/.venv/bin/python system/series.py build <slug>` dijalankan di background (run_in_background). Skrip: menerapkan pelafalan, build tiap bagian (suara, ASR, timeline, render, mix, mux, QA), membuat thumbnail, mencoba ulang sekali bila gagal, menulis `SERIES-REPORT.md`, dan melewati bagian yang sudah jadi. Bila terputus, jalankan lagi (`--only 3,4 --force` untuk memaksa bagian tertentu). Perkiraan: 4-5 menit per bagian.
Selagi build berjalan, kerjakan langkah 7.

## 7. Paket posting tiap bagian: `series/<slug>/posts/pNN.json`
Isi: `title` (<= 70 karakter, jujur, mengandung kata kunci pencarian), `caption` (<= 220 karakter: baris 1 hook yang sama dengan rasa ingin tahu di video, baris 2 janji manfaat, baris 3 satu pertanyaan yang memancing komentar, lalu penanda seri "Bagian x/N"), `hashtags` (5-8, urut dari spesifik ke luas: 2-3 sangat relevan topik, 2 kategori seperti #edukasi #belajar, lalu 1-2 luas seperti #fyp; tidak spam, tidak menyesatkan), `description` (2-3 kalimat + kata kunci alami), `keywords` (untuk tag YouTube), `pinned_comment` (ajak ke bagian berikutnya + pertanyaan), `sources` (URL dari RESEARCH.md untuk bagian itu), `notes`. Tidak ada hashtag atau trik yang menjamin FYP; jangan menjanjikannya kepada pengguna. Yang menentukan: hook 2 detik pertama, retensi, relevansi, konsistensi seri.

## 8. Tinjauan visual tiap bagian (setelah bagian itu selesai dibuild)
Untuk setiap bagian: `sh system/review.sh <slug>-pNN` lalu LIHAT `out/review/sheet-*.jpg` dengan Read; dan `out/thumbs/sheet.jpg` (tiga varian thumbnail, besar dan 200 px). Periksa: teks meluber/terpotong, tumpang tindih, area kosong, label tak terbaca, lencana menutupi teks, thumbnail terbaca di 200 px. Thumbnail yang baik: <= 5 kata, satu fokus, kata kunci beraksen, jujur terhadap isi, bukan clickbait palsu. Thumbnail hanya 9:16 (3D). Varian DIKUNCI sama untuk seluruh seri (default varian 2 = satu kata raksasa + objek 3D; ubah `series.json` thumb_variant dan `film.json` thumb.variant bila varian lain lebih cocok), teks tiap bagian berbeda; `thumb.kicker` sudah berisi lencana BAGIAN x/N. Bila ada cacat: perbaiki (lines.json atau `system/lib` bila bug umum), `series.py build <slug> --only N --force`, `sh system/thumb.sh <slug>-pNN`, tinjau ulang. Maksimal 2 putaran per bagian. Jangan pernah mengklaim sudah menonton video penuh atau mendengar audio.
Bila pelafalan keliru terdeteksi Whisper (dilaporkan di QA-REPORT), tambahkan ke pronunciation.json dan bangun ulang bagian yang terdampak.

## 9. Selesai
- `series.py schedule <slug> --start <besok>` (2 post per hari; jam 12:00 dan 19:00 hanya usulan) menulis `POST.md` tiap bagian dan `series/<slug>/SCHEDULE.md`.
- `series.py clean <slug>` untuk menghemat disk (video dan thumbnail final tetap ada).
- Laporan pagi untuk pengguna, ringkas: lokasi `series/<slug>/` (SCHEDULE.md, SERIES-REPORT.md, RESEARCH.md, FACTCHECK.md) dan `films/<slug>-pNN/final/`; status per bagian (VERIFIED/LIMITED/NOT TESTED); daftar hal yang HARUS dicek manusia sebelum posting: tonton tiap bagian dengan suara, baca RESEARCH.md untuk angka yang meragukan, dengarkan baris yang ditandai Whisper, aktifkan label konten AI/sintetis bila platform menyediakannya; catatan syarat Edge-TTS (pengguna menyatakan aman untuk edukasi) dan aturan platform untuk konten berulang; apa yang tidak sempat dikerjakan.

## Aturan keras
- Tidak ada .srt; SFX tidak dobel; jangan edit `_lib/`/`fonts/` dalam film (ubah di `system/`); jangan edit library upstream atau folder proyek lain; jangan memposting apa pun.
- Fakta hanya dari RESEARCH.md. Tidak ada klaim keyakinan rendah. Tidak ada janji FYP.
- Jangan menghapus data pengguna. `clean.sh` hanya menghapus file kerja yang bisa dibuat ulang.
- Perubahan di `system/lib` atau `system/audio`: jalankan `node system/tools/caption-lab.mjs` dan satu build uji sebelum dipakai ke seri.

## Tambahan v3 (2026-11-12)
Semua aturan "Tambahan v3" di `.claude/commands/buat-video.md` berlaku untuk setiap episode: watermark ngetehnology kiri atas, chip kanan atas "<judul singkat seri> · EP n/N" (isi `--short` saat `series.py init`), kartu "Berikutnya", beat, hook engine, art director (palet seri dikunci dari topik seri), dan **CAPTION.txt + HASHTAGS.txt per episode** (wajib; `series.py schedule` juga menulisnya). Sebelum menutup: jalankan `system/py/check_deliverables.py` untuk tiap episode.
