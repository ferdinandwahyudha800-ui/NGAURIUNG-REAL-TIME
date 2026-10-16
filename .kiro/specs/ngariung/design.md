# Design Document

## Overview

Dokumen ini menjelaskan desain teknis untuk aplikasi Ngariung, sebuah aplikasi chat real-time berbasis web yang dibangun dengan ASP.NET Core dan SignalR. Desain ini mencakup arsitektur sistem, model data, interface komponen, API endpoints, dan algoritma kunci yang diperlukan untuk memenuhi semua requirements.

**Stack Teknologi:**
- Backend: ASP.NET Core 8.0+ dengan Minimal API
- Real-time: SignalR dengan WebSocket transport
- Authentication: ASP.NET Core Identity + JWT
- Database: EF Core dengan SQLite (development) dan PostgreSQL (production)
- Caching: IMemoryCache untuk rate limiting
- Frontend: HTML/CSS/JavaScript + SignalR JavaScript Client
- Deployment: Docker + Docker Compose

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Browser    │    │   Browser    │    │   Browser    │      │
│  │ (HTML/CSS/JS)│    │ (HTML/CSS/JS)│    │ (HTML/CSS/JS)│      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                    │                    │              │
└─────────┼────────────────────┼────────────────────┼──────────────┘
          │                    │                    │
          │ HTTPS/WSS          │ HTTPS/WSS          │ HTTPS/WSS
          │                    │                    │
