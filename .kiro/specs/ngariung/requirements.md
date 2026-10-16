# Requirements Document

## Introduction

Ngariung adalah aplikasi chat web real-time untuk komunitas kecil seperti kelas kuliah, kelompok belajar, atau tim proyek. Aplikasi ini menyediakan ruang obrolan terbuka/privat dan pesan pribadi 1-on-1 dengan fitur kehadiran real-time. Nama "Ngariung" berasal dari bahasa Sunda yang berarti "berkumpul bersama".

**Stack Teknologi:** ASP.NET Core, SignalR, ASP.NET Core Identity, EF Core, SQLite/PostgreSQL

**Target Pengguna:** Komunitas kecil (10-100 pengguna) yang membutuhkan platform komunikasi sederhana

## Glossary

- **Ngariung_System**: Seluruh aplikasi chat real-time termasuk backend, SignalR hub, dan frontend
- **User**: Pengguna terdaftar dengan akun di sistem
- **Room**: Ruang obrolan yang dapat diikuti oleh banyak pengguna
- **Direct_Message**: Pesan pribadi antara dua pengguna
- **Message**: Pesan teks yang dikirim dalam Room atau Direct_Message
- **Authentication_Service**: Komponen yang menangani registrasi, login, dan manajemen sesi
- **SignalR_Hub**: Komponen server real-time yang menangani koneksi WebSocket
- **Presence_Service**: Komponen yang mengelola status online/offline pengguna
- **Message_Store**: Komponen yang menyimpan dan mengambil pesan dari database
- **Room_Service**: Komponen yang mengelola ruang obrolan dan keanggotaan
- **Valid_Email**: Format email yang memenuhi standar RFC 5322
- **Display_Name**: Nama tampilan pengguna dengan panjang 2-50 karakter
- **Room_Type**: Tipe ruang - Public (terbuka untuk semua), Private (hanya dengan undangan), atau Direct (percakapan 1-on-1)
- **User_Status**: Status kehadiran pengguna - Online, Busy (Sibuk), Away (Sedang pergi), atau Offline
- **Connection_State**: Status koneksi SignalR - Connected, Reconnecting, atau Disconnected
- **Rate_Limit**: Batasan jumlah operasi per periode waktu untuk mencegah spam

## Requirements

### Requirement 1: Registrasi Pengguna

**User Story:** Sebagai pengguna baru, saya ingin mendaftar akun dengan email dan password, sehingga saya dapat mengakses aplikasi chat.

#### Acceptance Criteria

1. WHEN pengguna mengirim data registrasi dengan Valid_Email, password minimal 6 karakter, dan Display_Name, THE Authentication_Service SHALL membuat akun baru dan mengembalikan token autentikasi
2. IF pengguna mengirim email yang sudah terdaftar, THEN THE Authentication_Service SHALL menolak registrasi dengan pesan error "Email sudah digunakan"
3. IF pengguna mengirim password kurang dari 6 karakter, THEN THE Authentication_Service SHALL menolak registrasi dengan pesan error "Password minimal 6 karakter"
4. IF pengguna mengirim Display_Name kurang dari 2 karakter atau lebih dari 50 karakter, THEN THE Authentication_Service SHALL menolak registrasi dengan pesan error validasi panjang nama
5. WHEN akun baru berhasil dibuat, THE Room_Service SHALL otomatis menambahkan User ke ruang "umum"
6. WHEN akun baru berhasil dibuat, THE Authentication_Service SHALL menyimpan password dengan hashing bcrypt atau Argon2

### Requirement 2: Login dan Autentikasi

**User Story:** Sebagai pengguna terdaftar, saya ingin login dengan email dan password, sehingga saya dapat mengakses ruang obrolan saya.

#### Acceptance Criteria

1. WHEN pengguna mengirim kredensial valid (email dan password benar), THE Authentication_Service SHALL mengembalikan JWT token dengan masa berlaku 7 hari
2. IF pengguna mengirim kredensial tidak valid, THEN THE Authentication_Service SHALL menolak login dengan pesan error "Email atau password salah"
3. WHEN login berhasil, THE Authentication_Service SHALL membuat sesi yang persisten hingga pengguna logout atau token expired
4. THE Authentication_Service SHALL menerapkan rate limiting maksimal 5 percobaan login gagal per IP address dalam 15 menit
5. IF pengguna melebihi rate limit login, THEN THE Authentication_Service SHALL memblokir percobaan login selama 15 menit

