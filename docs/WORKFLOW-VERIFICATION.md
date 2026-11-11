# Verifikasi workflow dan contoh video

Dilakukan di cloud Linux, 11 November 2026. Ini tidak membuktikan laptop pengguna atau percakapan interaktif Claude Code di laptop telah diuji.

## Perubahan alur

Ketiga command mengikuti `system/CLAUDE-WORKFLOW.md`: judul → pertanyaan deskripsi → analisis/verifikasi → tiga rekomendasi look dengan alasan/engine/biaya yang jelas → pilihan atau delegasi otomatis → produksi lokal dan QA. Input bebas, jawaban dan izin yang sudah diberikan dipertahankan. Pengguna tidak perlu mengedit STYLE.md/JSON atau menjalankan command sendiri. Command tersebut adalah instruksi agent; pemeriksaan file Markdown bukan bukti perilaku agent di setiap sesi.

## Hasil pengujian

- 20 tes regresi Python: input/stub belum lengkap, palet/fps style eksplisit, path dengan spasi, slug invalid, MP4 parsial, kegagalan tool, QA stale karena video/renderer berubah, deliverable kosong, batch seri gagal, reading hold terakhir, ffprobe/ebur128 sungguhan, silent tanpa ASR palsu, serta caption visual bertiming authored tanpa WAV/word timing speech palsu.
- Tes geometri Node: caption 2D/3D berbagi bounds, brand/series di tiga ukuran output, override dinamis, dan penolakan rectangle invalid.
- Selftest quick: 29 PASS, 0 FAIL; voice-online NOT TESTED. Di dalamnya 24 kombinasi caption 2D (6 efek × 2 orientasi × 2 panjang) lulus. Tes diperbaiki agar sampel kosong tidak lagi menghasilkan ALL OK palsu; batas animasi keluar caption diperbaiki.
- Core toolkit anime: 69 examples, 0 failures. Runtime dan lockfile upstream tetap identik; adaptasi ada pada instruksi/referensi dan service lokal di proyek demo. Profil media pada verifikasi integrasi sebelumnya: 44 examples, 0 failures, 1 pending karena contoh memerlukan font macOS. Demo lokal baru juga benar-benar dirender, bukan hanya diuji dengan mock.
- Smoke 3D Full HD: events/readcheck, 302 frame 1080×1920@30, mixer dan mux berjalan. QA baru menangkap judul masuk zona UI atas; posisi header template diperbaiki. Pengukuran ulang halaman setelah perbaikan: 49 sampel, 0 outside-caption, 0 outside-critical-text, 0 overlap, 0 missing box. MP4 uji lama yang mendeteksi masalah tersebut tidak dijadikan contoh delivery.

## Build tidak lagi memberi sukses palsu

Kegagalan subprocess tidak disembunyikan oleh pipe. ASR error, readcheck yang tidak mengukur teks, caption hilang/keluar/overlap, input/posting pack yang belum lengkap dan QA gagal memblokir build. `QA-RESULTS.json` menyimpan hash video dan sumber film; batch/resume memerlukan bukti yang cocok, bukan hanya keberadaan MP4. Report tidak menyimpulkan PASS dari ketiadaan baris error. Status visual/playback yang belum dilakukan tetap dinyatakan.

Shell memakai LF agar dapat berjalan di Linux/WSL/Git Bash; pemilihan Python mendukung bin/python dan Scripts/python.exe. Palet style eksplisit tidak ditimpa art director topik, fps native dipertahankan, dan adegan terakhir mendapat reading hold. Review membuat sheet bersih serta mask danger zone terpisah. Tidak ada penurunan resolusi/fps/model secara diam-diam.

## Dua contoh nyata untuk pengguna

Topik **AI Agent**, dipilih sesudah memeriksa [GitHub Trending](https://github.com/trending): daftar yang terlihat mencakup agent-skills, agent-browser, dan codex-security. Ini bukan klaim tren teratas di semua platform.

1. **AI Agent: Dari Chat ke Aksi** — engine asli Dark Tech Keynote (Canvas2D, MIT), cerita/UI original, cursor dan UI bergerak, caption animasi yang terbakar, tanpa narasi/SFX. Jalur build sampai media QA dan paket posting dijalankan. Detector black-frame tetap LIMITED pada bagian near-black yang memang sesuai style; frame yang ditinjau memiliki UI terang/terbaca, bukan dinyatakan PASS dengan mengabaikan detector.
2. **AI Agent: Penjaga Kota** — tanpa Fal: artwork/clean plate/actor transparan dari tool gambar native yang tersedia di chat, lalu rig lokal tubuh/kepala/forearm dan companion origami, compositing, hujan, dan caption authored melalui Ruby/p5/FFmpeg. Ini bukan MiniMax H3/Seedance acting. Keberadaan tool gambar di chat tidak membuktikan model gambar tersebut terpasang di Claude Code laptop.

Target delivery keduanya: MP4 H.264 yuv420p, BT709, 1080×1920, 24 fps, 432 frame/18 detik, faststart. Diam sesuai permintaan pengguna; tidak ada TTS/ASR palsu. Anime dikodekan dari source PNG untuk menghindari re-encode master terkompresi. Aset sumber anime 941×1672; resolusi export bukan klaim detail artwork native 1080p.

Rig anime diuji dengan kamera/background/teks/environment terkunci: 0 pixel latar atas berubah, 100.074 pixel ROI kepala dan 24.505 pixel ROI lengan berubah melebihi ambang uji. Frame hasil juga ditinjau untuk komposisi/anatomi. Ini membuktikan perubahan lokal actor terpisah dari kamera, bukan kualitas akting generatif atau playback manusia penuh.

Video besar, PNG cache, foto/aset produksi dan dependency cache tidak dipublikasikan ke Git. File MP4 dan ZIP sumber/QA diberikan di chat.

## Batasan yang tetap nyata

Microsoft speech endpoint ditolak jaringan cloud (403); jalur narasi online belum terverifikasi di sini. Pengguna kemudian meminta video tanpa suara, sehingga contoh silent tetap dapat diproduksi dan diverifikasi. Fal credential/kredit tidak tersedia dan pengguna memilih jalur tanpa Fal: tidak ada paid generation/upload Fal atau live H3 test. Swift VFX dan native Windows tidak diuji. Seluruh 66 style bukan 66 render yang telah diuji; pemilihan style custom tetap memerlukan implementasi dan pemeriksaan nyata per film. Penilaian rasa artistik dan playback normal pengguna tidak dapat diganti oleh test count atau contact sheet.
