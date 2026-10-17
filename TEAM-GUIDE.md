# 👥 Panduan Tim - Ngariung Project

## 📊 Pembagian Tugas (4 Orang)

### 👤 Anggota 1: Ferdinand (Frontend) ✅ SELESAI
**Status:** Frontend 100% Complete
- ✅ HTML (auth.html, index.html)
- ✅ CSS (styles, themes, modals)
- ✅ JavaScript (14 modules)
- ✅ Git repository setup
- ✅ Documentation

---

### 👤 Anggota 2: Backend - Authentication & User Management

**Tugas:**
1. Setup project ASP.NET Core
2. Authentication (Register, Login, JWT)
3. User management
4. Rate limiting

**Estimasi:** 6-8 jam

**File yang perlu dibuat:**
- `Program.cs` - Main application setup
- `Models/User.cs` - User entity
- `Services/AuthService.cs` - Authentication logic
- `Services/JwtService.cs` - JWT token generation
- `Endpoints/AuthEndpoints.cs` - Auth API endpoints
- `Data/ApplicationDbContext.cs` - Database context

**Prompt untuk Kiro AI:**
```
Halo! Saya anggota tim yang bertanggung jawab untuk backend authentication.

Repository: https://github.com/ferdinandwahyudha800-ui/NGAURIUNG-REAL-TIME

Tolong bantu saya:
1. Setup ASP.NET Core project dari awal
2. Implement authentication system (Register & Login)
3. JWT token generation & validation
4. User management
5. Rate limiting untuk login attempts

Spec lengkap ada di folder .kiro/specs/ngariung/
Frontend sudah selesai di folder wwwroot/

Saya perlu code yang:
- Mengikuti spec design.md
- Compatible dengan frontend yang sudah ada
- Include database migrations
- Ada error handling yang baik
```

**Checklist:**
- [ ] Install .NET SDK 8.0
- [ ] Clone repository
- [ ] Buat project ASP.NET Core
- [ ] Setup database (SQLite untuk dev)
- [ ] Implement User model
- [ ] Implement AuthService
- [ ] Implement JWT generation
- [ ] Create auth endpoints (POST /api/auth/register, POST /api/auth/login)
- [ ] Test dengan Postman
- [ ] Commit & push ke branch `feature/auth`

---

### 👤 Anggota 3: Backend - Rooms & SignalR

**Tugas:**
1. Room management (create, list, join, leave)
2. SignalR Hub setup
3. Real-time messaging
4. Typing indicators

**Estimasi:** 8-10 jam

**File yang perlu dibuat:**
- `Models/Room.cs` - Room entity
- `Models/RoomMember.cs` - Room member entity
- `Services/RoomService.cs` - Room logic
- `Hubs/ChatHub.cs` - SignalR hub
- `Endpoints/RoomEndpoints.cs` - Room API endpoints

**Prompt untuk Kiro AI:**
```
Halo! Saya anggota tim yang bertanggung jawab untuk rooms dan real-time messaging.

Repository: https://github.com/ferdinandwahyudha800-ui/NGAURIUNG-REAL-TIME

Context:
- Authentication sudah selesai dibuat oleh teman saya
- Frontend sudah ada di wwwroot/
- Spec ada di .kiro/specs/ngariung/

Tolong bantu saya:
1. Implement Room management (create, list, join, leave)
2. Setup SignalR Hub
3. Implement real-time messaging
4. Implement typing indicators
5. Handle user presence (online/offline)

Yang sudah ada:
- User model & authentication
- JWT middleware
- Database context

Yang perlu saya buat:
- Room & RoomMember models
- RoomService
- ChatHub (SignalR)
- Room API endpoints
```

**Checklist:**
- [ ] Pull latest code dari branch `feature/auth`
- [ ] Buat Room & RoomMember models
- [ ] Implement RoomService
- [ ] Setup SignalR di Program.cs
- [ ] Buat ChatHub (JoinRoom, SendMessage, StartTyping)
- [ ] Create room endpoints (GET /api/rooms, POST /api/rooms, etc)
- [ ] Test SignalR connection
- [ ] Test dengan frontend
- [ ] Commit & push ke branch `feature/rooms`

---