### Requirement 3: Logout

**User Story:** Sebagai pengguna yang sedang login, saya ingin logout dari aplikasi, sehingga sesi saya berakhir dengan aman.

#### Acceptance Criteria

1. WHEN pengguna melakukan logout, THE Authentication_Service SHALL menghapus token sesi dari client
2. WHEN pengguna melakukan logout, THE Presence_Service SHALL mengubah User_Status menjadi Offline
3. WHEN pengguna melakukan logout, THE SignalR_Hub SHALL memutuskan koneksi real-time pengguna

### Requirement 4: Manajemen Profil Pengguna

**User Story:** Sebagai pengguna, saya ingin mengubah Display_Name dan User_Status saya, sehingga informasi profil saya selalu terkini.

#### Acceptance Criteria

1. WHEN pengguna terautentikasi mengirim Display_Name baru dengan panjang 2-50 karakter, THE Ngariung_System SHALL memperbarui Display_Name di database
2. WHEN pengguna terautentikasi memilih User_Status (Online, Busy, Away), THE Presence_Service SHALL memperbarui status pengguna
3. WHEN Display_Name atau User_Status berubah, THE SignalR_Hub SHALL mengirim notifikasi PresenceChanged ke semua pengguna di ruang yang sama
4. IF pengguna mengirim Display_Name kurang dari 2 atau lebih dari 50 karakter, THEN THE Ngariung_System SHALL menolak perubahan dengan pesan error validasi

### Requirement 5: Pemilihan Tema

**User Story:** Sebagai pengguna, saya ingin memilih tema tampilan (sistem, terang, gelap), sehingga aplikasi nyaman dilihat sesuai preferensi saya.

#### Acceptance Criteria

1. WHEN pengguna memilih tema (system, light, dark), THE Ngariung_System SHALL menyimpan preferensi tema di local storage browser
2. WHERE tema dipilih "system", THE Ngariung_System SHALL mengikuti preferensi tema sistem operasi pengguna
3. WHERE tema dipilih "light", THE Ngariung_System SHALL menampilkan antarmuka dengan skema warna terang
4. WHERE tema dipilih "dark", THE Ngariung_System SHALL menampilkan antarmuka dengan skema warna gelap

### Requirement 6: Pembuatan Ruang Obrolan

**User Story:** Sebagai pengguna, saya ingin membuat ruang obrolan baru dengan nama dan deskripsi, sehingga saya dapat mengorganisir percakapan berdasarkan topik.

#### Acceptance Criteria

1. WHEN pengguna terautentikasi mengirim nama ruang (3-50 karakter), deskripsi opsional (maksimal 200 karakter), dan Room_Type (Public atau Private), THE Room_Service SHALL membuat Room baru
2. WHEN Room berhasil dibuat, THE Room_Service SHALL menambahkan pembuat sebagai anggota pertama dengan role "Owner"
3. THE Room_Service SHALL memastikan nama ruang unik (case-insensitive) dalam sistem
4. IF pengguna mengirim nama ruang yang sudah ada, THEN THE Room_Service SHALL menolak pembuatan dengan pesan error "Nama ruang sudah digunakan"
5. IF pengguna mengirim nama ruang kurang dari 3 atau lebih dari 50 karakter, THEN THE Room_Service SHALL menolak pembuatan dengan pesan error validasi panjang nama
6. WHEN Room baru dibuat, THE Room_Service SHALL menyimpan timestamp CreatedAt dengan waktu UTC

### Requirement 7: Daftar dan Navigasi Ruang Obrolan

**User Story:** Sebagai pengguna, saya ingin melihat daftar ruang yang saya ikuti dan berpindah antar ruang, sehingga saya dapat mengakses percakapan yang relevan.

#### Acceptance Criteria

