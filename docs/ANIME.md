# Skill anime untuk Claude Code

Lemo-Opuscar tetap menjadi engine `/buat-video` dan `/buat-seri`. Skill tambahan berasal dari [makevoid/claude-make-an-anime](https://github.com/makevoid/claude-make-an-anime), versi 0.6.0, commit `adc1a76eb4e77df47f42160c2c166350a76ad849`, berlisensi MIT. Sumber lengkap skill disimpan di `.claude/skills/make-an-anime/`, termasuk toolkit, lockfile, contoh dan tes. Detail perubahan lokal ada di `UPSTREAM.md` pada folder itu.

## Pemakaian

Buka Claude Code dari root repo. Skill proyek ditemukan otomatis; tidak perlu menginstal marketplace/global plugin untuk salinan ini. Jika sesi sudah terbuka saat file ditambahkan, buka ulang sesi agar command/skill baru terbaca.

```text
/buat-anime Dua sahabat tertinggal kereta | cerita 20 detik, dialog Indonesia | slice-of-life pastel
/buat-anime /path/absolut/cerita.md | pilot 30 detik, 9:16 | cel-shaded aksi
/make-an-anime Revisi shot pembuka proyek anime saya, pertahankan style bible
```

`/buat-anime` menjalankan intake bahasa Indonesia dan memuat skill yang sama dengan `/make-an-anime`. Pilih template atau style, lalu Claude menyusun style bible, storyboard, rencana biaya dan retry. Persetujuan produksi diperlukan sebelum Fal/upload berbayar. Penambahan skill ini tidak menjalankan generasi.

Toolkit membuat anime dari cerita dan merevisi shot, karakter, audio serta overlay. Ia juga punya alat cut/mux/concat untuk footage yang sudah ada. Ia belum merupakan filter yang teruji untuk mengubah sembarang video live action menjadi anime.

Pengguna tidak perlu mengedit `style.md`: cukup sebutkan gaya bebas, template, referensi, atau revisi di chat. Claude menerjemahkannya menjadi style bible, prompt dan adegan secara otomatis. Katalog Opuscar dan contoh anime hanya referensi opsional, bukan daftar pilihan yang membatasi.

## Prasyarat

- Ruby 3.2+ dan Bundler yang cocok dengan `Gemfile.lock`.
- Node.js 22.12+, Chrome/Chromium, FFmpeg/ffprobe, ImageMagick (`magick`), Python 3.
- Paket Ruby/Node/Python dipasang oleh `setup` di workspace produksi, bukan global.
- `FAL_AI_API_KEY` dan kredit Fal hanya dibutuhkan saat generasi berbayar. Isi lewat environment/secret manager saat menjalankan Claude Code; jangan simpan nilainya di repo atau chat. Skill lokal memakai CLI standalone, bukan konfigurasi sensitif/MCP plugin upstream.
- Swift/Core Image VFX opsional hanya untuk macOS 14+. Linux/WSL dapat memakai jalur lokal tanpa pass itu. Pada Windows gunakan WSL; kode upstream memakai path venv POSIX dan kompatibilitas native Windows belum diverifikasi.

Dari root repo (contoh shell POSIX/WSL; project baru harus kosong):

```sh
ruby .claude/skills/make-an-anime/scripts/mv.rb --help
ruby .claude/skills/make-an-anime/scripts/mv.rb init --project "$PWD/anime/pilot" --story /absolute/story.md
ruby .claude/skills/make-an-anime/scripts/mv.rb --project "$PWD/anime/pilot" setup
ruby .claude/skills/make-an-anime/scripts/mv.rb --project "$PWD/anime/pilot" doctor
```

`doctor` melaporkan booleans; exit 0 tanpa `STRICT=1` bukan bukti semua prasyarat lengkap. Swift dan key yang belum tersedia harus dilaporkan terpisah. Jangan memakai profil tes `all` di Linux karena mencakup Swift. Uji lokal tanpa Fal dari root repo:

```sh
ruby .claude/skills/make-an-anime/scripts/mv.rb setup
PROFILE=core ruby .claude/skills/make-an-anime/scripts/mv.rb test
PROFILE=media ruby .claude/skills/make-an-anime/scripts/mv.rb test
```

Setup di folder toolkit hanya untuk pengujian toolkit. Produksi selalu memakai `--project anime/<slug>` absolut. Tes `live` berbayar tidak termasuk pemeriksaan rutin.

## Kualitas dan danger zone

Baca [quality gates bersama](../system/QUALITY-GATES.md). Style/prompt, review gerak/audio, area UI/crop dan pitfalls visual harus diperiksa pada media final; tes sintetis toolkit belum memverifikasi kualitas video generatif. Upstream anime merakit shot menjadi plate landscape 1920×1080. Untuk portrait, Claude perlu melakukan penyesuaian nyata dan memvalidasi framing; metadata 9:16 saja tidak cukup.

## Style dan hubungan dengan Opuscar

Aturan bersama ada di [STYLE-WORKFLOW.md](../system/STYLE-WORKFLOW.md). Template Opuscar mempunyai renderer bersama; style resmi membutuhkan `main.js` custom berdasarkan `STYLE.md`, bukan perubahan palet saja. Anime menggunakan style bible, sheets dan prompt untuk menjaga look pilihan pengguna. Empat contoh anime adalah contoh workflow, bukan empat preset art style.

Format timeline kedua engine berbeda. Anime dapat menjadi aset dalam film Opuscar custom, tetapi belum ada bridge otomatis. Simpan video bersih, final, kredensial aset/credits, style contract dan QA; jangan timpa sumber. Output produksi `anime/` diabaikan Git karena dapat memuat media besar dan foto referensi. Tambahkan hanya sumber produksi yang memang ingin dibagikan secara eksplisit.


## Demo/edit lokal tanpa Fal

Jika diminta pengguna, toolkit dapat merender artwork/footage yang tersedia dengan p5 dan FFmpeg tanpa key Fal (`system/doctor.py --engine anime-local`). Camera move, parallax, partikel, typography dan compositing adalah kemampuan lokal; ini bukan gerak tubuh/akting generatif H3. Ketersediaan tool gambar di chat cloud tidak membuktikan tool tersebut ada di Claude Code laptop. Untuk judul baru perlu aset yang disediakan atau model/tool gambar yang benar-benar tersedia. Contoh verifikasi sesi ini memakai artwork yang dibuat oleh tool gambar native lalu dirender lewat Ruby/p5/FFmpeg, tanpa Fal.