┌─────────┴────────────────────┴────────────────────┴──────────────┐
│                     ASP.NET Core Server                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Minimal API (REST)                      │  │
│  │  /api/auth/*  /api/rooms/*  /api/me  /api/dm/*           │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│  ┌────────────────────────────┴───────────────────────────────┐  │
│  │                    SignalR Hub (/chatHub)                  │  │
│  │  JoinRoom, SendMessage, StartTyping, MarkRead              │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│  ┌────────────────────────────┴───────────────────────────────┐  │
│  │                     Service Layer                          │  │
│  │  AuthService  RoomService  MessageStore  PresenceService   │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│  ┌────────────────────────────┴───────────────────────────────┐  │
│  │                  Repository Layer (EF Core)                │  │
│  │  UserRepository  RoomRepository  MessageRepository         │  │
│  └────────────────────────────┬───────────────────────────────┘  │
└───────────────────────────────┼───────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────┐
│                        Database Layer                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL (Production) / SQLite (Development)          │    │
│  │  Tables: Users, Rooms, RoomMembers, Messages             │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      ASP.NET Core Server                         │
│                                                                  │
│  ┌────────────────────┐          ┌────────────────────┐         │
│  │  AuthController    │          │    ChatHub         │         │
│  │  - Register()      │          │  - JoinRoom()      │         │
│  │  - Login()         │          │  - SendMessage()   │         │
│  │  - Logout()        │          │  - StartTyping()   │         │
│  └─────────┬──────────┘          │  - MarkRead()      │         │
│            │                     └─────────┬──────────┘         │
│            │                               │                    │
│            │                               │                    │
│  ┌─────────▼──────────┐          ┌─────────▼──────────┐        │
│  │ IAuthService       │          │ IPresenceService   │        │
│  │ - RegisterAsync()  │          │ - ConnectAsync()   │        │
│  │ - LoginAsync()     │          │ - DisconnectAsync()│        │
│  │ - GenerateToken()  │          │ - UpdateStatus()   │        │
│  └─────────┬──────────┘          └─────────┬──────────┘        │
│            │                               │                    │
│  ┌─────────▼────────────────────┬──────────▼──────────┐        │
│  │      IRoomService            │   IMessageStore      │        │
│  │  - CreateRoomAsync()         │ - SaveMessageAsync() │        │
│  │  - GetUserRoomsAsync()       │ - GetMessagesAsync() │        │
│  │  - JoinRoomAsync()           │ - GetHistoryAsync()  │        │
│  │  - LeaveRoomAsync()          │                      │        │
│  │  - GetOrCreateDirectRoom()   │                      │        │
│  └─────────┬──────────────────────────────┬──────────┘        │
│            │                               │                    │
│  ┌─────────▼───────────────────────────────▼──────────┐        │
│  │           ApplicationDbContext (EF Core)           │        │
│  │  - Users (DbSet<User>)                             │        │
│  │  - Rooms (DbSet<Room>)                             │        │
│  │  - RoomMembers (DbSet<RoomMember>)                 │        │
│  │  - Messages (DbSet<Message>)                       │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Model

```
┌─────────────────────┐
│       User          │
├─────────────────────┤
│ Id: Guid (PK)       │
│ Email: string       │◄────────┐
│ DisplayName: string │         │
│ PasswordHash: string│         │
│ Status: UserStatus  │         │
│ CreatedAt: DateTime │         │
└─────────┬───────────┘         │
          │                     │
          │                     │
          │ 1                   │ OwnerId
          │                     │
          │ *                   │
┌─────────▼───────────┐         │
│     RoomMember      │         │
├─────────────────────┤         │
│ RoomId: Guid (PK)   │         │
│ UserId: Guid (PK)   │         │
│ Role: MemberRole    │         │
│ JoinedAt: DateTime  │         │
│ LastReadAt: DateTime│         │
└─────────┬───────────┘         │
          │ *                   │
          │                     │
          │ 1                   │
┌─────────▼───────────┐         │
│       Room          │         │
├─────────────────────┤         │
│ Id: Guid (PK)       ├─────────┘
│ Name: string        │
│ Description: string │
│ Type: RoomType      │
│ OwnerId: Guid (FK)  │
│ CreatedAt: DateTime │
└─────────┬───────────┘
          │ 1
          │
          │ *
┌─────────▼───────────┐
│      Message        │
├─────────────────────┤
│ Id: Guid (PK)       │
│ RoomId: Guid (FK)   │
│ SenderId: Guid (FK) │
│ Body: string        │
│ Kind: MessageKind   │
│ FileUrl: string?    │
│ FileName: string?   │
│ CreatedAt: DateTime │
└─────────────────────┘

Enums:
- UserStatus: Online, Busy, Away, Offline
- RoomType: Public, Private, Direct
- MemberRole: Owner, Member
- MessageKind: Text, File
```

### Key Flows

#### Flow 1: User Registration and Auto-Join

```
Client                 AuthController         AuthService           RoomService          Database
  │                         │                      │                     │                   │
  ├─POST /api/auth/register─►                      │                     │                   │
  │  {email, password,      │                      │                     │                   │
  │   displayName}          │                      │                     │                   │
  │                         ├─RegisterAsync()──────►                     │                   │
  │                         │                      ├─Check if email─────►│
  │                         │                      │  exists             │                   │
  │                         │                      ◄─────────────────────┤
  │                         │                      │                     │                   │
  │                         │                      ├─Hash password       │                   │
  │                         │                      │                     │                   │
  │                         │                      ├─Create User─────────┼──────────────────►│
  │                         │                      │                     │                   │
  │                         │                      ├─Generate JWT        │                   │
  │                         │                      │                     │                   │
  │                         │                      ├─JoinRoomAsync()─────►                   │
  │                         │                      │  ("umum")           ├─Find "umum"──────►│
  │                         │                      │                     │  room             │
  │                         │                      │                     ◄───────────────────┤
  │                         │                      │                     │                   │
  │                         │                      │                     ├─Create RoomMember►│
  │                         │                      │                     │                   │
  │                         ◄──────────────────────┤                     │                   │
  │                         │ {token, userId}      │                     │                   │
  ◄─200 OK─────────────────┤                      │                     │                   │
  │  {token, userId,        │                      │                     │                   │
  │   displayName}          │                      │                     │                   │
  │                         │                      │                     │                   │
```

#### Flow 2: Send Message Real-time

```
Client A              ChatHub            MessageStore         SignalR Groups      Client B
  │                      │                     │                    │                │
  ├─SendMessage()────────►                     │                    │                │
  │  {roomId, text}      │                     │                    │                │
  │                      ├─Validate auth       │                    │                │
  │                      │                     │                    │                │
  │                      ├─Check membership    │                    │                │
  │                      │                     │                    │                │
  │                      ├─Check rate limit    │                    │                │
  │                      │                     │                    │                │
  │                      ├─SaveMessageAsync()──►                    │                │
  │                      │                     ├─Escape HTML        │                │
  │                      │                     │                    │                │
  │                      │                     ├─Insert to DB       │                │
  │                      │                     │                    │                │
  │                      ◄─────────────────────┤                    │                │
  │                      │ Message entity      │                    │                │
  │                      │                     │                    │                │
  │                      ├─ReceiveMessage──────┼─Broadcast to Group─►                │
  │                      │  to Group           │                    ├─ReceiveMessage─►
  ◄─ReceiveMessage───────┤                     │                    │                │
  │  {id, sender,        │                     │                    │                │
  │   body, timestamp}   │                     │                    │                │
  │                      │                     │                    │                │
```

#### Flow 3: Auto-Reconnect and Message Recovery

```
Client                SignalR Hub         MessageStore           Database
  │                      │                     │                     │
  ├─Connected────────────►                     │                     │
  │                      ├─OnConnectedAsync()  │                     │
  │                      │                     │                     │
  │  [Network issue]     │                     │                     │
  ├─Disconnected         │                     │                     │
  │                      ├─OnDisconnectedAsync()                     │
  │                      │                     │                     │
  ├─[Auto reconnect      │                     │                     │
  │  with backoff:       │                     │                     │
  │  1s, 2s, 4s...]      │                     │                     │
  │                      │                     │                     │
  ├─Reconnected──────────►                     │                     │
  │                      ├─OnConnectedAsync()  │                     │
  │                      │                     │                     │
  ├─Request missed msgs──►                     │                     │
  │  for all rooms       │                     │                     │
  │                      ├─GetMessagesAsync()──►                     │
  │                      │  WHERE CreatedAt >  ├─Query──────────────►│
  │                      │  LastReadAt         │                     │
  │                      │                     ◄─────────────────────┤
  │                      ◄─────────────────────┤                     │
  ◄─Receive missed msgs──┤  Messages[]         │                     │
  │                      │                     │                     │
```

## Data Models

### Database Schema

#### Users Table
```sql
CREATE TABLE Users (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Email VARCHAR(255) NOT NULL UNIQUE,
    DisplayName VARCHAR(50) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Offline',
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT CHK_DisplayName_Length CHECK (LENGTH(DisplayName) BETWEEN 2 AND 50),
    CONSTRAINT CHK_Status CHECK (Status IN ('Online', 'Busy', 'Away', 'Offline'))
);

CREATE INDEX IDX_Users_Email ON Users(Email);
```

#### Rooms Table
```sql
CREATE TABLE Rooms (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(200),
    Type VARCHAR(20) NOT NULL,
    OwnerId UUID NOT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_Rooms_Owner FOREIGN KEY (OwnerId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT CHK_Name_Length CHECK (LENGTH(Name) BETWEEN 3 AND 50),
    CONSTRAINT CHK_Type CHECK (Type IN ('Public', 'Private', 'Direct'))
);

CREATE INDEX IDX_Rooms_Name ON Rooms(LOWER(Name));
CREATE INDEX IDX_Rooms_Type ON Rooms(Type);
```

#### RoomMembers Table
```sql
CREATE TABLE RoomMembers (
    RoomId UUID NOT NULL,
    UserId UUID NOT NULL,
    Role VARCHAR(20) NOT NULL DEFAULT 'Member',
    JoinedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastReadAt TIMESTAMP,
    
    PRIMARY KEY (RoomId, UserId),
    CONSTRAINT FK_RoomMembers_Room FOREIGN KEY (RoomId) REFERENCES Rooms(Id) ON DELETE CASCADE,
    CONSTRAINT FK_RoomMembers_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT CHK_Role CHECK (Role IN ('Owner', 'Member'))
);

CREATE INDEX IDX_RoomMembers_UserId ON RoomMembers(UserId);
CREATE INDEX IDX_RoomMembers_LastReadAt ON RoomMembers(RoomId, LastReadAt);
```

#### Messages Table
```sql
CREATE TABLE Messages (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    RoomId UUID NOT NULL,
    SenderId UUID NOT NULL,
    Body VARCHAR(500) NOT NULL,
    Kind VARCHAR(20) NOT NULL DEFAULT 'Text',
    FileUrl VARCHAR(500),
    FileName VARCHAR(255),
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_Messages_Room FOREIGN KEY (RoomId) REFERENCES Rooms(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT CHK_Body_Length CHECK (LENGTH(Body) BETWEEN 1 AND 500),
    CONSTRAINT CHK_Kind CHECK (Kind IN ('Text', 'File'))
);

CREATE INDEX IDX_Messages_RoomId_CreatedAt ON Messages(RoomId, CreatedAt DESC);
CREATE INDEX IDX_Messages_CreatedAt ON Messages(CreatedAt);
```

## Components and Interfaces

### Service Interfaces

#### IAuthenticationService

```csharp
public interface IAuthenticationService
{
    /// <summary>
    /// Register pengguna baru dengan email, password, dan display name
    /// </summary>
    /// <returns>JWT token dan user ID</returns>
    /// <exception cref="ValidationException">Email sudah digunakan atau input tidak valid</exception>
    Task<AuthResult> RegisterAsync(string email, string password, string displayName);
    
    /// <summary>
    /// Login dengan email dan password
    /// </summary>
    /// <returns>JWT token dan user ID</returns>
    /// <exception cref="AuthenticationException">Kredensial tidak valid</exception>
    /// <exception cref="RateLimitException">Terlalu banyak percobaan login</exception>
    Task<AuthResult> LoginAsync(string email, string password, string ipAddress);
    
    /// <summary>
    /// Validasi JWT token dan return user ID
    /// </summary>
    /// <returns>User ID jika token valid</returns>
    Task<Guid> ValidateTokenAsync(string token);
    
    /// <summary>
    /// Generate JWT token untuk user
    /// </summary>
    string GenerateToken(Guid userId, string email, string displayName);
}

public record AuthResult(string Token, Guid UserId, string DisplayName);
```

#### IRoomService

```csharp
public interface IRoomService
{
    /// <summary>
    /// Buat ruang obrolan baru
    /// </summary>
    /// <exception cref="ValidationException">Nama ruang sudah digunakan atau input tidak valid</exception>
    /// <exception cref="RateLimitException">User membuat terlalu banyak ruang</exception>
    Task<Room> CreateRoomAsync(Guid userId, string name, string? description, RoomType type);
    
    /// <summary>
    /// Get daftar ruang yang diikuti user, sorted by last message timestamp
    /// </summary>
    Task<List<RoomSummary>> GetUserRoomsAsync(Guid userId);
    
    /// <summary>
    /// User join ke ruang
    /// </summary>
    /// <exception cref="UnauthorizedException">Ruang private dan user tidak diundang</exception>
    Task JoinRoomAsync(Guid userId, Guid roomId, MemberRole role = MemberRole.Member);
    
    /// <summary>
    /// User keluar dari ruang
    /// </summary>
    /// <exception cref="ValidationException">Tidak bisa keluar dari ruang "umum"</exception>
    Task LeaveRoomAsync(Guid userId, Guid roomId);
    
    /// <summary>
    /// Get atau create direct message room antara dua user
    /// </summary>
    Task<Room> GetOrCreateDirectRoomAsync(Guid userId1, Guid userId2);
    
    /// <summary>
    /// Get detail ruang dan daftar anggota
    /// </summary>
    /// <exception cref="UnauthorizedException">User bukan anggota ruang</exception>
    Task<RoomDetail> GetRoomDetailAsync(Guid userId, Guid roomId);
    
    /// <summary>
    /// Check apakah user adalah anggota ruang
    /// </summary>
    Task<bool> IsMemberAsync(Guid userId, Guid roomId);
    
    /// <summary>
    /// Update LastReadAt untuk user di ruang tertentu
    /// </summary>
    Task UpdateLastReadAsync(Guid userId, Guid roomId, DateTime timestamp);
    
    /// <summary>
    /// Get jumlah unread messages untuk user di ruang tertentu
    /// </summary>
    Task<int> GetUnreadCountAsync(Guid userId, Guid roomId);
}

public record RoomSummary(
    Guid Id,
    string Name,
    string? Description,
    RoomType Type,
    int MemberCount,
    int UnreadCount,
    DateTime? LastMessageAt
);

public record RoomDetail(
    Guid Id,
    string Name,
    string? Description,
    RoomType Type,
    Guid OwnerId,
    DateTime CreatedAt,
    List<MemberInfo> Members
);

public record MemberInfo(
    Guid UserId,
    string DisplayName,
    UserStatus Status,
    MemberRole Role
);
```

#### IMessageStore

```csharp
public interface IMessageStore
{
    /// <summary>
    /// Simpan pesan ke database dengan HTML escaping
    /// </summary>
    /// <exception cref="ValidationException">Body kosong atau terlalu panjang</exception>
    Task<Message> SaveMessageAsync(Guid roomId, Guid senderId, string body, MessageKind kind = MessageKind.Text);
    
    /// <summary>
    /// Get N pesan terbaru dari ruang
    /// </summary>
    Task<List<MessageDto>> GetMessagesAsync(Guid roomId, int limit = 50);
    
    /// <summary>
    /// Get message history dengan pagination (before timestamp)
    /// </summary>
    Task<MessageHistory> GetMessageHistoryAsync(Guid roomId, DateTime? before = null, int limit = 50);
    
    /// <summary>
    /// Get pesan yang lebih baru dari timestamp tertentu (untuk message recovery)
    /// </summary>
    Task<List<MessageDto>> GetMessagesSinceAsync(Guid roomId, DateTime since);
}

public record MessageDto(
    Guid Id,
    Guid RoomId,
    Guid SenderId,
    string SenderName,
    string Body,
    MessageKind Kind,
    string? FileUrl,
    string? FileName,
    DateTime CreatedAt
);

public record MessageHistory(
    List<MessageDto> Messages,
    bool HasMore
);
```

#### IPresenceService

```csharp
public interface IPresenceService
{
    /// <summary>
    /// Track koneksi SignalR baru untuk user
    /// </summary>
    Task ConnectAsync(Guid userId, string connectionId);
    
    /// <summary>
    /// Remove koneksi SignalR saat disconnect
    /// </summary>
    Task DisconnectAsync(Guid userId, string connectionId);
    
    /// <summary>
    /// Update status user (Online, Busy, Away)
    /// </summary>
    Task UpdateStatusAsync(Guid userId, UserStatus status);
    
    /// <summary>
    /// Get status online/offline untuk list of users
    /// </summary>
    Task<Dictionary<Guid, UserStatus>> GetUserStatusesAsync(List<Guid> userIds);
    
    /// <summary>
    /// Check apakah user memiliki koneksi aktif
    /// </summary>
    Task<bool> IsOnlineAsync(Guid userId);
    
    /// <summary>
    /// Get semua connectionId untuk user tertentu (multiple tabs)
    /// </summary>
    Task<List<string>> GetConnectionIdsAsync(Guid userId);
}
```

#### IRateLimiter

```csharp
public interface IRateLimiter
{
    /// <summary>
    /// Check dan increment counter untuk rate limiting
    /// </summary>
    /// <returns>True jika dalam limit, false jika exceed</returns>
    Task<RateLimitResult> CheckLimitAsync(string key, int maxAttempts, TimeSpan window);
    
    /// <summary>
    /// Get remaining time until rate limit reset
    /// </summary>
    Task<TimeSpan> GetResetTimeAsync(string key);
}

public record RateLimitResult(bool IsAllowed, int RemainingAttempts, TimeSpan ResetIn);
```

### REST API Endpoints

#### Authentication Endpoints

**POST /api/auth/register**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "John Doe"
}

Error (400 Bad Request):
{
  "error": "Email sudah digunakan"
}

Error (400 Bad Request):
{
  "error": "Password minimal 6 karakter"
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "John Doe"
}

Error (401 Unauthorized):
{
  "error": "Email atau password salah"
}

Error (429 Too Many Requests):
{
  "error": "Terlalu banyak percobaan login. Tunggu 15 menit.",
  "retryAfter": 900
}
```

**POST /api/auth/logout**
```
Request Headers:
Authorization: Bearer {token}

Response (204 No Content)
```

#### Room Endpoints

**GET /api/rooms**
```json
Request Headers:
Authorization: Bearer {token}

Response (200 OK):
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "umum",
    "description": "Ruang obrolan umum",
    "type": "Public",
    "memberCount": 25,
    "unreadCount": 3,
    "lastMessageAt": "2026-10-15T10:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "proyek-a",
    "description": "Diskusi proyek A",
    "type": "Private",
    "memberCount": 5,
    "unreadCount": 0,
    "lastMessageAt": "2026-10-15T09:15:00Z"
  }
]
```

**POST /api/rooms**
```json
Request Headers:
Authorization: Bearer {token}

Request:
{
  "name": "proyek-b",
  "description": "Ruang diskusi proyek B",
  "type": "Public"
}

Response (201 Created):
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "name": "proyek-b",
  "description": "Ruang diskusi proyek B",
  "type": "Public",
  "ownerId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-10-15T10:35:00Z"
}

Error (400 Bad Request):
{
  "error": "Nama ruang sudah digunakan"
}

Error (429 Too Many Requests):
{
  "error": "Terlalu banyak ruang dibuat. Tunggu 1 jam.",
  "retryAfter": 3600
}
```

**GET /api/rooms/{id}**
```json
Request Headers:
Authorization: Bearer {token}

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "umum",
  "description": "Ruang obrolan umum",
  "type": "Public",
  "ownerId": "880e8400-e29b-41d4-a716-446655440003",
  "createdAt": "2026-10-01T00:00:00Z",
  "members": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "displayName": "John Doe",
      "status": "Online",
      "role": "Member"
    },
    {
      "userId": "660e8400-e29b-41d4-a716-446655440001",
      "displayName": "Jane Smith",
      "status": "Busy",
      "role": "Owner"
    }
  ]
}

Error (403 Forbidden):
{
  "error": "Anda bukan anggota ruang ini"
}
```

**DELETE /api/rooms/{id}/members/me**
```
Request Headers:
Authorization: Bearer {token}

Response (204 No Content)

Error (400 Bad Request):
{
  "error": "Tidak dapat keluar dari ruang umum"
}
```

**GET /api/rooms/{id}/messages**
```json
Request Headers:
Authorization: Bearer {token}

Query Parameters:
- before: ISO 8601 timestamp (optional)
- limit: integer (default: 50, max: 100)

Response (200 OK):
{
  "messages": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "roomId": "550e8400-e29b-41d4-a716-446655440000",
      "senderId": "550e8400-e29b-41d4-a716-446655440000",
      "senderName": "John Doe",
      "body": "Hello everyone!",
      "kind": "Text",
      "fileUrl": null,
      "fileName": null,
      "createdAt": "2026-10-15T10:30:00Z"
    }
  ],
  "hasMore": true
}
```

#### Direct Message Endpoints

**POST /api/dm/{userId}**
```json
Request Headers:
Authorization: Bearer {token}

Response (200 OK):
{
  "roomId": "aa0e8400-e29b-41d4-a716-446655440005"
}
```

#### User Profile Endpoints

**PATCH /api/me**
```json
Request Headers:
Authorization: Bearer {token}

Request:
{
  "displayName": "John Updated",
  "status": "Busy"
}

Response (204 No Content)

Error (400 Bad Request):
{
  "error": "Display name harus antara 2-50 karakter"
}
```

**GET /api/users**
```json
Request Headers:
Authorization: Bearer {token}

Response (200 OK):
[
  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "displayName": "John Doe",
    "status": "Online"
  },
  {
    "userId": "660e8400-e29b-41d4-a716-446655440001",
    "displayName": "Jane Smith",
    "status": "Busy"
  }
]
```

### SignalR Hub Contract

#### ChatHub Class

```csharp
[Authorize]
public class ChatHub : Hub
{
    private readonly IRoomService _roomService;
    private readonly IMessageStore _messageStore;
    private readonly IPresenceService _presenceService;
    private readonly IRateLimiter _rateLimiter;
    
    /// <summary>
    /// Client memanggil method ini untuk join ke room SignalR group
    /// </summary>
    public async Task JoinRoom(Guid roomId);
    
    /// <summary>
    /// Client memanggil method ini untuk kirim pesan
    /// </summary>
    public async Task SendMessage(Guid roomId, string text);
    
    /// <summary>
    /// Client memanggil method ini saat user mulai mengetik
    /// </summary>
    public async Task StartTyping(Guid roomId);
    
    /// <summary>
    /// Client memanggil method ini untuk update LastReadAt
    /// </summary>
    public async Task MarkRead(Guid roomId);
    
    /// <summary>
    /// Lifecycle: saat koneksi baru terhubung
    /// </summary>
    public override async Task OnConnectedAsync();
    
    /// <summary>
    /// Lifecycle: saat koneksi terputus
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception);
}
```

#### Hub Server-to-Client Events

```typescript
// Client harus implement interface ini untuk terima event dari server

interface IChatClient {
    // Server mengirim pesan baru ke semua anggota room
    ReceiveMessage(message: {
        id: string,
        roomId: string,
        senderId: string,
        senderName: string,
        body: string,
        kind: 'Text' | 'File',
        fileUrl?: string,
        fileName?: string,
        createdAt: string
    }): void;
    
    // Server memberi tahu ada user yang sedang mengetik
    UserTyping(data: {
        roomId: string,
        userId: string,
        displayName: string
    }): void;
    
    // Server memberi tahu ada perubahan status user (online/offline/busy/away)
    PresenceChanged(data: {
        userId: string,
        status: 'Online' | 'Offline' | 'Busy' | 'Away'
    }): void;
    
    // Server memberi tahu ada perubahan pada room (member join/leave)
    RoomUpdated(data: {
        roomId: string,
        action: 'MemberJoined' | 'MemberLeft',
        userId: string
    }): void;
}
```

### Algorithms

#### Algorithm 1: Auto-Reconnect with Exponential Backoff

```csharp
public class SignalRReconnectStrategy
{
    private readonly int[] _retryDelaysMs = { 1000, 2000, 4000, 8000, 16000, 30000 };
    private int _attemptCount = 0;
    
    public async Task<bool> TryReconnectAsync(HubConnection connection)
    {
        while (_attemptCount < _retryDelaysMs.Length)
        {
            var delay = _retryDelaysMs[_attemptCount];
            _attemptCount++;
            
            // Show "Menghubungkan kembali..." UI indicator
            OnReconnecting?.Invoke(delay);
            
            await Task.Delay(delay);
            
            try
            {
                await connection.StartAsync();
                
                // Reconnect berhasil
                _attemptCount = 0;
                OnReconnected?.Invoke();
                
                // Load missed messages
                await LoadMissedMessagesAsync();
                
                return true;
            }
            catch (Exception ex)
            {
                // Retry lagi
                Logger.LogWarning($"Reconnect attempt {_attemptCount} failed: {ex.Message}");
            }
        }
        
        // Semua percobaan gagal
        OnReconnectFailed?.Invoke();
        return false;
    }
    
    private async Task LoadMissedMessagesAsync()
    {
        // Get semua room yang diikuti user
        var rooms = await GetUserRoomsAsync();
        
        foreach (var room in rooms)
        {
            // Get LastReadAt untuk room ini
            var lastRead = GetLastReadTimestamp(room.Id);
            
            // Request pesan yang lebih baru dari LastReadAt
            var missedMessages = await ApiClient.GetMessagesSinceAsync(room.Id, lastRead);
            
            // Display missed messages di UI
            foreach (var message in missedMessages)
            {
                DisplayMessage(message);
            }
        }
    }
}
```

#### Algorithm 2: Rate Limiting with Sliding Window

```csharp
public class SlidingWindowRateLimiter : IRateLimiter
{
    private readonly IMemoryCache _cache;
    
    public async Task<RateLimitResult> CheckLimitAsync(string key, int maxAttempts, TimeSpan window)
    {
        var cacheKey = $"ratelimit:{key}";
        
        if (!_cache.TryGetValue(cacheKey, out Queue<DateTime> timestamps))
        {
            timestamps = new Queue<DateTime>();
        }
        
        var now = DateTime.UtcNow;
        var windowStart = now - window;
        
        // Remove timestamps outside the window
        while (timestamps.Count > 0 && timestamps.Peek() < windowStart)
        {
            timestamps.Dequeue();
        }
        
        // Check if within limit
        if (timestamps.Count >= maxAttempts)
        {
            var oldestTimestamp = timestamps.Peek();
            var resetTime = oldestTimestamp + window - now;
            
            return new RateLimitResult(
                IsAllowed: false,
                RemainingAttempts: 0,
                ResetIn: resetTime
            );
        }
        
        // Add current timestamp
        timestamps.Enqueue(now);
        
        // Update cache with sliding expiration
        _cache.Set(cacheKey, timestamps, new MemoryCacheEntryOptions
        {
            SlidingExpiration = window
        });
        
        return new RateLimitResult(
            IsAllowed: true,
            RemainingAttempts: maxAttempts - timestamps.Count,
            ResetIn: window
        );
    }
}

// Usage examples:
// Login rate limit: key = $"login:{ipAddress}", maxAttempts = 5, window = 15 minutes
// Message rate limit: key = $"message:{userId}", maxAttempts = 10, window = 1 minute
// Create room rate limit: key = $"createroom:{userId}", maxAttempts = 5, window = 1 hour
```

#### Algorithm 3: Calculate Unread Message Count

```csharp
public class UnreadMessageCalculator
{
    public async Task<int> CalculateUnreadCountAsync(Guid userId, Guid roomId, ApplicationDbContext db)
    {
        // Get LastReadAt timestamp untuk user di room ini
        var roomMember = await db.RoomMembers
            .FirstOrDefaultAsync(rm => rm.UserId == userId && rm.RoomId == roomId);
        
        if (roomMember == null)
        {
            return 0;
        }
        
        var lastReadAt = roomMember.LastReadAt ?? DateTime.MinValue;
        
        // Count messages yang CreatedAt > LastReadAt
        var unreadCount = await db.Messages
            .Where(m => m.RoomId == roomId && m.CreatedAt > lastReadAt)
            .CountAsync();
        
        return unreadCount;
    }
    
    public async Task<Dictionary<Guid, int>> CalculateUnreadCountsForAllRoomsAsync(
        Guid userId, 
        ApplicationDbContext db)
    {
        // Get semua room yang diikuti user dengan LastReadAt
        var roomMembers = await db.RoomMembers
            .Where(rm => rm.UserId == userId)
            .ToListAsync();
        
        var result = new Dictionary<Guid, int>();
        
        foreach (var roomMember in roomMembers)
        {
            var lastReadAt = roomMember.LastReadAt ?? DateTime.MinValue;
            
            var unreadCount = await db.Messages
                .Where(m => m.RoomId == roomMember.RoomId && m.CreatedAt > lastReadAt)
                .CountAsync();
            
            result[roomMember.RoomId] = unreadCount;
        }
        
        return result;
    }
}
```

#### Algorithm 4: Get or Create Direct Message Room

```csharp
public async Task<Room> GetOrCreateDirectRoomAsync(Guid userId1, Guid userId2, ApplicationDbContext db)
{
    // Ensure userId1 < userId2 untuk konsistensi pencarian
    if (userId1 > userId2)
    {
        (userId1, userId2) = (userId2, userId1);
    }
    
    // Cari existing direct room antara dua user ini
    var existingRoom = await db.Rooms
        .Where(r => r.Type == RoomType.Direct)
        .Where(r => db.RoomMembers
            .Where(rm => rm.RoomId == r.Id)
            .Select(rm => rm.UserId)
            .OrderBy(uid => uid)
            .SequenceEqual(new[] { userId1, userId2 }))
        .FirstOrDefaultAsync();
    
    if (existingRoom != null)
    {
        return existingRoom;
    }
    
    // Buat room baru
    var user1 = await db.Users.FindAsync(userId1);
    var user2 = await db.Users.FindAsync(userId2);
    
    var newRoom = new Room
    {
        Id = Guid.NewGuid(),
        Name = $"dm_{userId1}_{userId2}", // Internal name
        Description = null,
        Type = RoomType.Direct,
        OwnerId = userId1,
        CreatedAt = DateTime.UtcNow
    };
    
    db.Rooms.Add(newRoom);
    
    // Add both users as members
    db.RoomMembers.Add(new RoomMember
    {
        RoomId = newRoom.Id,
        UserId = userId1,
        Role = MemberRole.Member,
        JoinedAt = DateTime.UtcNow
    });
    
    db.RoomMembers.Add(new RoomMember
    {
        RoomId = newRoom.Id,
        UserId = userId2,
        Role = MemberRole.Member,
        JoinedAt = DateTime.UtcNow
    });
    
    await db.SaveChangesAsync();
    
    return newRoom;
}
```

### Security Design

#### Authentication Flow

1. **Registration:**
   - Validasi email format dan uniqueness
   - Password hashing menggunakan ASP.NET Core Identity default (PBKDF2 atau bcrypt)
   - Generate JWT token dengan claims: userId, email, displayName
   - Token expiry: 7 hari

2. **JWT Token Structure:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "John Doe",
  "iat": 1697385600,
  "exp": 1697990400
}
```

3. **SignalR Authentication:**
   - Client mengirim JWT token via query string: `?access_token={token}`
   - Hub memiliki `[Authorize]` attribute
   - Token divalidasi setiap method call

4. **Authorization Checks:**
   - Setiap hub method check `Context.UserIdentifier` untuk get userId
   - Validasi room membership sebelum operasi (kirim pesan, lihat history, dll)
   - Validasi ownership untuk operasi sensitive (delete room, kick member)

#### Input Validation and Sanitization

```csharp
public class InputSanitizer
{
    public static string SanitizeHtml(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;
        
        return WebUtility.HtmlEncode(input);
    }
    
    public static string ValidateAndSanitizeDisplayName(string displayName)
    {
        if (displayName.Length < 2 || displayName.Length > 50)
            throw new ValidationException("Display name harus antara 2-50 karakter");
        
        return SanitizeHtml(displayName.Trim());
    }
    
    public static string ValidateAndSanitizeMessageBody(string body)
    {
        if (body.Length < 1 || body.Length > 500)
            throw new ValidationException("Pesan harus antara 1-500 karakter");
        
        return SanitizeHtml(body);
    }
    
    public static string ValidateAndSanitizeRoomName(string name)
    {
        if (name.Length < 3 || name.Length > 50)
            throw new ValidationException("Nama ruang harus antara 3-50 karakter");
        
        // Check for valid characters (alphanumeric, dash, underscore)
        if (!Regex.IsMatch(name, @"^[a-zA-Z0-9_-]+$"))
            throw new ValidationException("Nama ruang hanya boleh berisi huruf, angka, dash, dan underscore");
        
        return name.ToLowerInvariant();
    }
}
```

#### CORS Configuration

```csharp
// In Program.cs
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("AllowedOrigins")
            .Get<string[]>() ?? new[] { "http://localhost:5000" };
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

### Performance Optimizations

#### Database Indexing Strategy

1. **Users Table:**
   - Index on `Email` untuk fast lookup saat login
   
2. **Rooms Table:**
   - Index on `LOWER(Name)` untuk case-insensitive uniqueness check
   - Index on `Type` untuk filter room by type
   
3. **RoomMembers Table:**
   - Index on `UserId` untuk get user's rooms
   - Composite index on `(RoomId, LastReadAt)` untuk unread count calculation
   
4. **Messages Table:**
   - Composite index on `(RoomId, CreatedAt DESC)` untuk pagination dan recent messages
   - Index on `CreatedAt` untuk cleanup old messages (future)

#### SignalR Groups Optimization

```csharp
// Saat user join room, add ke SignalR group
public async Task JoinRoom(Guid roomId)
{
    var userId = GetCurrentUserId();
    
    // Validate membership
    if (!await _roomService.IsMemberAsync(userId, roomId))
    {
        throw new HubException("Anda bukan anggota ruang ini");
    }
    
    // Add connection to group
    await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());
    
    // Notify other members
    await Clients.OthersInGroup(roomId.ToString())
        .SendAsync("RoomUpdated", new { roomId, action = "MemberJoined", userId });
}

// Saat kirim pesan, broadcast ke group (efficient)
public async Task SendMessage(Guid roomId, string text)
{
    // ... validation and save to DB ...
    
    var message = await _messageStore.SaveMessageAsync(roomId, userId, text);
    
    // Broadcast to all members in the group (one network call)
    await Clients.Group(roomId.ToString())
        .SendAsync("ReceiveMessage", message);
}
```

#### Message Pagination

```csharp
public async Task<MessageHistory> GetMessageHistoryAsync(
    Guid roomId, 
    DateTime? before = null, 
    int limit = 50)
{
    // Limit to max 100 untuk prevent abuse
    limit = Math.Min(limit, 100);
    
    var query = _db.Messages
        .Where(m => m.RoomId == roomId)
        .OrderByDescending(m => m.CreatedAt);
    
    if (before.HasValue)
    {
        query = query.Where(m => m.CreatedAt < before.Value);
    }
    
    // Take limit + 1 untuk check if hasMore
    var messages = await query
        .Take(limit + 1)
        .Select(m => new MessageDto(
            m.Id,
            m.RoomId,
            m.SenderId,
            m.Sender.DisplayName,
            m.Body,
            m.Kind,
            m.FileUrl,
            m.FileName,
            m.CreatedAt
        ))
        .ToListAsync();
    
    var hasMore = messages.Count > limit;
    
    if (hasMore)
    {
        messages = messages.Take(limit).ToList();
    }
    
    // Reverse untuk ascending order (oldest first)
    messages.Reverse();
    
    return new MessageHistory(messages, hasMore);
}
```

### Scalability Considerations (Future)

#### Redis Backplane for Multi-Server SignalR

```csharp
// When scaling to multiple servers
builder.Services.AddSignalR()
    .AddStackExchangeRedis(options =>
    {
        options.Configuration = builder.Configuration.GetConnectionString("Redis");
    });

// This allows messages to broadcast across all servers
// Client A on Server 1 -> sends message -> Redis -> broadcasts to Server 2 -> Client B receives
```

#### Database Read Replicas

```csharp
// For read-heavy operations, use read replicas
public class ApplicationDbContext : DbContext
{
    private readonly string _readConnectionString;
    private readonly string _writeConnectionString;
    
    public DbContext CreateReadContext()
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseNpgsql(_readConnectionString);
        return new ApplicationDbContext(optionsBuilder.Options);
    }
}

// Usage:
var messages = await _readContext.Messages
    .Where(m => m.RoomId == roomId)
    .ToListAsync();
```

## Deployment Design

### Docker Configuration

#### Dockerfile
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Ngariung.csproj", "./"]
RUN dotnet restore "Ngariung.csproj"

COPY . .
RUN dotnet build "Ngariung.csproj" -c Release -o /app/build
RUN dotnet publish "Ngariung.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["dotnet", "Ngariung.dll"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  ngariung-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:80"
      - "5001:443"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://+:80;https://+:443
      - ConnectionStrings__DefaultConnection=Host=db;Database=ngariung;Username=ngariung_user;Password=${DB_PASSWORD}
      - JwtSettings__SecretKey=${JWT_SECRET}
      - JwtSettings__ExpiryDays=7
      - AllowedOrigins__0=https://yourdomain.com
      - ASPNETCORE_HTTPS_PORT=5001
    depends_on:
      - db
    networks:
      - ngariung-network
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=ngariung
      - POSTGRES_USER=ngariung_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - ngariung-network
    restart: unless-stopped

volumes:
  postgres-data:

networks:
  ngariung-network:
    driver: bridge
```

#### Environment Variables (.env)
```
DB_PASSWORD=your_secure_db_password_here
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters
```

### Database Migration Strategy

```csharp
// In Program.cs - run migrations automatically on startup
var app = builder.Build();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    try
    {
        db.Database.Migrate();
        
        // Seed default "umum" room if not exists
        if (!await db.Rooms.AnyAsync(r => r.Name == "umum"))
        {
            var systemUser = await db.Users.FirstOrDefaultAsync(u => u.Email == "system@ngariung.app");
            
            if (systemUser == null)
            {
                systemUser = new User
                {
                    Id = Guid.NewGuid(),
                    Email = "system@ngariung.app",
                    DisplayName = "System",
                    PasswordHash = "",
                    Status = UserStatus.Offline,
                    CreatedAt = DateTime.UtcNow
                };
                db.Users.Add(systemUser);
                await db.SaveChangesAsync();
            }
            
            var umumRoom = new Room
            {
                Id = Guid.NewGuid(),
                Name = "umum",
                Description = "Ruang obrolan umum untuk semua pengguna",
                Type = RoomType.Public,
                OwnerId = systemUser.Id,
                CreatedAt = DateTime.UtcNow
            };
            
            db.Rooms.Add(umumRoom);
            await db.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
        throw;
    }
}

app.Run();
```

## Logging and Monitoring Design

### Structured Logging Configuration

```csharp
// In Program.cs
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

if (builder.Environment.IsProduction())
{
    builder.Logging.AddJsonConsole(options =>
    {
        options.JsonWriterOptions = new System.Text.Json.JsonWriterOptions
        {
            Indented = false
        };
    });
}

// Add Serilog (optional, recommended)
builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File("logs/ngariung-.log", rollingInterval: RollingInterval.Day);
});
```

### Logging Examples

```csharp
public class AuthenticationService : IAuthenticationService
{
    private readonly ILogger<AuthenticationService> _logger;
    
    public async Task<AuthResult> LoginAsync(string email, string password, string ipAddress)
    {
        try
        {
            // ... login logic ...
            
            _logger.LogInformation(
                "User logged in successfully. UserId: {UserId}, Email: {Email}, IP: {IpAddress}",
                user.Id,
                email,
                ipAddress
            );
            
            return new AuthResult(token, user.Id, user.DisplayName);
        }
        catch (AuthenticationException ex)
        {
            _logger.LogWarning(
                "Failed login attempt. Email: {Email}, IP: {IpAddress}, Reason: {Reason}",
                email,
                ipAddress,
                ex.Message
            );
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error during login. Email: {Email}, IP: {IpAddress}",
                email,
                ipAddress
            );
            throw;
        }
    }
}
```

## Testing Strategy

### Unit Testing

```csharp
public class RoomServiceTests
{
    [Fact]
    public async Task CreateRoomAsync_WithValidInput_CreatesRoom()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb")
            .Options;
        
        using var context = new ApplicationDbContext(options);
        var service = new RoomService(context, Mock.Of<ILogger<RoomService>>());
        
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "test@example.com", DisplayName = "Test" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        
        // Act
        var room = await service.CreateRoomAsync(userId, "test-room", "Test room", RoomType.Public);
        
        // Assert
        Assert.NotNull(room);
        Assert.Equal("test-room", room.Name);
        Assert.Equal(RoomType.Public, room.Type);
        
        var member = await context.RoomMembers
            .FirstOrDefaultAsync(rm => rm.RoomId == room.Id && rm.UserId == userId);
        Assert.NotNull(member);
        Assert.Equal(MemberRole.Owner, member.Role);
    }
    
    [Fact]
    public async Task CreateRoomAsync_WithDuplicateName_ThrowsException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb2")
            .Options;
        
        using var context = new ApplicationDbContext(options);
        var service = new RoomService(context, Mock.Of<ILogger<RoomService>>());
        
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "test@example.com", DisplayName = "Test" };
        context.Users.Add(user);
        
        var existingRoom = new Room
        {
            Id = Guid.NewGuid(),
            Name = "duplicate-room",
            Type = RoomType.Public,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow
        };
        context.Rooms.Add(existingRoom);
        await context.SaveChangesAsync();
        
        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.CreateRoomAsync(userId, "duplicate-room", null, RoomType.Public)
        );
    }
}
```

### Integration Testing (SignalR Hub)

```csharp
public class ChatHubTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    
    public ChatHubTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }
    
    [Fact]
    public async Task SendMessage_BroadcastsToAllRoomMembers()
    {
        // Arrange
        var hubConnection = new HubConnectionBuilder()
            .WithUrl($"{_factory.Server.BaseAddress}chatHub", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(GetTestToken());
            })
            .Build();
        
        await hubConnection.StartAsync();
        
        var receivedMessage = false;
        hubConnection.On<MessageDto>("ReceiveMessage", (message) =>
        {
            receivedMessage = true;
            Assert.Equal("Test message", message.Body);
        });
        
        // Act
        await hubConnection.InvokeAsync("JoinRoom", TestRoomId);
        await hubConnection.InvokeAsync("SendMessage", TestRoomId, "Test message");
        
        await Task.Delay(1000); // Wait for broadcast
        
        // Assert
        Assert.True(receivedMessage);
        
        await hubConnection.StopAsync();
    }
}
```

## Correctness Properties

### Property 1: User Uniqueness

**Statement:** Setiap email hanya boleh terdaftar satu kali dalam sistem.

**Validates:** Requirement 1.2

**Verification:** Database constraint UNIQUE pada kolom Email di tabel Users.

**Impact:** Mencegah duplicate accounts dan memastikan setiap email merepresentasikan satu user.

### Property 2: Room Name Uniqueness

**Statement:** Setiap nama ruang harus unik (case-insensitive) dalam sistem.

**Validates:** Requirement 6.3, 6.4

**Verification:** 
- Database constraint UNIQUE pada kolom Name di tabel Rooms
- Index pada LOWER(Name)
- Validation check sebelum insert

**Impact:** Mencegah konfusi dan memastikan user dapat menemukan ruang dengan nama yang jelas.

### Property 3: Direct Room Uniqueness

**Statement:** Hanya boleh ada satu Direct room antara dua user tertentu.

**Validates:** Requirement 15.2, 15.3

**Verification:** GetOrCreateDirectRoomAsync algorithm yang mencari existing room sebelum membuat baru.

**Impact:** Mencegah multiple DM threads antara dua user yang sama, menjaga conversation history terpusat.

### Property 4: Room Membership Authorization

**Statement:** User hanya boleh mengirim/menerima pesan di room yang menjadi anggotanya.

**Validates:** Requirement 10.6, 18.4

**Verification:**
- Hub method call memeriksa IsMemberAsync() sebelum operasi
- Database query memfilter berdasarkan RoomMembers junction table

**Impact:** Menjaga privacy dan memastikan hanya authorized users yang bisa akses conversation.

### Property 5: Default Room Membership

**Statement:** Semua user baru otomatis menjadi anggota ruang "umum".

**Validates:** Requirement 1.5, 10

**Verification:** RegisterAsync() method memanggil JoinRoomAsync() untuk ruang "umum" setelah create user.

**Impact:** Onboarding experience yang seamless, user langsung bisa chat setelah registrasi.

### Property 6: Direct Room Size Constraint

**Statement:** Room dengan tipe Direct harus memiliki tepat 2 anggota, tidak lebih, tidak kurang.

**Validates:** Requirement 15.1, 15.4, 15.5

**Verification:**
- GetOrCreateDirectRoomAsync() membuat room dengan 2 members
- Validation mencegah penambahan member ketiga ke Direct room

**Impact:** Menjaga konsep Direct Message sebagai 1-on-1 conversation.

### Property 7: LastReadAt Monotonicity

**Statement:** LastReadAt untuk user di suatu room hanya boleh bertambah (monotonically increasing), tidak pernah mundur.

**Validates:** Requirement 7.4, 12

**Verification:** UpdateLastReadAsync() hanya update jika timestamp baru > timestamp lama.

**Impact:** Memastikan unread count calculation akurat dan tidak pernah negative.

### Property 8: Message Ordering Consistency

**Statement:** Pesan dalam satu room diurutkan berdasarkan CreatedAt timestamp secara konsisten untuk semua user.

**Validates:** Requirement 11.2, 12.4

**Verification:**
- Database index pada (RoomId, CreatedAt DESC)
- Query menggunakan ORDER BY CreatedAt

**Impact:** Semua user melihat message history dalam urutan yang sama, mencegah confusion.

### Property 9: Presence Consistency

**Statement:** Status online/offline user konsisten di semua room yang diikuti user tersebut.

**Validates:** Requirement 4.3, 16.3

**Verification:** PresenceChanged event di-broadcast ke semua groups (rooms) yang diikuti user.

**Impact:** User lain melihat status yang konsisten di semua konteks.

### Property 10: Transaction Atomicity

**Statement:** Operasi create room, join room, dan send message bersifat atomic (all-or-nothing).

**Validates:** Requirement 6.1, 6.2, 10.1

**Verification:** 
- Menggunakan database transaction dengan BeginTransactionAsync()
- Commit hanya jika semua operasi berhasil
- Rollback jika ada error

**Impact:** Mencegah partial state (e.g., room created tapi owner tidak di-add sebagai member).

### Invariants

1. **User Uniqueness:** Setiap email hanya boleh terdaftar satu kali dalam sistem
2. **Room Name Uniqueness:** Setiap nama ruang harus unik (case-insensitive) dalam sistem
3. **Direct Room Uniqueness:** Hanya boleh ada satu Direct room antara dua user tertentu
4. **Room Membership:** User hanya boleh mengirim/menerima pesan di room yang menjadi anggotanya
5. **Default Room Membership:** Semua user baru otomatis menjadi anggota ruang "umum"
6. **Direct Room Size:** Room dengan tipe Direct harus memiliki tepat 2 anggota, tidak lebih, tidak kurang
7. **LastReadAt Monotonicity:** LastReadAt untuk user di suatu room hanya boleh bertambah (monotonically increasing), tidak pernah mundur

### Consistency Guarantees

1. **Message Ordering:** Pesan dalam satu room diurutkan berdasarkan CreatedAt timestamp secara konsisten untuk semua user
2. **Presence Consistency:** Status online/offline user konsisten di semua room yang diikuti user tersebut
3. **Unread Count Accuracy:** Jumlah unread messages dihitung secara akurat berdasarkan LastReadAt timestamp
4. **Transaction Safety:** Operasi create room, join room, dan send message menggunakan database transaction untuk memastikan atomicity

### Safety Properties

1. **Authentication Required:** Semua endpoint dan hub method memerlukan valid JWT token
2. **Authorization Enforcement:** User hanya bisa mengakses data dari room yang menjadi anggotanya
3. **Rate Limiting Protection:** Sistem membatasi jumlah operasi per user untuk mencegah abuse (login, send message, create room)
4. **Input Validation:** Semua input user divalidasi untuk panjang, format, dan karakter yang diizinkan sebelum disimpan
5. **XSS Prevention:** Semua text input di-escape sebelum disimpan dan ditampilkan untuk mencegah XSS attack

### Liveness Properties

1. **Message Delivery:** Pesan yang berhasil disimpan ke database akan di-broadcast ke semua anggota room yang online dalam <300ms (p95)
2. **Auto-Reconnect:** Jika koneksi terputus, client akan otomatis mencoba reconnect dengan exponential backoff hingga 5 kali
3. **Message Recovery:** Setelah reconnect, semua pesan yang terlewat akan dimuat dan ditampilkan ke user
4. **Heartbeat Monitoring:** Sistem memeriksa heartbeat connection setiap 30 detik untuk deteksi connection yang terputus

## Error Handling

### Error Categories dan Response

#### 1. Validation Errors (400 Bad Request)

**Scenarios:**
- Email format tidak valid
- Password kurang dari 6 karakter
- Display name kurang dari 2 atau lebih dari 50 karakter
- Nama ruang sudah digunakan
- Pesan body kosong atau lebih dari 500 karakter

**Response Format:**
```json
{
  "error": "Display name harus antara 2-50 karakter",
  "field": "displayName",
  "code": "VALIDATION_ERROR"
}
```

**Handling Strategy:**
- Log dengan level Warning
- Return user-friendly error message
- Tidak retry (client harus fix input)

#### 2. Authentication Errors (401 Unauthorized)

**Scenarios:**
- JWT token expired atau invalid
- Email atau password salah saat login
- Token tidak dikirim pada endpoint yang memerlukan auth

**Response Format:**
```json
{
  "error": "Email atau password salah",
  "code": "AUTH_ERROR"
}
```

**Handling Strategy:**
- Log dengan level Warning (mencatat IP address)
- Return generic error untuk security (tidak spesifik email/password mana yang salah)
- Client harus re-login

#### 3. Authorization Errors (403 Forbidden)

**Scenarios:**
- User mencoba akses room yang bukan anggotanya
- User mencoba delete room yang bukan ownernya
- User mencoba akses Direct room milik user lain

**Response Format:**
```json
{
  "error": "Anda bukan anggota ruang ini",
  "code": "FORBIDDEN"
}
```

**Handling Strategy:**
- Log dengan level Warning (mencatat UserId dan resource yang diakses)
- Return error message yang jelas
- Tidak retry

#### 4. Rate Limit Errors (429 Too Many Requests)

**Scenarios:**
- Terlalu banyak login attempts (>5 dalam 15 menit)
- Terlalu banyak pesan dikirim (>10 dalam 1 menit)
- Terlalu banyak create room (>5 dalam 1 jam)

**Response Format:**
```json
{
  "error": "Terlalu banyak pesan. Tunggu sebentar.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30
}
```

**Handling Strategy:**
- Log dengan level Warning
- Return error dengan informasi retry-after
- Client harus tunggu sebelum retry

#### 5. Not Found Errors (404 Not Found)

**Scenarios:**
- Room ID tidak ditemukan
- User ID tidak ditemukan
- Message ID tidak ditemukan

**Response Format:**
```json
{
  "error": "Ruang tidak ditemukan",
  "code": "NOT_FOUND"
}
```

**Handling Strategy:**
- Log dengan level Information
- Return error message
- Tidak retry

#### 6. Server Errors (500 Internal Server Error)

**Scenarios:**
- Database connection error
- Unexpected exception
- EF Core transaction rollback
- SignalR broadcast error

**Response Format:**
```json
{
  "error": "Terjadi kesalahan server. Silakan coba lagi.",
  "code": "INTERNAL_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Handling Strategy:**
- Log dengan level Error (full stack trace, context)
- Return generic error message (tidak expose internal details)
- Include requestId untuk troubleshooting
- Client bisa retry dengan exponential backoff

#### 7. SignalR Hub Errors

**Scenarios:**
- User tidak terautentikasi saat hub method call
- User tidak memiliki akses ke room
- Rate limit exceeded untuk send message
- Message body validation error

**Error Handling:**
```csharp
public async Task SendMessage(Guid roomId, string text)
{
    try
    {
        var userId = GetCurrentUserId();
        
        // Check membership
        if (!await _roomService.IsMemberAsync(userId, roomId))
        {
            throw new HubException("Anda bukan anggota ruang ini");
        }
        
        // Check rate limit
        var rateLimitResult = await _rateLimiter.CheckLimitAsync(
            $"message:{userId}", 10, TimeSpan.FromMinutes(1));
        
        if (!rateLimitResult.IsAllowed)
        {
            throw new HubException($"Terlalu banyak pesan. Tunggu {rateLimitResult.ResetIn.TotalSeconds:F0} detik.");
        }
        
        // Save and broadcast
        var message = await _messageStore.SaveMessageAsync(roomId, userId, text);
        await Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", message);
    }
    catch (HubException)
    {
        // Re-throw HubException as-is (user-friendly error)
        throw;
    }
    catch (ValidationException ex)
    {
        // Convert validation error to HubException
        _logger.LogWarning(ex, "Validation error in SendMessage");
        throw new HubException(ex.Message);
    }
    catch (Exception ex)
    {
        // Log unexpected error and throw generic message
        _logger.LogError(ex, "Unexpected error in SendMessage for UserId: {UserId}, RoomId: {RoomId}", 
            GetCurrentUserId(), roomId);
        throw new HubException("Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.");
    }
}
```

### Client-Side Error Handling

#### Connection Errors

```javascript
connection.onclose(async (error) => {
    console.error('Connection closed:', error);
    
    // Attempt to reconnect
    await attemptReconnect();
});

async function attemptReconnect() {
    const delays = [1000, 2000, 4000, 8000, 16000, 30000];
    
    for (let i = 0; i < delays.length; i++) {
        try {
            showReconnectingUI(delays[i]);
            await new Promise(resolve => setTimeout(resolve, delays[i]));
            await connection.start();
            
            // Success - load missed messages
            hideReconnectingUI();
            await loadMissedMessages();
            return;
        } catch (err) {
            console.warn(`Reconnect attempt ${i + 1} failed:`, err);
        }
    }
    
    // All attempts failed
    showConnectionFailedUI();
}
```

#### API Call Errors

```javascript
async function apiCall(url, options) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            
            switch (response.status) {
                case 400:
                    showValidationError(errorData.error);
                    break;
                case 401:
                    // Token expired - redirect to login
                    redirectToLogin();
                    break;
                case 403:
                    showError('Anda tidak memiliki akses ke resource ini');
                    break;
                case 429:
                    showError(`${errorData.error} Tunggu ${errorData.retryAfter} detik.`);
                    break;
                case 500:
                    showError('Terjadi kesalahan server. Silakan coba lagi.');
                    // Optionally: retry with exponential backoff
                    break;
                default:
                    showError('Terjadi kesalahan. Silakan coba lagi.');
            }
            
            throw new Error(errorData.error);
        }
        
        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            // Network error
            showError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        }
        throw error;
    }
}
```

### Database Transaction Handling

```csharp
public async Task<Room> CreateRoomAsync(Guid userId, string name, string? description, RoomType type)
{
    using var transaction = await _db.Database.BeginTransactionAsync();
    
    try
    {
        // Check uniqueness
        var exists = await _db.Rooms.AnyAsync(r => r.Name.ToLower() == name.ToLower());
        if (exists)
        {
            throw new ValidationException("Nama ruang sudah digunakan");
        }
        
        // Create room
        var room = new Room
        {
            Id = Guid.NewGuid(),
            Name = name.ToLowerInvariant(),
            Description = description,
            Type = type,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow
        };
        
        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();
        
        // Add owner as member
        var member = new RoomMember
        {
            RoomId = room.Id,
            UserId = userId,
            Role = MemberRole.Owner,
            JoinedAt = DateTime.UtcNow
        };
        
        _db.RoomMembers.Add(member);
        await _db.SaveChangesAsync();
        
        await transaction.CommitAsync();
        
        _logger.LogInformation("Room created successfully. RoomId: {RoomId}, Name: {Name}, OwnerId: {OwnerId}",
            room.Id, room.Name, userId);
        
        return room;
    }
    catch (ValidationException)
    {
        await transaction.RollbackAsync();
        throw;
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        _logger.LogError(ex, "Error creating room. UserId: {UserId}, Name: {Name}", userId, name);
        throw;
    }
}
```

## Summary

Dokumen ini memberikan blueprint lengkap untuk implementasi aplikasi Ngariung, mencakup:

1. **Arsitektur sistem** dengan layer yang jelas (API, Hub, Service, Repository, Database)
2. **Model data** yang normalized dengan relasi dan constraint yang tepat
3. **Interface service** dengan method signature dan exception handling yang jelas
4. **REST API** dan **SignalR Hub** contract yang lengkap
5. **Algoritma kunci** untuk auto-reconnect, rate limiting, dan unread count
6. **Security design** dengan authentication, authorization, dan input sanitization
7. **Performance optimization** dengan indexing, SignalR groups, dan pagination
8. **Deployment design** dengan Docker dan database migration
9. **Logging dan monitoring** dengan structured logging
10. **Testing strategy** untuk unit dan integration tests
11. **Correctness properties** dengan invariants, consistency, safety, dan liveness guarantees
12. **Error handling** yang komprehensif untuk semua kategori error

Semua requirements telah dimapping ke komponen teknis yang spesifik dan implementable.
