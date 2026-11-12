---
description: Produksi satu video lokal dari judul dan deskripsi, dengan biaya API tambahan nol.
argument-hint: "Judul [| deskripsi] [| gaya atau otomatis]"
---

Input pengguna: $ARGUMENTS

Baca AGENT_GUIDE.md dan LOCAL_FREE_ONLY.md. Jalankan workflow OpenMontage asli secara mandiri. Anggaran API tambahan $0, render lokal, tidak ada publikasi otomatis. Gunakan login Claude Code Pro pengguna, bukan API LLM berbayar.

Jika baru judul, tanyakan deskripsi dahulu. Setelah deskripsi dipahami/verifikasi, jelaskan tiga rekomendasi look: tampilan dan gerak yang terlihat, alasan cocok, batas hardware, serta engine lokal. Terima gaya bebas/referensi dan pilihan otomatis. Pertahankan jawaban yang sudah ada; bila user telah mendelegasikan pilihan/proses penuh, catat approval_policy sesuai upstream dan lanjut dalam scope tersebut tanpa menanyakan izin rutin lagi. Setelah pengguna menyetujui brief dan memilih look/otomatis untuk produksi, catat scope approval tersebut beserta kebijakan checkpoint lalu jalankan script, scene plan, assets, edit, render dan QA otomatis dalam scope itu. Jika pengguna mengizinkan produksi penuh, jangan minta persetujuan rutin per tahap lagi; tanyakan hanya perubahan material di luar brief atau blocker nyata. Jangan memperluas persetujuan ini menjadi izin API berbayar/publikasi. Jangan meminta user mengedit STYLE.md, JSON atau command terminal.

Jalankan preflight nyata, pilih pipeline, baca tiap director skill, buat canonical artifacts/decision log/checkpoints. Pertimbangkan HyperFrames untuk HTML/GSAP/Three.js dan Remotion bila tersedia serta lisensinya cocok; jangan mengubah engine diam-diam. Untuk hero work gunakan komposisi atelier yang dibuat sesuai cerita, bukan menumpuk stock card. Runtime tidak otomatis membuat kualitas artistik lebih baik.

Periksa beberapa frame nyata, posisi teks/objek penting, gerak sesuai aksi, timing baca, playback dan file MP4 final. Jalankan `python scripts/verify-local-mp4.py <final.mp4> --report <qa.json>` pada file final. Ini memeriksa codec/warna/faststart dan decode penuh; lakukan review artistik/gerak secara terpisah. Perbaiki otomatis dalam scope. Library dan font harus tersedia lokal untuk render; jangan bergantung CDN saat render. Format target standar 1080x1920@24/30, H264 yuv420p/SAR1/BT709/faststart dengan AAC sesuai brief. Gunakan HyperFrames quality high untuk final utama. Bila stream H264 sudah memenuhi spesifikasi, remux dengan copy video untuk menghindari recompress; bila perlu encode ulang, gunakan CRF18 atau lebih baik sesuai brief. Pertahankan kualitas/resolusi yang dipilih; salinan ringan diberi label terpisah.

Untuk seri, buktikan pilot dan kunci visual sebelum bagian berikutnya; resume hanya jika artefak dan hasil QA masih cocok. Untuk anime, bedakan animasi2D/rig/cel lokal dari video generatif. Intel iGPU/RAM16GB tidak menjadi janji inference video berat. Bila aksi/penampilan yang diminta memerlukan model/aset yang tidak tersedia dalam jalur gratis, jelaskan blocker konkret sebelum mengganti treatment. Jangan menyebut gambar di-zoom atau warp kecil sebagai akting yang diminta.
