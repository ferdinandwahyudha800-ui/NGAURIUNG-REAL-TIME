# 🚀 Quick Start - Teman Tim

## 📋 Info Project

**Repository:** https://github.com/ferdinandwahyudha800-ui/NGAURIUNG-REAL-TIME

**Apa itu Ngariung?**
Aplikasi chat real-time seperti Slack/Discord sederhana.

**Status:**
- ✅ Frontend 100% complete (Ferdinand)
- ⏳ Backend perlu dikerjakan (3 orang)

---

## 👥 Siapa Ngerjain Apa?

### Kamu dapat tugas: **AUTHENTICATION** (Anggota 2)
**Buka:** `BACKEND-STARTER-GUIDE.md` bagian "Untuk Anggota 2"

**Summary:**
- Setup project ASP.NET Core
- Buat register & login API
- JWT authentication
- Database setup

**Estimasi:** 6-8 jam

---

### Kamu dapat tugas: **ROOMS & SIGNALR** (Anggota 3)
**Buka:** `BACKEND-STARTER-GUIDE.md` bagian "Untuk Anggota 3"

**Summary:**
- Room management (create, list, join)
- SignalR untuk real-time
- Typing indicators

**Estimasi:** 8-10 jam

**⚠️ Tunggu Anggota 2 selesai dulu!**

---

### Kamu dapat tugas: **MESSAGES & INTEGRATION** (Anggota 4)
**Buka:** `BACKEND-STARTER-GUIDE.md` bagian "Untuk Anggota 4"

**Summary:**
- Message storage
- Message history
- Direct messaging
- Final testing

**Estimasi:** 6-8 jam

**⚠️ Tunggu Anggota 3 selesai dulu!**

---

## 🎯 Step-by-Step (Untuk Semua)

### 1. Clone Repository
```bash
git clone https://github.com/ferdinandwahyudha800-ui/NGAURIUNG-REAL-TIME.git
cd NGAURIUNG-REAL-TIME
```

### 2. Install .NET SDK 8.0
Download dari: https://dotnet.microsoft.com/download/dotnet/8.0

Test:
```bash
dotnet --version
# Harus keluar: 8.0.x
```

### 3. Baca File Ini (PENTING!)
1. **TEAM-GUIDE.md** - Pembagian tugas & workflow
2. **BACKEND-STARTER-GUIDE.md** - Panduan detail per anggota
3. **.kiro/specs/ngariung/design.md** - **WAJIB BACA** - Semua API spec ada di sini

### 4. Cari Bagian Kamu
Di **BACKEND-STARTER-GUIDE.md**, cari:
- "Untuk Anggota 2" (jika kamu dapat tugas Authentication)
- "Untuk Anggota 3" (jika kamu dapat tugas Rooms)
- "Untuk Anggota 4" (jika kamu dapat tugas Messages)

### 5. Copy Prompt, Kirim ke Kiro AI
Di setiap bagian ada **prompt lengkap** yang bisa kamu copy-paste ke Kiro AI.

Kiro akan generate semua code yang kamu butuhkan!

### 6. Test & Push
```bash
# Test di local
dotnet run

# Push ke GitHub
git add .
git commit -m "feat: implement [bagian kamu]"
git push origin [branch-kamu]
```

---

## 🆘 Kalau Bingung

1. **Baca spec:** `.kiro/specs/ngariung/design.md`
2. **Lihat frontend code:** `wwwroot/js/` - Lihat API apa yang dipanggil
3. **Tanya Kiro AI:** Copy error message lengkap + context
4. **Tanya teman:** Diskusi di grup
5. **Buka issue:** Di GitHub jika problem persist

---

## 📞 Contact

**Ferdinand (Frontend Lead):**
- Repository Owner
- Bisa ditanya tentang frontend & integration

**Grup Tim:**
- [Link WhatsApp/Telegram grup]

---

## ✅ Checklist Before Push

- [ ] Code compile tanpa error
- [ ] API tested dengan Postman
- [ ] Sesuai dengan spec di design.md
- [ ] Commit message jelas
- [ ] Push ke branch yang benar

---

## 🎓 Resources

**Must Read:**
- `.kiro/specs/ngariung/design.md` ← **PALING PENTING**
- `BACKEND-STARTER-GUIDE.md` ← Step by step
- `TEAM-GUIDE.md` ← Big picture

**Tutorials:**
- ASP.NET Core: https://learn.microsoft.com/aspnet/core/
- SignalR: https://learn.microsoft.com/aspnet/core/signalr/

**Tools:**
- Postman (test API): https://www.postman.com/
- DB Browser (lihat database): https://sqlitebrowser.org/

---

**INGAT:** Frontend sudah 100% selesai. Kamu hanya perlu buat backend yang match dengan API calls di frontend! 

Semua API endpoint yang perlu dibuat sudah didokumentasikan di `design.md`

**Good luck! 🚀**