1. WHEN pengguna terautentikasi meminta daftar ruang, THE Room_Service SHALL mengembalikan semua Room yang diikuti pengguna tersebut
2. THE Room_Service SHALL mengembalikan untuk setiap Room: nama, deskripsi, Room_Type, jumlah anggota, dan timestamp pesan terakhir
3. WHEN pengguna memilih Room, THE SignalR_Hub SHALL menambahkan koneksi pengguna ke grup SignalR Room tersebut
4. WHEN pengguna berpindah Room, THE Room_Service SHALL memperbarui LastReadAt untuk Room sebelumnya
5. THE Room_Service SHALL mengurutkan daftar Room berdasarkan timestamp pesan terakhir (terbaru di atas)

### Requirement 8: Informasi Ruang dan Anggota

**User Story:** Sebagai anggota ruang, saya ingin melihat deskripsi ruang, daftar anggota, dan status online mereka, sehingga saya tahu siapa yang aktif.

#### Acceptance Criteria

1. WHEN pengguna membuka detail Room, THE Room_Service SHALL menampilkan nama, deskripsi, Room_Type, dan timestamp pembuatan
2. WHEN pengguna membuka detail Room, THE Room_Service SHALL menampilkan daftar semua anggota dengan Display_Name, User_Status, dan role (Owner/Member)
3. THE Presence_Service SHALL menandai anggota dengan Connection_State "Connected" sebagai Online
4. THE Presence_Service SHALL memperbarui status kehadiran anggota secara real-time ketika terjadi perubahan

### Requirement 9: Keluar dari Ruang Obrolan

**User Story:** Sebagai anggota ruang, saya ingin keluar dari ruang yang tidak lagi saya ikuti, sehingga daftar ruang saya tetap relevan.

#### Acceptance Criteria

1. WHEN pengguna terautentikasi memilih keluar dari Room, THE Room_Service SHALL menghapus keanggotaan pengguna dari Room tersebut
2. IF pengguna mencoba keluar dari ruang "umum", THEN THE Room_Service SHALL menolak permintaan dengan pesan error "Tidak dapat keluar dari ruang umum"
3. WHEN pengguna keluar dari Room, THE SignalR_Hub SHALL menghapus koneksi pengguna dari grup SignalR Room tersebut
4. WHEN pengguna keluar dari Room, THE SignalR_Hub SHALL mengirim notifikasi RoomUpdated ke anggota lain di Room tersebut

### Requirement 10: Pengiriman Pesan Teks

**User Story:** Sebagai anggota ruang, saya ingin mengirim pesan teks, sehingga saya dapat berkomunikasi dengan anggota lain.

#### Acceptance Criteria

1. WHEN pengguna terautentikasi mengirim Message dengan body teks (1-500 karakter) ke Room yang diikuti, THE Message_Store SHALL menyimpan Message dengan RoomId, SenderId, Body, Kind "Text", dan CreatedAt
2. WHEN Message berhasil disimpan, THE SignalR_Hub SHALL mengirim ReceiveMessage ke semua anggota Room yang terhubung dalam waktu maksimal 300ms (p95) dengan 100 koneksi
3. THE Ngariung_System SHALL menerapkan rate limiting maksimal 10 pesan per User per menit
4. IF pengguna melebihi rate limit pesan, THEN THE SignalR_Hub SHALL menolak pengiriman dengan pesan error "Terlalu banyak pesan, tunggu sebentar"
5. IF pengguna mengirim body kosong atau lebih dari 500 karakter, THEN THE SignalR_Hub SHALL menolak pengiriman dengan pesan error validasi
6. IF pengguna mencoba mengirim Message ke Room yang tidak diikuti, THEN THE SignalR_Hub SHALL menolak dengan pesan error "Anda bukan anggota ruang ini"
7. THE Message_Store SHALL melakukan escape HTML untuk mencegah XSS attack pada body Message

### Requirement 11: Penerimaan Pesan Real-time

**User Story:** Sebagai anggota ruang, saya ingin menerima pesan baru secara otomatis tanpa refresh, sehingga percakapan terasa natural.

#### Acceptance Criteria

1. WHEN Message baru dikirim ke Room, THE SignalR_Hub SHALL mengirim ReceiveMessage ke semua User yang Connection_State "Connected" di Room tersebut
2. THE SignalR_Hub SHALL mengirim untuk setiap Message: id, senderId, Display_Name pengirim, body, timestamp, dan kind
3. WHEN pengguna menerima ReceiveMessage, THE Ngariung_System SHALL menampilkan Message di antarmuka secara otomatis tanpa reload halaman
4. THE Ngariung_System SHALL mengelompokkan Message berurutan dari pengirim yang sama dalam periode 5 menit