### 👤 Anggota 4: Backend - Messages & Integration

**Tugas:**
1. Message storage & retrieval
2. Message history dengan pagination
3. Direct messaging
4. Integration testing
5. Documentation

**Estimasi:** 6-8 jam

**File yang perlu dibuat:**
- `Models/Message.cs` - Message entity
- `Services/MessageStore.cs` - Message storage
- `Endpoints/MessageEndpoints.cs` - Message API
- `Services/PresenceService.cs` - User presence tracking

**Prompt untuk Kiro AI:**
```
Halo! Saya anggota tim yang bertanggung jawab untuk message storage dan final integration.

Repository: https://github.com/ferdinandwahyudha800-ui/NGAURIUNG-REAL-TIME

Context:
- Authentication sudah ada (Anggota 2)
- Rooms & SignalR sudah ada (Anggota 3)
- Frontend sudah ada di wwwroot/
- Spec ada di .kiro/specs/ngariung/

Tolong bantu saya:
1. Implement Message model & storage
2. Message history dengan pagination
3. Direct messaging (DM)
4. Mark messages as read
5. User presence service
6. Integration testing semua fitur
7. Update documentation

Yang perlu saya pastikan:
- Semua API endpoints sesuai dengan yang dipanggil frontend
- SignalR events match dengan yang di-handle frontend
- Database relationships correct
- Error handling complete
```

**Checklist:**
- [ ] Pull latest dari branch `feature/rooms`
- [ ] Buat Message model
- [ ] Implement MessageStore service
- [ ] Implement PresenceService
- [ ] Create message endpoints
- [ ] Implement DM functionality
- [ ] Test full integration dengan frontend
- [ ] Update API documentation
- [ ] Commit & push ke branch `feature/messages`
- [ ] Create Pull Request ke `main`

---

## 🔄 Workflow Tim

### Step 1: Setup Awal (Semua Anggota)
```bash
# Clone repository
git clone https://github.com/ferdinandwahyudha800-ui/NGAURIUNG-REAL-TIME.git
cd NGAURIUNG-REAL-TIME

# Install .NET SDK 8.0
# Download: https://dotnet.microsoft.com/download/dotnet/8.0

# Verify installation
dotnet --version
```

### Step 2: Kerja di Branch Masing-Masing

**Anggota 2 (Auth):**
```bash
git checkout -b feature/auth
# ... kerja di branch ini ...
git add .
git commit -m "feat: implement authentication"
git push origin feature/auth
```

**Anggota 3 (Rooms):**
```bash
# Tunggu Anggota 2 selesai, lalu:
git checkout feature/auth
git pull origin feature/auth
git checkout -b feature/rooms
# ... kerja di branch ini ...
git add .
git commit -m "feat: implement rooms and signalr"
git push origin feature/rooms
```

**Anggota 4 (Messages):**
```bash
# Tunggu Anggota 3 selesai, lalu:
git checkout feature/rooms
git pull origin feature/rooms
git checkout -b feature/messages
# ... kerja di branch ini ...
git add .
git commit -m "feat: implement messages and integration"
git push origin feature/messages
```

### Step 3: Merge ke Main
Setelah semua selesai dan di-test:
```bash
# Di GitHub, buat Pull Request:
# feature/messages -> main

# Review bersama-sama
# Approve & Merge
```

---

## 📁 Struktur Project Backend (Target)

```
Ngariung.Api/
├── Program.cs                  # Main application (Anggota 2 start)
├── appsettings.json           # Configuration
├── Models/
│   ├── User.cs                # Anggota 2
│   ├── Room.cs                # Anggota 3
│   ├── RoomMember.cs          # Anggota 3
│   └── Message.cs             # Anggota 4
├── Services/
│   ├── AuthService.cs         # Anggota 2
│   ├── JwtService.cs          # Anggota 2
│   ├── RoomService.cs         # Anggota 3
│   ├── MessageStore.cs        # Anggota 4
│   └── PresenceService.cs     # Anggota 4
├── Hubs/
│   └── ChatHub.cs             # Anggota 3
├── Endpoints/
│   ├── AuthEndpoints.cs       # Anggota 2
│   ├── RoomEndpoints.cs       # Anggota 3
│   └── MessageEndpoints.cs    # Anggota 4
├── Data/
│   ├── ApplicationDbContext.cs # Anggota 2
│   └── Migrations/            # Auto-generated
└── wwwroot/                   # Frontend (sudah ada) ✅
```

