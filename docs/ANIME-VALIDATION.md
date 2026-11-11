# Catatan validasi integrasi anime

Validasi dilakukan di cloud Linux pada 11 November 2026, bukan di laptop Windows pengguna.

## Hasil

| Pemeriksaan | Hasil |
|---|---|
| Toolkit dibandingkan dengan upstream `adc1a76eb4e77df47f42160c2c166350a76ad849` | Semua file sumber tersedia. Runtime, backend, contoh, tes dan dependency lockfiles identik; `SKILL.md` hanya ditambah link integrasi lokal |
| Ruby CLI, metadata/link skill, inisialisasi dan penolakan overwrite, approval/receipts, mocked model contracts | Profil core: 69 examples, 0 failures |
| FFmpeg/ImageMagick/Python, p5 rendering, deterministic frames, overlay/caption timing, synthetic anime shots, audio mixing, concatenation dan SFX | Profil media: 44 examples, 0 failures, 1 pending (43 lulus) |
| Contoh starter dengan media sintetis | Pending: memerlukan `/System/Library/Fonts/Supplemental/Arial Bold.ttf`, yang tidak tersedia di Linux |
| Kode produksi yang sudah ada | Tidak diubah; command/aturan pemilihan style dan quality gate diperbarui |
| Kredensial/dependency cache/render output masuk staging | Tidak ada pada pemeriksaan staging |

Tes dijalankan lewat entry point Ruby:

```sh
PROFILE=core ruby .claude/skills/make-an-anime/scripts/mv.rb test
PROFILE=media ruby .claude/skills/make-an-anime/scripts/mv.rb test
```

Lingkungan pengujian memakai Ruby lokal 3.3.10, Bundler 4.0.20, Node 24, dependency terpasang dari lockfile, Python venv dan Chromium. Cache npm/pip/Bundler diarahkan ke lokasi writable di `/workspace`. Peluncuran Chromium pertama gagal pada sandbox Chromium container; retry memakai `CHROME_PATH` berupa wrapper lokal di luar repo, dengan direktori config/cache writable dan `--no-sandbox`, hanya untuk fixture localhost dalam cloud yang terisolasi. File runtime upstream tidak diubah. Pada workstation biasa gunakan konfigurasi browser/sandbox normal; jangan menyalin override pengujian ini sebagai default pengguna.

## Belum diverifikasi

- Generasi Fal sungguhan, kualitas gambar/video provider, pelafalan/lipsync generatif, biaya dan akses jaringan produksi. Tidak ada key Fal yang tersedia atau panggilan produksi berbayar yang dijalankan.
- Swift/Core Image VFX, karena macOS tidak tersedia.
- Workflow anime native Windows; gunakan WSL kecuali sudah diuji sendiri.
- Render Lemo-Opuscar end-to-end di cloud ini: library/runtime Opuscar belum terpasang. Dokumen directing dan core upstream dipelajari melalui sumber resmi, bukan dibuktikan dengan render.
- Kualitas atau safe zone video pengguna. Tes media sintetis membuktikan mekanisme toolkit, bukan kesetaraan kualitas artistik dengan contoh upstream. Setiap produksi wajib melewati [quality gates](../system/QUALITY-GATES.md) dan mencatat bukti review sendiri.

Integrasi menyediakan `/buat-anime`, skill `/make-an-anime`, input style dinamis dari chat, routing dari command lama bila engine anime diminta, dan aturan fidelity/danger zone bersama. Ini tidak otomatis mengubah setiap style Opuscar menjadi renderer custom atau memasang filter video-ke-anime.
