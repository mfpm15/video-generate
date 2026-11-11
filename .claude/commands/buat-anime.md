---
description: Buat atau revisi anime dari cerita, dengan template/style pilihan, rencana biaya, dan toolkit make-an-anime. Produksi Fal hanya setelah diizinkan.
argument-hint: "Judul atau path cerita [| deskripsi] [| template/style]"
---

Baca juga `system/QUALITY-GATES.md`: kualitas upstream dan danger zone (UI/crop serta pitfalls style) adalah quality gate untuk setiap hasil. Claude menanganinya otomatis dari brief; jangan meminta user mengedit file. Jangan melaporkan kualitas setara atau siap posting sebelum ada bukti review video, safe zone, audio dan QA.

Input pengguna: $ARGUMENTS

Baca `.claude/skills/make-an-anime/SKILL.md` dan referensi integrasi repositorinya. Gunakan skill itu untuk eksekusi. Jawab dalam bahasa pengguna. Root proyek adalah checkout saat ini, bukan path Windows tetap.

## Intake bertahap dan otomatis

Jalankan `system/CLAUDE-WORKFLOW.md`: judul → tanyakan deskripsi/cerita dahulu → analisis/verifikasi → tabel 3 rekomendasi look yang jelas, plus otomatis/gaya sendiri → pilihan → produksi dan QA otomatis. Jika deskripsi/gaya sudah diberikan, jangan tanyakan ulang. Pengguna cukup bicara di chat; Claude menulis style bible, plan, prompt, config dan renderer. Jangan mewajibkan edit STYLE.md atau pilihan preset statis.

Verifikasi fiksi untuk konsistensi cerita; verifikasi fakta nyata dengan sumber. Template contoh hanya dipakai jika dipilih. Inisialisasi proyek baru `anime/<slug>/` lewat CLI Ruby skill dengan path absolut; jangan menimpa repo/film/proyek lain. Kunci cast/style dan budget untuk seri, review pilot lalu lanjut sendiri dalam izin yang ada.

## Persiapan, biaya, produksi

- Jalankan `setup` dan `doctor` melalui Ruby. Untuk skill lokal ini kredensial datang dari `FAL_AI_API_KEY` di environment Claude Code; plugin/MCP upstream tidak otomatis terpasang. Arahkan pengisian lewat environment/secret manager, jangan minta key di chat.
- Tampilkan rencana konkret dan biaya sebelum generasi atau upload. Perintah ini tidak dengan sendirinya menyetujui Fal berbayar. Catat `plan:approve` hanya setelah ada izin produksi yang nyata; gunakan izin terdahulu bila memang mencakup rencana tersebut.
- Produksi mengikuti skill: sheets → suara/score → keyframe → animasi → overlay → SFX → review. MiniMax H3 default; Seedance hanya bila diminta. Swift VFX opsional khusus macOS.
- Setiap prompt gambar menggunakan style bible; prompt gerak memakai style ringkas dan arahan shot. Cocokkan keyframe perwakilan dengan style sebelum animasi. Jangan mengganti style/model/format diam-diam saat gagal.
- Tinjau hasil terhadap `STYLE-CONTRACT.md`, konsistensi karakter, kontinuitas, gerak, caption dan audio. Bedakan pemeriksaan frame, playback, dan pendengaran; laporkan yang belum dilakukan. Revisi di dalam allowance, minta keputusan hanya jika perlu melewati biaya/scope yang diizinkan.

## Hasil

Simpan video bersih dan final dengan caption terbakar, credit/lisensi, plan, style contract dan laporan QA di proyek anime. Sertakan branding `ngetehnology` melalui overlay anime sesuai brief. Tidak ada publikasi otomatis atau `.srt` tambahan. Laporkan lokasi output, style/template yang benar-benar diterapkan, biaya/panggilan aktual dan batasan yang tersisa. Lemo-Opuscar tetap dipakai oleh `/buat-video` dan `/buat-seri`; format proyek kedua engine berbeda.

## Tanpa Fal bila diminta

Ikuti `.claude/skills/make-an-anime/references/local-mode.md`. Gunakan `python system/doctor.py --engine anime-local`; jangan memblokir editing/render lokal hanya karena key Fal kosong. Perlu artwork/footage yang tersedia atau model gambar lokal/tool gambar yang benar-benar tersedia. Labeli sebagai motion-comic/compositing, bukan gerak generatif H3. Jangan menjanjikan Claude Code bisa membuat artwork offline dari judul tanpa aset/model.
