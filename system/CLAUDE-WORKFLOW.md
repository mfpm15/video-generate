# Alur otomatis Claude Code di laptop pengguna

Ini adalah urutan aktif untuk `/buat-video`, `/buat-seri`, `/buat-anime` dan skill langsung `/make-an-anime`. Urutan ini menggantikan instruksi lama “deskripsi dan style ditanyakan sekaligus”. Percakapan adalah input dinamis; semua file, prompt, konfigurasi, command, retry dan laporan dibuat/dijalankan Claude sendiri.

## 1. Judul → pertanyaan deskripsi

Jika input hanya judul, **tanyakan deskripsi terlebih dahulu**, dalam bahasa pengguna:

> “Videonya ingin membahas/bercerita tentang apa, untuk siapa, dan poin atau suasana apa yang ingin ditonjolkan? Boleh tulis bebas atau pilih ‘Bebas, Claude riset dan kembangkan’.”

Berikan ruang teks bebas. Jangan tampilkan daftar style final sebelum jawaban deskripsi dianalisis. Untuk seri, boleh tanyakan jumlah episode di tahap ini (default 14 jika tidak punya preferensi); untuk anime, cerita singkat boleh dikembangkan oleh Claude. Pertahankan deskripsi yang sudah diberikan, jangan menanyakannya ulang. Pengguna tidak perlu menulis naskah/file JSON/style bible.

## 2. Analisis dan verifikasi deskripsi

- Ringkas tujuan, penonton, bahasa, fakta versus fiksi, durasi dan format. Verifikasi klaim inti melalui sumber tepercaya; untuk fakta penting cari minimal dua sumber independen. Buang/beri batasan pada klaim yang tidak terdukung. Cerita fiksi diverifikasi untuk konsistensi karakter, logika dan kesesuaian brief, bukan diberi sumber fakta palsu.
- Jika ada sumber/ref visual dari pengguna, periksa dahulu. Jangan mengganti topik agar cocok dengan sebuah demo.
- Lakukan preflight ringan tools lokal dengan `python system/doctor.py --engine opuscar` (atau `anime`), menggunakan Python yang tersedia. Ini belum membuktikan render berhasil. Claude menangani instalasi/perbaikan dependency yang didukung, tanpa menimpa perubahan pengguna, mengubah upstream atau meminta pengguna mengetik command.
- Pastikan executor benar-benar laptop/WSL pengguna sebelum menyebut “dirender di laptop”. Jika Claude sedang di cloud, jelaskan tempat eksekusi aktual; jangan menganggap FFmpeg cloud adalah FFmpeg laptop. Jangan memindahkan produksi ke layanan/cloud lain diam-diam.

## 3. Daftar rekomendasi yang jelas → pilihan

Setelah deskripsi terverifikasi, tampilkan **3 rekomendasi yang relevan**, urutkan yang paling cocok. Setiap pilihan harus memuat:

| Pilihan | Nama look/template | Tampilan dan gerak yang akan terlihat | Alasan cocok untuk deskripsi | Engine dan batasan/biaya |
|---|---|---|---|---|
| 1 (direkomendasikan) | Nama nyata dari katalog atau art direction bebas yang konkret | Ciri tipografi, material/shading, kamera, palet, caption dan suara; bukan hanya “keren/cinematic” | Hubungkan dengan topik dan audiens yang baru dianalisis | Opuscar lokal/template atau custom; atau anime dengan generasi Fal berbayar dan finishing lokal |
| 2 | Alternatif dengan look berbeda | Jelaskan perbedaan yang nyata | Tradeoff relevan | Engine, format dan biaya |
| 3 | Alternatif ketiga | Jelaskan look nyata | Tradeoff relevan | Engine, format dan biaya |

Tambahkan **4. Otomatis: gunakan rekomendasi terbaik**, dan **5. Gaya sendiri/referensi saya** (teks bebas). Gunakan tool pilihan yang tersedia sambil mempertahankan tabel penjelasan; jika tool membatasi opsi, tampilkan 3 rekomendasi dan terima “otomatis”/gaya bebas lewat teks. Jangan menampilkan daftar 66 nama tanpa konteks. Jangan menyebut art direction bebas sebagai preset upstream yang telah diuji.

Tunggu pilihan pengguna. Jika sejak awal pengguna sudah menentukan style/template dengan jelas, pertahankan pilihan itu; berikan analisis kecocokan dan langsung lanjut. Jika pengguna sudah meminta “pilih otomatis”, tampilkan ringkas pilihan beserta alasan, lalu lanjut tanpa meminta konfirmasi lagi. Jawaban yang belum datang tidak dianggap pilihan/izin biaya.

## 4. Setelah pilihan → produksi otomatis sampai selesai