### Requirement 12: Riwayat Pesan dengan Pagination

**User Story:** Sebagai anggota ruang, saya ingin melihat riwayat pesan lama dengan scroll ke atas, sehingga saya dapat membaca konteks percakapan sebelumnya.

#### Acceptance Criteria

1. WHEN pengguna membuka Room, THE Message_Store SHALL memuat 50 Message terbaru dari Room tersebut
2. WHEN pengguna scroll ke atas hingga mencapai pesan tertua yang dimuat, THE Message_Store SHALL memuat 50 Message sebelumnya (infinite scroll)
3. WHEN pengguna meminta riwayat dengan parameter "before" timestamp, THE Message_Store SHALL mengembalikan maksimal 50 Message yang CreatedAt lebih lama dari timestamp tersebut
4. THE Message_Store SHALL mengurutkan Message berdasarkan CreatedAt secara ascending (lama ke baru)
5. IF tidak ada lagi Message lebih lama, THEN THE Message_Store SHALL mengembalikan array kosong

### Requirement 13: Indikator Sedang Mengetik

**User Story:** Sebagai anggota ruang, saya ingin melihat siapa yang sedang mengetik, sehingga saya tahu ada respons yang akan datang.

#### Acceptance Criteria

1. WHEN pengguna mulai mengetik di Room, THE SignalR_Hub SHALL mengirim event StartTyping ke Room tersebut
2. WHEN event StartTyping diterima, THE SignalR_Hub SHALL mengirim notifikasi UserTyping ke semua anggota Room kecuali pengirim
3. THE SignalR_Hub SHALL menyertakan Display_Name pengguna yang sedang mengetik dalam notifikasi UserTyping
4. THE Ngariung_System SHALL menampilkan indikator "sedang mengetik" maksimal 5 detik, kemudian menghilangkannya otomatis
5. WHEN pengguna mengirim Message atau berhenti mengetik selama 3 detik, THE Ngariung_System SHALL menghentikan event StartTyping

### Requirement 14: Pemilih Emoji

**User Story:** Sebagai pengguna, saya ingin menambahkan emoji ke pesan, sehingga saya dapat mengekspresikan emosi dengan lebih baik.

#### Acceptance Criteria

1. WHEN pengguna membuka pemilih emoji, THE Ngariung_System SHALL menampilkan panel emoji dengan minimal 50 emoji umum
2. WHEN pengguna memilih emoji, THE Ngariung_System SHALL menyisipkan karakter emoji ke input pesan di posisi kursor
3. THE Ngariung_System SHALL menyimpan emoji sebagai karakter Unicode dalam body Message
4. THE Ngariung_System SHALL menampilkan emoji dengan benar pada semua browser modern (Chrome, Firefox, Safari, Edge)

### Requirement 15: Pesan Pribadi (Direct Message)

**User Story:** Sebagai pengguna, saya ingin mengirim pesan pribadi ke pengguna lain, sehingga saya dapat berdiskusi secara privat.

#### Acceptance Criteria

1. WHEN pengguna terautentikasi memulai Direct_Message dengan User lain, THE Room_Service SHALL membuat atau membuka Room dengan Room_Type "Direct" dan 2 anggota
2. THE Room_Service SHALL memastikan hanya satu Room tipe Direct antara dua User yang sama
3. IF Room Direct sudah ada antara dua User, THEN THE Room_Service SHALL mengembalikan Room yang sudah ada
4. WHEN pengguna mengirim Message ke Room Direct, THE Message_Store SHALL menyimpan Message dengan visibilitas hanya untuk dua peserta
5. THE Room_Service SHALL memastikan Room Direct tidak dapat ditambahkan anggota ketiga
6. WHEN pengguna membuka daftar Direct_Message, THE Room_Service SHALL menampilkan semua Room Direct dengan nama Display_Name lawan bicara

### Requirement 16: Status Kehadiran Online/Offline

**User Story:** Sebagai pengguna, saya ingin melihat status online/offline pengguna lain, sehingga saya tahu kapan mereka tersedia untuk chat.

#### Acceptance Criteria

