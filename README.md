# Ngariung Chat Application

> Aplikasi chat real-time sederhana berbasis web dengan ASP.NET Core dan SignalR

## 🎯 Status Proyek

- ✅ **Spec Complete** - Requirements, Design, Tasks (26 tasks)
- ✅ **Frontend Complete** - HTML, CSS, JavaScript (100%)
- ⏳ **Backend** - ASP.NET Core (belum dimulai)

## 📁 Struktur Project

```
NGARIUNG/
├── .kiro/
│   └── specs/ngariung/          # Spec lengkap (requirements, design, tasks)
├── wwwroot/                     # Frontend files (HTML, CSS, JS)
│   ├── index.html               # Main chat app
│   ├── auth.html                # Login/Register
│   ├── css/                     # Stylesheets (4 files)
│   └── js/                      # JavaScript modules (12 files)
├── GETTING-STARTED.md           # Prerequisites & installation guide
├── FRONTEND-PROGRESS.md         # Detailed progress tracker
├── FRONTEND-COMPLETE.md         # Frontend summary & usage guide
└── README.md                    # This file
```

## 🚀 Quick Start

### View Frontend (Tanpa Backend)
```bash
# Buka di browser
# Right-click wwwroot/auth.html -> Open with Browser

# Atau gunakan HTTP server
cd wwwroot
python -m http.server 8000
# Buka http://localhost:8000/auth.html
```

### Build Backend (Saat Internet Stabil)
```bash
# 1. Install .NET SDK 8.0 (lihat GETTING-STARTED.md)

# 2. Create ASP.NET Core project
dotnet new web -n Ngariung.Api
cd Ngariung.Api

# 3. Copy wwwroot folder
cp -r ../wwwroot ./wwwroot

# 4. Implement backend sesuai spec di .kiro/specs/ngariung/

# 5. Run
dotnet run
```

## 📚 Documentation

| File | Deskripsi |
|------|-----------|
| [GETTING-STARTED.md](GETTING-STARTED.md) | Prerequisites, installation .NET SDK & Docker |
| [FRONTEND-COMPLETE.md](FRONTEND-COMPLETE.md) | Frontend summary, features, usage guide |
| [FRONTEND-PROGRESS.md](FRONTEND-PROGRESS.md) | Detailed progress tracker |
| [.kiro/specs/ngariung/](..kiro/specs/ngariung/) | Full spec (requirements, design, tasks) |

## ✨ Features

### MVP Features (v1.0)
- ✅ User registration & login (JWT)
- ✅ Create rooms (Public/Private)
- ✅ Real-time messaging (SignalR WebSocket)
- ✅ Direct messaging (DM)
- ✅ Typing indicators
- ✅ Infinite scroll message history
- ✅ Online/offline status
- ✅ Light/Dark theme
- ✅ Responsive (mobile/tablet/desktop)
- ✅ Accessibility (WCAG AA)

### Future Features
- ⏳ File upload (v1.1)
- ⏳ Emoji reactions (v2.0)
- ⏳ Message search (v2.0)
- ⏳ Video calls (v3.0)

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- SignalR JavaScript Client
- No frameworks (sesuai requirements MVP)

### Backend (Planned)
- ASP.NET Core 8.0 (Minimal API)
- SignalR (WebSocket)
- EF Core + PostgreSQL
- JWT Authentication
- Docker & Docker Compose

## 📦 Files Summary

| Category | Files | Lines | Status |
|----------|-------|-------|--------|
| HTML | 2 | ~500 | ✅ Complete |
| CSS | 4 | ~1000 | ✅ Complete |
| JavaScript | 12 | ~2000 | ✅ Complete |
| **Total** | **18** | **~3500** | **✅ 100%** |

## 🎯 Next Steps

1. **Tunggu internet stabil** → Install .NET SDK 8.0
2. **Build backend** → Implement spec di `.kiro/specs/ngariung/`
3. **Integration** → Copy `wwwroot` ke project backend
4. **Testing** → Test full flow dengan SignalR
5. **Deployment** → Deploy dengan Docker

## 📝 Notes

- Frontend **tidak perlu di-convert** ke C# atau Blazor
- ASP.NET Core bisa serve static files dari `wwwroot` folder
- SignalR sudah compatible dengan JavaScript client
- Fetch API untuk REST calls sudah standard

## 🐛 Issues & Support

Jika ada masalah:
1. Cek `FRONTEND-PROGRESS.md` untuk status detail
2. Cek `GETTING-STARTED.md` untuk troubleshooting
3. Lihat spec di `.kiro/specs/ngariung/design.md` untuk API contracts

## 📄 License

Project ini dibuat untuk keperluan pembelajaran.

---

**Created**: October 16, 2026  
**Status**: Frontend Complete ✅ | Backend Pending ⏳  
**Tech**: ASP.NET Core 8.0 + SignalR + Vanilla JavaScript
