# Keputusan evaluasi: OpenMontage + HyperFrames/FFmpeg lokal

Pilih OpenMontage sebagai workflow utama untuk kebutuhan pengguna: judul → deskripsi → verifikasi → pilihan gaya dinamis → produksi lokal → QA. Bukan gabungan engine dengan Opuscar. Opuscar tetap diarsipkan agar source dan hasil lama dapat dipulihkan.

Alasannya: alur perencanaan, artefak/checkpoint, pemilihan runtime dan review output lebih lengkap. Sampel baru juga memperlihatkan empat fase aksi yang lebih terbaca. Tidak ada bukti bahwa semua video dari OpenMontage otomatis lebih indah; desain dan aset tetap menentukan. Opuscar masih kuat untuk art direction film dalam kode dan material sinematik.

## Apa yang benar-benar dibandingkan

A: Opuscar v2 yang direvisi, bukan demo Canvas2D lama yang ditolak pengguna. B: komposisi workshop orisinal yang dibuat mengikuti workflow OpenMontage/HyperFrames. Judul AI Agent: Dari Ide ke Aksi. Keduanya 12 detik, 1080×1920,24fps,288frame, empat caption Indonesia sama, tanpa narasi/musik/SFX, AAC hening untuk kompatibilitas.

Caption: Mulai dari satu ide. / Susun langkahnya. / Jalankan bersama. / Kamu tentukan arah. Interval masing-masing 3 detik.

Geometri, pencahayaan, kamera dan desain tidak identik. Ini perbandingan dua hasil produksi pada brief yang sama, bukan uji isolasi engine. B menggunakan keramik oranye/chrome pada studio terang, A kaca/metal pada studio gelap. Keduanya authored 3D dengan objek bergerak; tidak memakai model video generatif. Tidak melibatkan anime generatif.

| Aspek | Opuscar A | OpenMontage B |
|---|---|---|
| Kejelasan tahapan | Hero objek yang sama, aksi antarbagian relatif halus | Macro ide, susunan mekanisme, lintasan eksekusi, perakitan akhir lebih mudah dibedakan |
| Caption | Kecil, fade bisa menurunkan keterbacaan pada beberapa momen | Lebih besar dan berkontras tinggi, empat baris konsisten |
| Material | Refleksi/transmisi gelap lebih dramatis | Keramik/chrome terang lebih mudah dilihat; bukan pengganti identik estetika A |
| Gerak | Kamera/orbit dan mekanisme bergerak | Kamera, core, paddle/arm, ring dan jalur bergerak |
| Workflow | Fokus renderer dan art direction | Planning, checkpoints, assets/edit/compose dan final review lebih eksplisit |
| Biaya API uji | $0 | $0 |
| Batas perangkat | Belum diuji langsung di laptop pengguna | Belum diuji langsung di laptop pengguna |

## Biaya, lisensi, dan perangkat

Target Windows11, Core Ultra7 155U,16GB RAM, Intel iGPU dengan shared RAM. Profil dipilih untuk mengedit footage, caption, animasi2D dan 3D yang wajar. Anime/text-to-video diffusion berat dengan akting natural tidak dijanjikan praktis pada perangkat ini. Mengganti workflow tidak menambah GPU, model, atau kredit.

OpenMontage AGPLv3; HyperFrames CLI0.9.36 Apache2.0; Three.js MIT; GSAP Standard License tanpa biaya; Inter SIL OFL. Remotion opsional dengan free license bersyarat, bukan syarat jalur utama. Gunakan login Claude Code Pro yang sudah dimiliki; langganan/batas Pro tetap berlaku dan tidak memberi kredit API media. Tidak memakai FAL/Veo/Kling/OpenAI API, paid trial, cloud render service, atau model berbayar. Evaluasi dieksekusi di mesin cloud chat ini menggunakan browser/FFmpeg lokal, bukan di laptop pengguna. Instalasi memerlukan internet.

Profil config cap$0 dan launcher tanpa credential provider membatasi jalur agent; ini bukan firewall. Sebelum proyek baru, baca LOCAL_FREE_ONLY.md. Download model/footage harus memiliki lisensi yang sesuai. Tidak ada publikasi sosial otomatis.

## Validasi dan keterbatasan

- Sampel B selesai menggunakan primary runtime HyperFrames CLI0.9.36 (bundle cocok dengan npm pin), Three.js/GSAP lokal, lalu finishing FFmpeg. Resolusi penuh dan animasi dipertahankan. Metadata sekunder diperbesar menjadi 28px dan stage badge dibuat berkontras tinggi; final CRF16, bukan output raw yang masih memiliki warning.
- Kedua file lulus pemeriksaan codec/warna/SAR/faststart dan full FFmpeg decode. H264 High4.1/yuv420p/BT709 limited/AAC. B 288frame/12detik; ukuran 3,169,420 byte.
- Caption final B cocok pada 11 sampel OCR, termasuk frame sebelum/sesudah pergantian tiga tahap. Tidak ada voice sehingga tidak mengklaim ASR.
- Lima frame final diperiksa secara visual. Playback final B selesai di Chromium, total288frame, dropped 2 pada uji terpisah. Uji bersamaan dengan beberapa job decode sebelumnya menjatuhkan3frame tetapi tetap selesai; rekaman under-load disimpan, bukan dianggap kerusakan file.
- Crop area objek 3D tidak memicu freeze>=0,5detik/black>=0,15detik pada detector; ini mendukung gerak berkelanjutan, bukan bukti kualitas akting generatif. AAC hening terukur; tidak ada narasi/musik.
- 47 tes preflight/budget/framework contract lulus (+1subtest). Setup npm ci dan versi runtime lokal teruji. Ini tidak membuktikan seluruh provider opsional upstream berfungsi.
- Cloud: A native render tercatat299detik/2worker; B pipeline native473,7detik/1worker, tool compose598,2detik termasuk gates/review, belum termasuk finishing label. Backend software Mesa disejajarkan setelah percobaan SwiftShader yang lambat dihentikan. Desain/worker/scope pengukuran berbeda: tidak mengklaim B lebih cepat atau angka ini prediksi laptop.
- Raw HyperFrames check ok=true: lint/runtime/layout/motion/contrast/craft/audio lolos tanpa error, dengan warning struktur nested, canvas menyentuh tepi, metadata kecil dan stage contrast. Dua warning keterbacaan ditangani pada finishing final; warning tidak dihapus dari laporan raw. Tidak mengganti primary runtime diam-diam.
- Canonical research/proposal/script/scene_plan/asset_manifest/edit_decisions/render_report/final_review dan decision_log/checkpoint tersedia di workspace evaluasi. Compose selesai. Tidak ada publish sosial.

Windows setup/launcher sudah disiapkan, namun PowerShell/Windows tidak tersedia pada executor; jangan menyebutnya sudah teruji pada laptop. Waktu CPU cloud tidak boleh dipakai sebagai estimasi pasti kecepatan laptop. Keputusan memilih workflow dapat dijalankan sekarang; penerimaan artistik pengguna dan pilot Windows tetap belum terbukti oleh uji cloud.

Source upstream OpenMontage fecb9a1e3cc23ef84de30b272059457a427f16f8. README-UPSTREAM.md, UPSTREAM.md dan lisensi asli dipertahankan. Source contoh baru dapat direproduksi di examples/ai-agent-workshop. File raw, source, check report, artefak canonical dan log tetap tersedia di workspace evaluasi; laporan paket berisi ringkasan dan hasil final tanpa credential.
