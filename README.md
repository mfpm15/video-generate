# Video Generate — OpenMontage lokal

Workflow utama mandiri berbasis [OpenMontage](https://github.com/OpenMontageInc/OpenMontage), tanpa menggabungkan engine Opuscar. Source upstream dan lisensi AGPLv3 dipertahankan; versi sumber tercatat di UPSTREAM.md. Dokumentasi asli ada di README-UPSTREAM.md.

Profil pengguna: Windows 11, Intel Core Ultra 7 155U, RAM16GB, GPU Intel terintegrasi; Claude Code Pro yang sudah dimiliki; biaya API tambahan $0. Render di laptop. Checkout/tes cloud tidak membuktikan laptop telah diuji.

## Menjalankan di laptop

1. Pastikan Git, Python3.10+, FFmpeg/ffprobe, dan Node versi yang didukung tersedia. Engine upstream mensyaratkan Node22.23.4+, 24.22.1+, atau 26.12.1+ pada masing-masing major tersebut.
2. Jalankan `.\Setup-FreeLocal.ps1` dari PowerShell. Ini membuat venv, memasang dependency Python dan CLI HyperFrames0.9.36 lokal/cache. Tidak memasang model GPU, tidak meminta key API, tidak mendaftar layanan berbayar. Instalasi memerlukan internet; aset render harus disimpan lokal setelah setup.
3. Jalankan `.\Start-FreeClaude.ps1` untuk membuka Claude Code dengan login Pro milik pengguna dan profil gratis. Tidak perlu memasukkan ANTHROPIC_API_KEY.
4. Gunakan `/buat-video Judul` atau `/buat-seri Judul`. Claude meminta deskripsi yang belum ada, memverifikasi, menjelaskan tiga rekomendasi tampilan lalu menjalankan pilihan atau memilih otomatis jika diminta. Gaya bebas tetap diterima; tidak perlu mengedit STYLE.md.

Jalur utama yang dipilih: HyperFrames + GSAP/Three.js + FFmpeg lokal. Remotion tetap didukung upstream, opsional; lisensi gratisnya bersyarat (individu, organisasi yang memenuhi syarat, atau evaluasi). Baca LOCAL_FREE_ONLY.md sebelum produksi. Batas pemakaian Claude Pro tetap berlaku.

## Kemampuan dan batas

Cocok untuk editing footage/aset milik pengguna, caption, motion graphics, animasi2D dan 3D sederhana. Tidak menjanjikan anime generatif natural gratis dengan GPU terintegrasi/RAM16GB. Jangan mengganti permintaan akting generatif dengan zoom pada gambar atau warp kecil dan menyebutnya setara.

Anggaran cap$0 adalah guard orchestration, bukan firewall. Launcher menonaktifkan credential provider dari environment proses dan menolak credential media di .env; instruksi agent juga melarang paid generator, cloud render, dan publikasi. Key/trial gratis sebuah provider tidak dianggap jaminan tanpa biaya.

## Validasi

Evaluasi memakai brief AI Agent: Dari Ide ke Aksi, 12 detik,1080x1920,24fps,caption Indonesia dan silent AAC. Source contoh berada di examples/ai-agent-workshop; laporan keputusan ada di EVALUASI-ID.md; penilaian visual dan performa dilaporkan dengan batasan cloud. Jangan menyimpulkan kualitas lebih baik dari jumlah tool atau hasil tes unit saja.

Lihat [keputusan dan batas evaluasi](EVALUASI-ID.md), [bukti QA](docs/evaluation/), dan [source contoh](examples/ai-agent-workshop/). MP4 A/B dikirim sebagai paket perbandingan di chat. Versi sebelumnya tersedia di branch `archive/opuscar-before-openmontage`. Adaptor berbayar upstream tetap ada sebagai source opsional; profil kita tidak mengaktifkan/memanggilnya.

Panduan langkah demi langkah, contoh prompt dan dashboard lokal: [PANDUAN-CLAUDE-CODE.md](PANDUAN-CLAUDE-CODE.md). Buka Backlot dengan `.\Start-Board.ps1` atau `/backlot` di Claude Code. Input produksi tetap melalui Claude Code; Backlot adalah dashboard baca-saja.