1. WHEN pengguna terhubung ke SignalR_Hub, THE Presence_Service SHALL mengubah User_Status pengguna menjadi Online
2. WHEN koneksi SignalR pengguna terputus, THE Presence_Service SHALL mengubah User_Status pengguna menjadi Offline dalam waktu maksimal 30 detik
3. WHEN User_Status berubah, THE SignalR_Hub SHALL mengirim notifikasi PresenceChanged ke semua Room yang diikuti pengguna tersebut
4. THE Presence_Service SHALL memeriksa heartbeat koneksi setiap 30 detik untuk deteksi koneksi terputus
5. IF pengguna memiliki multiple koneksi (multiple tab), THEN THE Presence_Service SHALL menandai User_Status Offline hanya ketika semua koneksi terputus

### Requirement 17: Auto-Reconnect dan Recovery Pesan

**User Story:** Sebagai pengguna, saya ingin koneksi otomatis terhubung kembali jika terputus, sehingga saya tidak kehilangan pesan.

#### Acceptance Criteria

1. WHEN koneksi SignalR terputus, THE SignalR_Hub SHALL mencoba reconnect otomatis dengan exponential backoff (1s, 2s, 4s, 8s, 16s, maksimal 30s)
2. WHEN reconnect berhasil, THE SignalR_Hub SHALL mengubah Connection_State kembali ke Connected
3. WHEN reconnect berhasil, THE Message_Store SHALL memuat semua Message yang CreatedAt lebih baru dari LastReadAt pengguna di semua Room yang diikuti
4. THE Ngariung_System SHALL menampilkan indikator "Menghubungkan kembali..." WHILE Connection_State adalah Reconnecting
5. IF reconnect gagal setelah 5 percobaan, THEN THE Ngariung_System SHALL menampilkan pesan error "Koneksi terputus. Silakan refresh halaman."

### Requirement 18: Validasi Input dan Keamanan

**User Story:** Sebagai administrator sistem, saya ingin semua input pengguna divalidasi dan disanitasi, sehingga aplikasi aman dari serangan.

#### Acceptance Criteria

1. THE Ngariung_System SHALL melakukan HTML escape pada semua input teks pengguna (Display_Name, Room name, Message body, Room description) untuk mencegah XSS
2. THE Authentication_Service SHALL menyimpan password dengan hashing menggunakan bcrypt dengan work factor minimal 12 atau Argon2
3. THE SignalR_Hub SHALL memverifikasi JWT token pada setiap method call untuk memastikan User terautentikasi
4. THE Room_Service SHALL memverifikasi keanggotaan User di Room sebelum mengizinkan operasi (kirim Message, lihat riwayat, dll)
5. THE Ngariung_System SHALL menerapkan CORS policy yang hanya mengizinkan origin yang dikonfigurasi
6. WHERE aplikasi berjalan di production, THE Ngariung_System SHALL memaksa penggunaan HTTPS untuk semua endpoint

### Requirement 19: Rate Limiting

**User Story:** Sebagai administrator sistem, saya ingin mencegah spam dan abuse, sehingga kualitas layanan tetap terjaga untuk semua pengguna.

#### Acceptance Criteria

1. THE SignalR_Hub SHALL membatasi maksimal 10 pesan per User per menit untuk mencegah spam
2. THE Authentication_Service SHALL membatasi maksimal 5 percobaan login per IP address per 15 menit
3. THE Room_Service SHALL membatasi maksimal 5 Room baru per User per jam
4. IF User melebihi Rate_Limit, THEN THE Ngariung_System SHALL menolak request dengan HTTP status 429 dan pesan error yang menjelaskan waktu tunggu
5. THE Ngariung_System SHALL menyimpan counter rate limit di in-memory cache (Redis atau MemoryCache)

### Requirement 20: Performa Pengiriman Pesan

**User Story:** Sebagai pengguna, saya ingin pesan terkirim dengan cepat, sehingga percakapan terasa real-time dan responsif.

#### Acceptance Criteria