Claude mengerjakan semuanya: menyusun naskah/treatment, style contract internal, scaffold, renderer/prompt sesuai look, voice, timeline, score/SFX, caption, preview, render, mux, thumbnail dan paket posting. Default Shorts 1080×1920; pertahankan fps native style atau pilihan pengguna, bukan menurunkannya untuk mengejar cepat. Ikuti `STYLE-WORKFLOW.md` dan `QUALITY-GATES.md`. Katalog bukan batas input; `STYLE.md` hanya referensi teknis jika style resmi memang dipilih. Jangan meminta user mengeditnya.

- **Opuscar:** gunakan library/core resmi yang tersedia di laptop. Template bersama tetap template; style resmi/gaya bebas custom harus diwujudkan dalam renderer, bukan warna saja. `new-film.sh --render custom --requested-style "..."` mencatat pilihan tetapi Claude tetap harus menulis `main.js` custom sebelum build. Tulis `post.json` dan credits sebelum build; semua deliverable wajib harus lengkap.
- **Seri:** kunci style/cast/palet/layout untuk seluruh episode. Verifikasi fakta dan frame pilot lebih dulu, lalu lanjutkan otomatis semua bagian dalam scope yang diminta. Isi posting pack per episode sebelum batch build. Sesi yang terputus dilanjutkan dari artefak yang benar-benar lolos QA, bukan sekadar file MP4 yang ditemukan.
- **Mode silent yang diminta:** gunakan doctor `--silent`; set `narration:false` dan `audio:false`, buat timeline visual yang nyata tanpa WAV/word timing palsu. Build menyediakan track silent terukur; ASR/caption narasi ditandai NOT APPLICABLE, tetapi teks layar dan safe zone tetap diperiksa. Jangan menghapus suara dari brief yang memang memintanya.
- **Anime:** ikuti skill Ruby; image/video/voice/music memakai Fal, bukan dihitung offline karena FFmpeg berjalan lokal. Susun plan dengan jumlah panggilan, estimasi biaya dan batas retry konkret. Jika belum ada izin biaya yang mencakup plan itu, gabungkan pertanyaan izin dengan pemilihan look/plan final yang sudah bisa ditinjau. Pemasangan skill bukan izin membayar. Setelah diizinkan, lanjutkan sendiri; jangan terus meminta persetujuan untuk setiap shot. Jika pengguna meminta tanpa Fal, gunakan `anime-local` dan referensi `local-mode.md` skill; perlu artwork/footage yang tersedia atau tool/model gambar yang benar-benar ada, bukan janji bahwa FFmpeg dapat menciptakan karakter sendiri. Native Windows belum teruji, gunakan WSL untuk jalur ini; Swift VFX opsional hanya macOS.

Tidak perlu checkpoint storyboard/preview tambahan kecuali pengguna meminta, ada ambiguitas yang benar-benar memblokir, prasyarat eksternal hilang, atau scope/biaya yang disetujui akan terlampaui. Jangan otomatis memposting video.

## 5. Perbaikan dan verifikasi otomatis

Pantau command sampai selesai dan baca exit status/log. Bila gagal, diagnosis penyebab, perbaiki yang ada dalam scope, lalu jalankan ulang tahap terdampak. Jangan mengulang request berbayar identik untuk “mencoba keberuntungan”; gunakan receipts/cache dan allowance. Jangan mengabaikan ASR error, QA gagal, teks hilang, caption kosong, atau file deliverable yang belum dibuat. Tidak boleh melonggarkan assertion, menurunkan kualitas/resolusi/model, menandai teks penting `pass:true`, atau menutupi kegagalan dengan `echo DONE`.

Render/review beberapa frame termasuk pembuka, scene utama, transisi, kamera ekstrem, caption terpanjang dan akhir; periksa safe zone/UI/crop, brand, fokus/wajah dan kesesuaian look. Perbaiki dan render ulang otomatis bila ada cacat. Review playback/audio dengan tool yang tersedia; jika tidak dapat didengar/ditonton, tandai NOT TESTED, bukan VERIFIED. Human review yang belum bisa diotomatisasi dicantumkan di laporan akhir, bukan dipalsukan.

## 6. Delivery

Tampilkan lokasi output lokal yang benar, pilihan look yang diterapkan, MP4/thumbnail/CAPTION.txt/HASHTAGS.txt/POST.md/credits/QA, hasil pemeriksaan dan batasan nyata. Bedakan “build teknis selesai” dengan “kualitas visual/audio terverifikasi”. Jangan menyebut proses laptop end-to-end berhasil berdasarkan tes cloud, fixtures sintetis atau pemeriksaan Markdown saja.

## Gerak dan caption pada video silent

Bila user meminta caption tanpa suara, caption tetap dibuat dan dibakar ke video. `visual_words` dan cues berlabel `authored_visual_not_speech` menyediakan timing visual tanpa WAV/Whisper palsu; set `captions_required:true`. Pemeriksaan bounds/overlap caption tetap wajib. Bila user meminta karakter anime bergerak pada mode lokal, pisahkan actor/clean plate dan rig gerak karakter; camera-only tidak memenuhi permintaan. Uji dengan kamera/environment terkunci agar gerak kepala/tangan terbukti independen.
