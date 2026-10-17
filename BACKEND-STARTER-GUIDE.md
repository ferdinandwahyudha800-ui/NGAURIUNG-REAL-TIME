# 🚀 Backend Starter Guide - Untuk Teman Tim

## 📝 Cara Pakai Panduan Ini

Jika kamu dapat tugas backend, baca file ini dulu!

---

## 🎯 Untuk Anggota 2: Authentication (Mulai dari sini!)

### Langkah 1: Persiapan
```bash
# 1. Install .NET SDK 8.0
# Download dari: https://dotnet.microsoft.com/download/dotnet/8.0
# Setelah install, verify:
dotnet --version
# Harus keluar: 8.0.x

# 2. Clone repository
git clone https://github.com/ferdinandwahyudha800-ui/NGAURIUNG-REAL-TIME.git
cd NGAURIUNG-REAL-TIME

# 3. Buat branch baru
git checkout -b feature/auth
```

### Langkah 2: Setup Project
```bash
# Di folder NGAURIUNG-REAL-TIME, buat project:
dotnet new web -n Ngariung.Api
cd Ngariung.Api

# Install packages yang dibutuhkan
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package System.IdentityModel.Tokens.Jwt

# Copy folder wwwroot dari parent ke project ini
# Di Windows:
xcopy /E /I ..\wwwroot wwwroot
```

### Langkah 3: Copy Prompt Ini ke Kiro AI

**COPY TEKS INI DAN KIRIM KE KIRO AI:**

```
Halo Kiro! Saya anggota tim Ngariung yang bertanggung jawab untuk backend authentication.

CONTEXT:
- Repository: https://github.com/ferdinandwahyudha800-ui/NGAURIUNG-REAL-TIME
- Frontend sudah 100% selesai di folder wwwroot/
- Spec lengkap ada di .kiro/specs/ngariung/design.md
- Saya sudah setup ASP.NET Core project di folder Ngariung.Api/
- Packages sudah terinstall: EF Core, JWT Bearer, BCrypt

TUGAS SAYA:
1. Setup ApplicationDbContext dengan User model
2. Implement AuthService untuk register & login
3. Implement JwtService untuk generate token
4. Create auth endpoints (POST /api/auth/register, POST /api/auth/login)
5. Setup JWT authentication middleware
6. Auto-join user ke room "umum" saat register

YANG PERLU DIBUAT:
File: Models/User.cs
- Id: Guid
- Email: string (unique)
- DisplayName: string
- PasswordHash: string
- Status: enum (Online, Busy, Away, Offline)
- CreatedAt: DateTime

File: Data/ApplicationDbContext.cs
- DbSet<User> Users
- Configure unique constraint untuk Email
- Seed data room "umum"

File: Services/AuthService.cs
- Task<AuthResult> RegisterAsync(email, password, displayName)
  * Check email sudah ada atau belum
  * Hash password dengan BCrypt
  * Create user
  * Auto-join ke room "umum"
  * Generate JWT token
  * Return token & userId
- Task<AuthResult> LoginAsync(email, password)
  * Find user by email
  * Verify password dengan BCrypt
  * Generate JWT token
  * Update status ke Online
  * Return token & userId

File: Services/JwtService.cs
- string GenerateToken(userId, email, displayName)
  * Claims: userId, email, displayName
  * Expiry: 7 days
  * Secret dari appsettings.json

File: Program.cs
- Setup DbContext (SQLite)
- Setup Authentication & JWT
- Setup CORS untuk frontend
- Register services (AuthService, JwtService)
- Map auth endpoints
- UseStaticFiles untuk wwwroot
- UseAuthentication & UseAuthorization

PENTING:
- Response format harus match dengan yang frontend expect:
  * Register & Login response: { token, userId, displayName }
  * Error response: { error: "message" }
- JWT secret di appsettings.json: "JwtSettings:SecretKey"
- Connection string: "Data Source=ngariung.db"
- Room "umum" harus ada saat database pertama kali dibuat

Tolong generate semua file yang saya butuhkan dengan code lengkap!
```

### Langkah 4: Jalankan Code dari Kiro
1. Copy semua file yang Kiro generate
2. Paste ke project kamu
3. Run migration:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```
4. Run project:
```bash
dotnet run
```

### Langkah 5: Test API
```bash
# Test Register
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"test123\",\"displayName\":\"Test User\"}"

# Harus return: { "token": "...", "userId": "...", "displayName": "Test User" }

# Test Login
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"test123\"}"
```

### Langkah 6: Commit & Push
```bash
git add .
git commit -m "feat: implement authentication with JWT"
git push origin feature/auth
```

**SELESAI! Kasih tahu Anggota 3 bahwa auth sudah siap!**

---

## 🎯 Untuk Anggota 3: Rooms & SignalR

### Langkah 1: Persiapan
```bash
# 1. Pull code dari Anggota 2
git fetch origin
git checkout feature/auth
git pull origin feature/auth