1. WHEN pengguna mengirim Message dengan 100 koneksi aktif, THE SignalR_Hub SHALL mengirim ReceiveMessage ke semua anggota Room dalam waktu maksimal 300ms pada persentil 95 (p95)
2. WHEN pengguna meminta riwayat 50 Message, THE Message_Store SHALL mengembalikan hasil dalam waktu maksimal 200ms pada persentil 95 (p95)
3. WHEN pengguna membuka daftar Room, THE Room_Service SHALL mengembalikan hasil dalam waktu maksimal 150ms pada persentil 95 (p95)
4. THE Ngariung_System SHALL mendukung minimal 100 koneksi WebSocket simultan tanpa degradasi performa di atas metrik yang ditentukan

### Requirement 21: Antarmuka Responsif

**User Story:** Sebagai pengguna mobile dan desktop, saya ingin antarmuka aplikasi beradaptasi dengan ukuran layar saya, sehingga saya dapat chat dengan nyaman di perangkat apapun.

#### Acceptance Criteria

1. THE Ngariung_System SHALL menampilkan antarmuka yang dapat digunakan pada lebar layar 360px hingga 2560px
2. WHERE lebar layar kurang dari 768px, THE Ngariung_System SHALL menyembunyikan sidebar dan menampilkan menu hamburger
3. WHERE lebar layar 768px atau lebih, THE Ngariung_System SHALL menampilkan sidebar daftar Room di sebelah kiri area chat
4. THE Ngariung_System SHALL menggunakan font size minimal 16px untuk input text untuk mencegah auto-zoom di iOS Safari
5. THE Ngariung_System SHALL memastikan area klik/tap tombol minimal 44x44px untuk kemudahan penggunaan di mobile

### Requirement 22: Aksesibilitas

**User Story:** Sebagai pengguna dengan kebutuhan aksesibilitas, saya ingin dapat menavigasi aplikasi dengan keyboard dan screen reader, sehingga saya dapat menggunakan aplikasi dengan nyaman.

#### Acceptance Criteria

1. THE Ngariung_System SHALL memungkinkan navigasi lengkap menggunakan keyboard (Tab, Enter, Escape, Arrow keys)
2. THE Ngariung_System SHALL menyediakan label ARIA untuk semua elemen interaktif (tombol, input, link)
3. THE Ngariung_System SHALL memiliki contrast ratio minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar (WCAG AA)
4. WHEN Message baru diterima, THE Ngariung_System SHALL mengumumkan notifikasi ke screen reader dengan aria-live region
5. THE Ngariung_System SHALL menampilkan focus indicator yang jelas (outline) pada semua elemen interaktif saat navigasi keyboard

### Requirement 23: Deployment dengan Docker

**User Story:** Sebagai developer, saya ingin deploy aplikasi dengan satu perintah, sehingga proses deployment sederhana dan reproducible.

#### Acceptance Criteria

1. THE Ngariung_System SHALL menyediakan Dockerfile yang membuild aplikasi ASP.NET Core
2. THE Ngariung_System SHALL menyediakan docker-compose.yml yang menjalankan aplikasi dan PostgreSQL database
3. WHEN developer menjalankan "docker-compose up", THE Ngariung_System SHALL memulai semua service dan siap menerima koneksi dalam waktu maksimal 60 detik
4. THE Ngariung_System SHALL menerapkan database migration otomatis saat container startup menggunakan EF Core
5. THE Ngariung_System SHALL membaca konfigurasi (connection string, JWT secret, CORS origin) dari environment variables

### Requirement 24: Logging dan Monitoring

**User Story:** Sebagai administrator sistem, saya ingin log error dan aktivitas penting tercatat, sehingga saya dapat troubleshoot masalah dengan mudah.

#### Acceptance Criteria

1. WHEN error terjadi, THE Ngariung_System SHALL mencatat error ke log dengan level Error, timestamp, stack trace, dan context (UserId, RoomId jika ada)
2. WHEN pengguna login berhasil, THE Authentication_Service SHALL mencatat event ke log dengan level Information dan UserId
3. WHEN pengguna membuat Room baru, THE Room_Service SHALL mencatat event ke log dengan level Information, UserId, dan RoomId
4. THE Ngariung_System SHALL menggunakan structured logging (JSON format) untuk memudahkan parsing dan analisis
5. WHERE aplikasi berjalan di development, THE Ngariung_System SHALL menampilkan log di console dengan level Debug
6. WHERE aplikasi berjalan di production, THE Ngariung_System SHALL mencatat log ke file atau external service dengan level Information atau lebih tinggi