---

## 🧪 Testing Strategy

### Anggota 2 Testing:
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","displayName":"Test User"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Anggota 3 Testing:
```bash
# Test create room (dengan token dari login)
curl -X POST http://localhost:5000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"test-room","description":"Test","type":"Public"}'

# Test SignalR connection
# Gunakan browser console dengan frontend
```

### Anggota 4 Testing:
```bash
# Test get messages
curl http://localhost:5000/api/rooms/ROOM_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN"

# Full integration test dengan frontend
# Buka auth.html di browser, register, login, chat
```

---

## 📚 Resources untuk Tim

### Documentation
- Spec: `.kiro/specs/ngariung/`
  - `requirements.md` - Semua requirements
  - `design.md` - **WAJIB BACA** - API contracts, database schema
  - `tasks.md` - Task breakdown
- Frontend code: `wwwroot/js/` - Lihat API calls di sini

### Useful Links
- ASP.NET Core Tutorial: https://learn.microsoft.com/aspnet/core/
- SignalR Tutorial: https://learn.microsoft.com/aspnet/core/signalr/
- EF Core: https://learn.microsoft.com/ef/core/
- JWT Authentication: https://jwt.io/

### Tools
- Postman: https://www.postman.com/ (untuk test API)
- DB Browser for SQLite: https://sqlitebrowser.org/ (untuk lihat database)

---

## 🤝 Communication

### Daily Standup (Virtual)
Setiap hari sharing progress:
- Apa yang sudah dikerjakan kemarin
- Apa yang akan dikerjakan hari ini
- Ada blocker/masalah?

### Group Chat
Buat grup WhatsApp/Telegram untuk:
- Quick questions
- Code review requests
- Progress updates

### Code Review
Sebelum merge ke main:
- Minimal 1 orang review code
- Test di local dulu
- Pastikan tidak ada conflict

---

## 🐛 Troubleshooting

### Problem: "dotnet command not found"
**Solution:** Install .NET SDK 8.0 dari official website

### Problem: Port 5000 already in use
**Solution:** 
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Atau ubah port di Program.cs
```

### Problem: Database migration error
**Solution:**
```bash
dotnet ef database drop
dotnet ef migrations add Initial
dotnet ef database update
```

### Problem: CORS error di frontend
**Solution:** Pastikan CORS sudah di-setup di `Program.cs`:
```csharp
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

---

## ✅ Definition of Done

Setiap anggota harus memastikan:
- [ ] Code mengikuti spec di `design.md`
- [ ] No compiler errors
- [ ] API endpoints tested dengan Postman
- [ ] Code commented (untuk bagian complex)
- [ ] Git commit dengan message yang jelas
- [ ] Branch di-push ke GitHub
- [ ] Update TEAM-GUIDE.md jika ada perubahan

---

## 🎯 Timeline Target

| Anggota | Tugas | Estimasi | Deadline |
|---------|-------|----------|----------|
| Anggota 2 | Authentication | 6-8 jam | Hari 1-2 |
| Anggota 3 | Rooms & SignalR | 8-10 jam | Hari 3-4 |
| Anggota 4 | Messages & Integration | 6-8 jam | Hari 5-6 |
| **Total** | **Backend Complete** | **20-26 jam** | **6 hari** |

---

## 🚀 Quick Start untuk Setiap Anggota

### Anggota 2: Mulai dari Sini
```bash
# 1. Clone repo
git clone https://github.com/ferdinandwahyudha800-ui/NGAURIUNG-REAL-TIME.git

# 2. Buat project baru
dotnet new web -n Ngariung.Api
cd Ngariung.Api

# 3. Install packages
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next

# 4. Copy wwwroot dari repo ke project ini
# 5. Mulai coding berdasarkan prompt di atas
# 6. Tanya Kiro AI jika stuck!
```

---

**Good luck team! 🚀**

Jika ada pertanyaan, buka issue di GitHub atau diskusi di grup!
