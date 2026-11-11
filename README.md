# Video Generate untuk Claude Code

Produksi video dengan Lemo-Opuscar, serta skill tambahan Make an Anime. Buka Claude Code dari folder repo di laptop Anda.

| Command | Kegunaan |
|---|---|
| `/buat-video Judul` | Satu video dengan engine Opuscar |
| `/buat-seri Judul seri` | Seri video dengan look yang konsisten |
| `/buat-anime Judul` | Anime dari cerita; generasi Fal berbayar, editing/finishing lokal |

## Alur penggunaan

1. **Tulis judul.** Claude menanyakan deskripsi/cerita. Tulis bebas atau minta Claude mengembangkan.
2. **Claude menganalisis dan memverifikasi.** Sesudah itu muncul daftar tiga rekomendasi style, lengkap dengan tampilan, alasan, engine dan biaya/batasannya.
3. **Pilih style**, pilih “otomatis”, atau berikan gaya/referensi sendiri. Bila preferensi sudah Anda tulis, tidak perlu menjawab ulang.
4. **Claude memproduksi dan memperbaiki otomatis:** riset, naskah, adegan/prompt, suara, timeline, caption, render, FFmpeg mix/mux, thumbnail, paket posting dan QA. Anda tidak perlu mengedit `STYLE.md`, JSON atau menjalankan command terminal sendiri.

Jika sejak awal meminta pilihan otomatis, Claude memilih rekomendasi yang paling sesuai setelah membaca deskripsi dan lanjut. Biaya anime memerlukan izin rencana/budget yang nyata sebelum generasi; setelah itu setiap shot tidak perlu dikonfirmasi lagi selama masih dalam scope. Tidak ada publikasi otomatis.

## Lingkungan lokal dan kualitas

Claude mengecek tool/dependency pada mesin tempat ia berjalan, memakai `system/doctor.py` dan tes render yang relevan. Opuscar membutuhkan library resminya, Node, Python/venv, FFmpeg/ffprobe, browser renderer dan dependency suara. Anime menambahkan Ruby/Bundler, ImageMagick dan key/kredit Fal; gunakan WSL di Windows untuk toolkit anime. Swift VFX opsional hanya macOS. Claude memakai instalasi yang sudah ada, dan menangani prasyarat yang kurang melalui cara yang didukung; akses/credential yang benar-benar belum tersedia tetap harus disediakan secara aman.

Untuk anime tanpa Fal, Claude dapat memakai artwork/footage yang tersedia atau tool/model gambar yang benar-benar terpasang, lalu membuat rig/animasi dan caption lokal. Kamera bergerak saja tidak memenuhi permintaan karakter bergerak. Mode ini tidak memerlukan key Fal, tetapi berbeda dari akting generatif H3.

Pilihan look diterapkan ke visual dan gerak, bukan sekadar mengganti warna. Caption/brand, safe zone UI/crop, keterbacaan, audio dan hasil QA diperiksa. Build gagal atau file output belum lengkap tidak dilaporkan sebagai sukses. Frame debug danger zone disimpan terpisah dari final. Hasil yang belum ditonton/didengar tidak diklaim sudah lolos review tersebut.

Pemeriksaan cloud tidak membuktikan laptop Anda sudah berhasil merender. Lihat [catatan verifikasi](docs/WORKFLOW-VERIFICATION.md) untuk hasil uji dan batasan aktual.

Panduan internal Claude: [alur otomatis](system/CLAUDE-WORKFLOW.md), [template/style dinamis](system/STYLE-WORKFLOW.md), [quality gates](system/QUALITY-GATES.md). Panduan anime: [ANIME.md](docs/ANIME.md).