# 2. Buat branch baru
git checkout -b feature/rooms
```

### Langkah 2: Install Packages Tambahan
```bash
cd Ngariung.Api
dotnet add package Microsoft.AspNetCore.SignalR
```

### Langkah 3: Copy Prompt Ini ke Kiro AI

**COPY TEKS INI:**

```
Halo Kiro! Saya anggota tim yang bertanggung jawab untuk Rooms dan SignalR.

CONTEXT:
- Authentication sudah selesai dibuat oleh tim (User model, AuthService, JWT)
- Frontend sudah ada di wwwroot/
- Spec di .kiro/specs/ngariung/design.md
- Database sudah ada dengan User table

TUGAS SAYA:
1. Buat Room & RoomMember models
2. Update DbContext dengan Room & RoomMember
3. Implement RoomService
4. Setup SignalR Hub (ChatHub)
5. Create room endpoints
6. Implement real-time messaging

YANG PERLU DIBUAT:

File: Models/Room.cs
- Id: Guid
- Name: string (unique)
- Description: string (nullable)
- Type: enum (Public, Private, Direct)
- OwnerId: Guid
- CreatedAt: DateTime
- Navigation: Owner (User), Members (RoomMember list)

File: Models/RoomMember.cs
- RoomId: Guid (PK)
- UserId: Guid (PK)
- Role: enum (Owner, Member)
- JoinedAt: DateTime
- LastReadAt: DateTime (nullable)
- Navigation: Room, User

File: Services/RoomService.cs
- Task<Room> CreateRoomAsync(userId, name, description, type)
- Task<List<RoomSummary>> GetUserRoomsAsync(userId)
- Task JoinRoomAsync(userId, roomId, role)
- Task LeaveRoomAsync(userId, roomId)
- Task<Room> GetOrCreateDirectRoomAsync(userId1, userId2)
- Task<RoomDetail> GetRoomDetailAsync(userId, roomId)
- Task<bool> IsMemberAsync(userId, roomId)

File: Hubs/ChatHub.cs
- Require [Authorize]
- OnConnectedAsync() - track connection
- OnDisconnectedAsync() - cleanup connection
- Task JoinRoom(Guid roomId)
  * Check user adalah member
  * Add ke SignalR group
  * Broadcast UserJoined
- Task SendMessage(Guid roomId, string text)
  * Validate member & rate limit
  * Save message ke database
  * Broadcast ReceiveMessage ke group
- Task StartTyping(Guid roomId)
  * Broadcast UserTyping ke group (kecuali sender)
- Task MarkRead(Guid roomId)
  * Update LastReadAt

File: Endpoints/RoomEndpoints.cs (Minimal API)
- GET /api/rooms - Get user rooms
- POST /api/rooms - Create room
- GET /api/rooms/{id} - Get room detail
- DELETE /api/rooms/{id}/members/me - Leave room
- POST /api/dm/{userId} - Start DM

File: Program.cs updates
- AddSignalR()
- MapHub<ChatHub>("/chatHub")
- Update DbContext dengan Room & RoomMember

PENTING:
- SignalR events harus match dengan frontend:
  * Server -> Client: ReceiveMessage, UserTyping, UserJoined, UserLeft
  * Client -> Server: JoinRoom, SendMessage, StartTyping, MarkRead
- RoomSummary response: { id, name, description, type, memberCount, unreadCount, lastMessageAt }
- RoomDetail response: { id, name, description, type, ownerId, createdAt, members: [] }

Tolong generate semua file lengkap!
```

### Langkah 4: Test dengan Frontend
1. Run backend: `dotnet run`
2. Buka `wwwroot/auth.html` di browser
3. Register & Login
4. Buka browser console (F12)
5. Seharusnya SignalR connect (lihat log di console)

### Langkah 5: Commit & Push
```bash
git add .
git commit -m "feat: implement rooms and signalr hub"
git push origin feature/rooms
```

**SELESAI! Kasih tahu Anggota 4!**

---

## 🎯 Untuk Anggota 4: Messages & Integration

### Langkah 1: Persiapan
```bash
git fetch origin
git checkout feature/rooms
git pull origin feature/rooms
git checkout -b feature/messages
```

### Langkah 2: Copy Prompt Ini ke Kiro AI

**COPY TEKS INI:**

```
Halo Kiro! Saya anggota tim terakhir yang bertanggung jawab untuk Messages dan final integration.

CONTEXT:
- Authentication sudah ada (User, AuthService, JWT)
- Rooms & SignalR sudah ada (Room, RoomMember, ChatHub)
- Frontend ada di wwwroot/
- Spec di .kiro/specs/ngariung/design.md

TUGAS SAYA:
1. Buat Message model
2. Implement MessageStore service
3. Implement PresenceService
4. Create message endpoints
5. Complete ChatHub integration
6. Full testing & bug fixes

YANG PERLU DIBUAT:

File: Models/Message.cs
- Id: Guid
- RoomId: Guid
- SenderId: Guid
- Body: string (HTML escaped)
- Kind: enum (Text, File)
- FileUrl: string (nullable)
- FileName: string (nullable)
- CreatedAt: DateTime
- Navigation: Room, Sender (User)

File: Services/MessageStore.cs
- Task<Message> SaveMessageAsync(roomId, senderId, body, kind)
  * Escape HTML
  * Validate body length (1-500 chars)
  * Save to database
- Task<List<MessageDto>> GetMessagesAsync(roomId, limit)
  * Get latest messages
  * Order by CreatedAt DESC
- Task<MessageHistory> GetMessageHistoryAsync(roomId, before, limit)
  * Pagination support
  * Return { messages, hasMore }

File: Services/PresenceService.cs
- In-memory tracking (Dictionary)
- Task ConnectAsync(userId, connectionId)
- Task DisconnectAsync(userId, connectionId)
- Task UpdateStatusAsync(userId, status)
- Task<Dictionary<Guid, UserStatus>> GetUserStatusesAsync(userIds)

File: Endpoints/MessageEndpoints.cs
- GET /api/rooms/{id}/messages?before=&limit=50

Update: Hubs/ChatHub.cs
- Integrate MessageStore di SendMessage
- Integrate PresenceService di OnConnected/OnDisconnected

Update: Program.cs
- Register MessageStore & PresenceService

TESTING CHECKLIST:
- [ ] Register user baru via frontend
- [ ] Auto-join ke room "umum" works
- [ ] Create room baru
- [ ] Send message real-time
- [ ] Typing indicator works
- [ ] Infinite scroll load older messages
- [ ] DM functionality
- [ ] Dark mode works

Tolong generate semua file dan test cases!
```

### Langkah 3: Full Integration Test
1. Run backend: `dotnet run`
2. Buka 2 browser berbeda (atau 1 normal + 1 incognito)
3. Register 2 user berbeda
4. Browser 1: Create room
5. Browser 2: Join room yang sama
6. Test chat real-time
7. Test typing indicator
8. Test DM

### Langkah 4: Final Push
```bash
git add .
git commit -m "feat: complete backend with messages and integration"
git push origin feature/messages

# Create Pull Request di GitHub:
# feature/messages -> main
```

---

## 📋 Checklist Akhir (Sebelum Merge ke Main)

### Backend Complete Checklist:
- [ ] Semua API endpoints respond correctly
- [ ] SignalR connection stable
- [ ] Real-time messaging works
- [ ] Typing indicators works
- [ ] Authentication works (JWT)
- [ ] Register auto-join to "umum"
- [ ] DM functionality works
- [ ] Message history pagination works
- [ ] Database relationships correct
- [ ] CORS configured for frontend
- [ ] Static files served from wwwroot
- [ ] No console errors
- [ ] Frontend fully functional

### Testing dengan Frontend:
- [ ] Buka auth.html → Register → Success
- [ ] Login → Redirect ke index.html
- [ ] Room list terlihat (minimal "umum")
- [ ] Klik room → Messages terload
- [ ] Send message → Appear real-time
- [ ] Typing indicator muncul saat ketik
- [ ] Create new room → Works
- [ ] Direct message → Works
- [ ] Multiple browser sessions → Real-time sync
- [ ] Logout → Works
- [ ] Dark mode → Works

---

## 🆘 Jika Stuck

1. **Baca spec di `.kiro/specs/ngariung/design.md`** - Semua detail ada di sini
2. **Lihat frontend code di `wwwroot/js/`** - Lihat API calls apa yang diexpect
3. **Tanya Kiro AI dengan context yang jelas** - Copy error message lengkap
4. **Debug dengan Postman** - Test API endpoint satu-satu
5. **Check console logs** - Backend & Frontend console
6. **Diskusi dengan team** - Maybe someone had similar issue

---

## 🎓 Learning Resources

### Must Read:
1. **Design.md** - File paling penting! Semua API contracts ada di sini
2. ASP.NET Core Minimal API: https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis
3. SignalR Tutorial: https://learn.microsoft.com/aspnet/core/signalr/introduction
4. EF Core Relationships: https://learn.microsoft.com/ef/core/modeling/relationships

### Video Tutorials:
- ASP.NET Core Crash Course: https://www.youtube.com/watch?v=BfEjDD8mWYg
- SignalR Real-time Chat: https://www.youtube.com/watch?v=RaXx_f3bIRU

---

## 💡 Tips untuk Kerja Tim

1. **Komunikasi adalah kunci** - Update progress setiap hari
2. **Test sebelum push** - Jangan push broken code
3. **Commit message yang jelas** - "feat: add room service" bukan "update"
4. **Code review** - Review code teman sebelum merge
5. **Dokumentasi** - Comment untuk logic yang complex
6. **Tanya jika stuck > 30 menit** - Don't waste time stuck

---

**Good luck! Kalian pasti bisa! 🚀**

Kalau ada yang bingung, tanya di grup atau open issue di GitHub!
