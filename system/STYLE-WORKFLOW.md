# Template dan style yang dipilih pengguna

Aturan ini berlaku untuk `/buat-video`, `/buat-seri`, dan `/buat-anime`. Ini menggantikan arahan lama yang menyamakan nama style dengan palet template. Baca sebelum membuat adegan.

## Input selalu dinamis dari percakapan

Pengguna cukup menulis arahan di Claude Code: tema, cerita, referensi gambar/video, template, gaya bebas, atau perubahan seperti “lebih pastel”, “kamera lebih tenang”, “jadi anime noir”. **Jangan meminta pengguna mengedit STYLE.md, style bible, JSON, atau renderer.** Claude menafsirkan input, memperbarui semua artefak internal, lalu menerapkannya ke visual/prompt. Catatan kontrak adalah keluaran Claude untuk menjaga konsistensi, bukan form wajib yang harus diisi pengguna.

Katalog bukan pembatas pilihan. `STYLE.md` upstream hanya dibaca sebagai referensi ketika pengguna memang menyebut style resmi Opuscar. Untuk gaya bebas atau gabungan gaya, Claude menyusun art direction dan renderer sendiri dari brief; tidak diperlukan STYLE.md yang sudah ada. Jangan menciptakan file preset statis untuk setiap permintaan. Pada revisi, terapkan perubahan terbaru ke shot yang terdampak sambil mempertahankan detail lain yang sudah disetujui.

Kualitas dan danger zone juga wajib mengikuti [QUALITY-GATES.md](QUALITY-GATES.md), termasuk benchmark upstream, frame mask UI, review gerak/audio dan bukti QA.

## Dua mode yang harus dibedakan

| Pilihan | Implementasi | Klaim hasil |
|---|---|---|
| Template Opuscar 2D/3D | Renderer bersama `scenes.js` atau `e3d.js`; dunia, palet, caption, ilustrasi dan suara dikonfigurasi | Template bersama dengan tema/style terinspirasi katalog |
| Style resmi atau gaya bebas Opuscar | Untuk style resmi baca `styles/<slug>/STYLE.md`; untuk gaya bebas gunakan brief percakapan. Tulis renderer `main.js` khusus yang menerapkan cirinya | Sesuai style hanya setelah dibandingkan dengan spesifikasi dan frame hasil |
| Template anime | Struktur adegan/overlay dari contoh yang dipilih, disesuaikan dengan cerita dan art direction | Template contoh yang disebutkan, bukan filter otomatis |
| Style anime sendiri | Style bible, character/location sheets, prompt gambar/gerak, overlay dan review | Style yang direncanakan, dengan keterbatasan generasi dilaporkan |

Jika pengguna meminta style resmi atau gaya bebas Opuscar yang tidak dicakup template bersama, gunakan **mode custom**. Jika memilih template, pertahankan template tersebut. Jika AUTO, pilih dan sebutkan mode serta look konkret berdasarkan brief sebelum produksi; jangan menyatakan bahwa empat dunia template adalah 66 renderer berbeda.

## Opuscar: sebelum build

1. Temukan library dari `LIB` atau `~/lemo-opuscar`. Baca kontrak teknis `AGENTS.md`, `DIRECTOR.md`, `TECHNIQUE.md`, `core/README.md` untuk renderer. Hanya jika style resmi diminta, baca `styles/<slug>/STYLE.md`. Gaya bebas tidak membutuhkan file style upstream. Jika engine tidak tersedia, laporkan BLOCKED; jika spesifikasi style resmi belum tersedia, jelaskan batasan kecocokan dan jangan fallback diam-diam.
2. Tulis `films/<slug>/STYLE-CONTRACT.md`: mode, slug/nama style, sumber spesifikasi, referensi, komposisi, tipografi, bentuk/material, lighting, palet, kamera, gerak/transisi, caption, suara, fps/ukuran, dan checklist kecocokan. Tulis treatment sendiri sebelum melihat `DEMO.md`; demo hanya referensi teknik.
3. Untuk gaya bebas di luar katalog, panggil scaffold dengan `--style AUTO` (bukan deskripsi bebas sebagai slug), lalu catat `requested_style` dan `style_name` dari brief pada metadata film/seri dan terapkan look yang sebenarnya. Style bawaan scaffold hanyalah placeholder internal. `new-film.sh` mendukung `--render template|custom` dan `--requested-style`, tetapi renderer awalnya tetap **stub template**. Pada mode custom, set `film.json` → `render: "custom"`, lalu **ganti** `main.js` dengan adegan khusus. Mengubah metadata saja tidak mengubah visual. Jangan meninggalkan import tunggal `./_lib/e3d.js` atau `./_lib/scenes.js` lalu menyebutnya style resmi.
4. Pertahankan kontrak halaman `window.READY`, `window.render(t)`, `window.DUR`, serta `EV`/`TEXTS` bila dibutuhkan oleh renderer/QA. Ikuti dokumentasi core untuk serving/import. Sinkronkan ke timeline suara yang sama. Atur metadata `engine` sesuai renderer; jangan memaksa style 2D menjadi 3D. Kode custom harus menyertakan caption dan brand; keduanya tidak otomatis muncul saat renderer template diganti.
5. Pada mode template, catat `render: "template"`, engine 2D/3D, dunia, caption, palet dan mood. Jika style/palet dipilih eksplisit, jangan biarkan art director topik mengganti paletnya: gunakan `--art style` saat scaffold, atau terapkan kembali palet yang disetujui. Hasil tetap template bersama.
6. Render frame pembuka, adegan utama dan penutup dengan `still.mjs` sesuai `core/README.md`; periksa terhadap kontrak. Perbaiki layout, material, gerak dan tipografi yang tidak cocok, bukan hanya warna. Build, review dan QA tetap memakai alur proyek. Thumbnail template 3D tidak otomatis cocok untuk custom: buat thumbnail dari renderer yang benar.

## Seri dan revisi

Kunci mode, style dan kontrak bersama di `series/<slug>/STYLE-CONTRACT.md`, lalu terapkan ke seluruh bagian. Setelah `series.py scaffold`, periksa/set metadata dan renderer **setiap film** sebelum `series.py build`; scaffold belum membuat renderer custom. Simpan implementasi bersama khusus seri bila perlu tanpa mengubah library upstream atau renderer proyek lain.

Pada anime, kunci style di `config/style.md` dan checklist di `docs/STYLE-CONTRACT.md`; ikuti referensi integrasi skill. Revisi harus mempertahankan pilihan yang sudah disetujui. Jangan menyatakan fidelity terverifikasi hanya dari nama file, slug style atau nilai konfigurasi. Bila pemeriksaan visual belum dilakukan, tulis NOT TESTED; bila style belum cocok, tulis LIMITED atau BLOCKED dengan detail.

Urutan tanya deskripsi → verifikasi → daftar rekomendasi → pilihan → produksi ditentukan oleh `CLAUDE-WORKFLOW.md`. Script scaffold sekarang menjaga palet style eksplisit secara default (`--art auto`); palet dari topik dipakai ketika style AUTO atau diminta `--art topic`.
