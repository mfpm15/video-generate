# Perbaikan contoh setelah ditolak pengguna

Pengguna menolak kualitas artistik Opuscar pertama dan gerak anime yang terlalu terbatas; file anime juga tidak dapat dibuka di pihak pengguna. Keberhasilan tes teknis sebelumnya tidak mengubah penolakan itu.

Opuscar baru memakai objek glass/chrome 3D original, kamera close-up/orbit, layer yang terbuka, jaringan cahaya dan assembly. Kode ada di `films/ai-agent-3d-v2`. Ini art direction custom yang belajar dari Glass Product Render, bukan klaim identik dengan seluruh shader demo upstream. Perubahan biaya render dijelaskan di STYLE-CONTRACT.md. FullHD dan 2× supersampling geometri dipertahankan; Mesa gl-egl/llvmpipe jauh lebih cepat daripada SwiftShader pada executor ini.

Anime baru memakai delapan cel lari dan enam pose lompat, bukan warp kecil pada satu ilustrasi. Produksi lokal Ruby/p5/FFmpeg, 12 detik, 1080x1920@24, caption Indonesia dan silent AAC. Cel lari berganti pada 12 gambar/detik; ini pilihan timing animasi 2D pada timeline 24fps, bukan klaim 24 frame generatif H3. Aset dibuat dengan tool gambar native chat yang tidak mengekspos identifier model. Fal/H3 tidak dipanggil. Aset besar/proyek anime tidak dipublikasikan ke Git; sumber disertakan pada paket unduhan.

File anime lama berhasil mencapai akhir di Chromium cloud, sehingga penyebab kegagalan pada perangkat/link pengguna belum teridentifikasi. Ekspor baru menambahkan SAR1, H264 High level4.1, AAC silent, BT709 VUI, faststart; salinan 720p dan ZIP disediakan sebagai alternatif. `system/tools/check-playback.mjs` mengukur playback nyata sampai ended dan mencatat dropped frames, terpisah dari decoding FFmpeg. Jangan menyamakan tes cloud dengan bukti semua ponsel atau UI unduhan bekerja.
