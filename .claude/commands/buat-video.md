---
description: Judul → pertanyaan deskripsi → verifikasi → daftar rekomendasi style → pilihan → produksi video lokal dan QA otomatis.
argument-hint: "Judul [| deskripsi] [| gaya atau otomatis]"
---

Input pengguna: $ARGUMENTS

Baca `system/CLAUDE-WORKFLOW.md` dan jalankan urutannya, bukan sekadar menjelaskannya. Jawab dalam bahasa pengguna. Jika hanya judul, tanyakan deskripsi dulu; sesudah jawaban diverifikasi baru tampilkan daftar style beserta tampilan, alasan, engine dan biaya yang jelas. Style bebas/referensi diterima, tidak perlu user mengedit file. Pertahankan pilihan/izin yang sudah diberikan.

Default engine Lemo-Opuscar; jika pengguna secara eksplisit memilih toolkit anime, muat `.claude/skills/make-an-anime/SKILL.md` dan ikuti routing/biayanya. Jangan menganggap kata “anime” pada deskripsi look sebagai izin Fal berbayar.

Setelah pilihan final, kerjakan riset, naskah, renderer/prompt sesuai look, voice/timeline, render/mix/mux FFmpeg, caption, thumbnail, posting pack, review dan perbaikan otomatis sampai selesai. Baca `system/VIDEO-RULES.md`, `system/STYLE-WORKFLOW.md`, dan `system/QUALITY-GATES.md`. Tulis post.json sebelum build. Hormati kegagalan build/QA; jangan mengklaim selesai hanya dari MP4 yang ada. Laporkan mesin dan lokasi eksekusi aktual, bukan laptop yang belum diakses. Jangan otomatis memposting.
