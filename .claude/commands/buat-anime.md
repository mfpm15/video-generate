---
description: Buat atau revisi anime dari cerita, dengan template/style pilihan, rencana biaya, dan toolkit make-an-anime. Produksi Fal hanya setelah diizinkan.
argument-hint: "Judul atau path cerita [| deskripsi] [| template/style]"
---

Baca juga `system/QUALITY-GATES.md`: kualitas upstream dan danger zone (UI/crop serta pitfalls style) adalah quality gate untuk setiap hasil. Claude menanganinya otomatis dari brief; jangan meminta user mengedit file. Jangan melaporkan kualitas setara atau siap posting sebelum ada bukti review video, safe zone, audio dan QA.

Input pengguna: $ARGUMENTS

Baca `.claude/skills/make-an-anime/SKILL.md` dan referensi integrasi repositorinya. Gunakan skill itu untuk eksekusi. Jawab dalam bahasa pengguna. Root proyek adalah checkout saat ini, bukan path Windows tetap.

## Input visual dinamis

Pengguna memberi cerita/gaya/template/referensi atau revisi langsung lewat percakapan. Terima bahasa bebas dan gabungan gaya; jangan membatasi ke preset atau meminta user mengedit style.md. Claude yang membuat/memperbarui style bible, kontrak, prompt dan overlay otomatis berdasarkan input terbaru. Bila gaya sudah jelas, lanjutkan tanpa menanyakan pilihan katalog. File internal menjaga konsistensi antarshot, bukan menggantikan input dinamis user.

## Intake dan style

1. Baca cerita/file yang diberikan. Jika hanya judul, tawarkan cerita singkat berdasarkan judul; jika revisi video, periksa sumber dan jelaskan apakah cukup edit lokal atau membutuhkan generasi ulang. Jangan mengklaim ada filter video-ke-anime otomatis.
2. Tanyakan sekaligus hanya informasi yang belum tersedia: cerita/deskripsi, **template atau style visual**, durasi, dan format. Tawarkan beberapa look konkret sesuai topik (misalnya cel-shaded aksi, slice-of-life pastel, drama sinematik); nama itu arahan kreatif, bukan preset renderer teruji. Untuk Shorts usulkan 9:16, 24 fps, dialog sesuai bahasa brief. Pilihan eksplisit pengguna selalu diutamakan.
3. Template contoh bawaan boleh dipakai hanya bila dipilih pengguna. Jika style sendiri, tulis art direction sendiri. Baca contoh wajib untuk teknik, jangan menyalin tokoh/ceritanya sebagai hasil pengguna.
4. Inisialisasi project baru `anime/<slug>/` lewat Ruby CLI skill, dengan path cerita dan project absolut. Jangan menulis output di folder skill atau menimpa proyek yang sudah ada.
5. Kunci `config/style.md`, `docs/STYLE-CONTRACT.md` dan `docs/PLAN.md`: template/style terpilih, referensi, linework, desain karakter, shading, lighting, palet, komposisi, kamera, gerak, caption, suara, ukuran/fps, shot list, jumlah panggilan berbayar dan allowance retry. Pertahankan style itu pada semua scene/episode.

Untuk permintaan seri, susun rencana per episode dengan cast/style bersama dan total budget, simpan workspace di `anime/<slug>/`. Selesaikan pilot dan review look sebelum episode berikutnya; lanjutkan semua episode dalam izin yang sudah diberikan. Jangan memakai `system/series.py` karena formatnya khusus Opuscar.

## Persiapan, biaya, produksi

- Jalankan `setup` dan `doctor` melalui Ruby. Untuk skill lokal ini kredensial datang dari `FAL_AI_API_KEY` di environment Claude Code; plugin/MCP upstream tidak otomatis terpasang. Arahkan pengisian lewat environment/secret manager, jangan minta key di chat.
- Tampilkan rencana konkret dan biaya sebelum generasi atau upload. Perintah ini tidak dengan sendirinya menyetujui Fal berbayar. Catat `plan:approve` hanya setelah ada izin produksi yang nyata; gunakan izin terdahulu bila memang mencakup rencana tersebut.
- Produksi mengikuti skill: sheets → suara/score → keyframe → animasi → overlay → SFX → review. MiniMax H3 default; Seedance hanya bila diminta. Swift VFX opsional khusus macOS.
- Setiap prompt gambar menggunakan style bible; prompt gerak memakai style ringkas dan arahan shot. Cocokkan keyframe perwakilan dengan style sebelum animasi. Jangan mengganti style/model/format diam-diam saat gagal.
- Tinjau hasil terhadap `STYLE-CONTRACT.md`, konsistensi karakter, kontinuitas, gerak, caption dan audio. Bedakan pemeriksaan frame, playback, dan pendengaran; laporkan yang belum dilakukan. Revisi di dalam allowance, minta keputusan hanya jika perlu melewati biaya/scope yang diizinkan.

## Hasil

Simpan video bersih dan final dengan caption terbakar, credit/lisensi, plan, style contract dan laporan QA di proyek anime. Sertakan branding `ngetehnology` melalui overlay anime sesuai brief. Tidak ada publikasi otomatis atau `.srt` tambahan. Laporkan lokasi output, style/template yang benar-benar diterapkan, biaya/panggilan aktual dan batasan yang tersisa. Lemo-Opuscar tetap dipakai oleh `/buat-video` dan `/buat-seri`; format proyek kedua engine berbeda.
