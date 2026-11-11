# Cara memulai (Windows)

Folder proyek: `D:\content-video-generate`. Peta folder dan aturan ada di `system/README.md`.

## Video baru
Di Claude Code (Git Bash) ketik:
```
/buat-video Judul video Anda
```
Claude menanyakan SEKALI (deskripsi dan style dari 66 pilihan). Setelah itu semuanya otomatis: folder `films/<slug>/` dibuat otomatis, video dibuat, dan hasilnya ada di `films/<slug>/final/` (mp4, thumbnail.jpg, POST.md, QA-REPORT.md, CREDITS).

## Perintah manual (opsional)
```
sh system/new-film.sh "Judul" --style AUTO     # buat folder film
sh system/build.sh <slug>                      # buat video (SKIP_VOICE=1 = tanpa TTS online)
sh system/clean.sh <slug>                      # hemat disk setelah selesai
```

## Cek lingkungan (hanya membaca, tidak menginstal)
`powershell -ExecutionPolicy Bypass -File .\system	oolsuditudit.ps1`
