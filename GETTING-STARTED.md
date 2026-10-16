# Getting Started - Ngariung Implementation

## Prerequisites

Sebelum memulai implementasi, pastikan tools berikut sudah terinstall:

### Required Tools

1. **.NET SDK 8.0 atau lebih baru**
   - Download: https://dotnet.microsoft.com/download
   - Verifikasi instalasi: `dotnet --version`
   - Minimum version: 8.0

2. **Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Verifikasi instalasi: `docker --version` dan `docker-compose --version`
   - Diperlukan untuk menjalankan PostgreSQL database

3. **Code Editor (Pilih salah satu)**
   - Visual Studio 2022 (Community Edition gratis)
   - Visual Studio Code dengan C# extension
   - JetBrains Rider

4. **Git**
   - Download: https://git-scm.com/downloads
   - Verifikasi: `git --version`

### Optional Tools

- **Postman** atau **Thunder Client** (VS Code extension) untuk testing API
- **Azure Data Studio** atau **pgAdmin** untuk PostgreSQL management
- **Node.js** (jika ingin menggunakan npm untuk frontend tooling)

---

## Installation Steps

### 1. Install .NET SDK

**Windows:**
```powershell
# Download installer dari https://dotnet.microsoft.com/download
# Atau menggunakan winget:
winget install Microsoft.DotNet.SDK.8

# Verifikasi instalasi
dotnet --version
```

**macOS:**
```bash
# Menggunakan Homebrew
brew install dotnet-sdk

# Verifikasi
dotnet --version
```

**Linux (Ubuntu/Debian):**
```bash
# Add Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Install .NET SDK
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0

# Verifikasi
dotnet --version
```

### 2. Install Docker Desktop

**Windows:**
1. Download Docker Desktop dari https://www.docker.com/products/docker-desktop
2. Jalankan installer
3. Restart komputer jika diminta
4. Buka Docker Desktop dan tunggu hingga Docker engine running
5. Verifikasi: `docker --version`

**macOS:**
1. Download Docker Desktop untuk Mac
2. Drag ke Applications folder
3. Jalankan Docker Desktop
4. Verifikasi: `docker --version`

**Linux:**
```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add user to docker group (agar tidak perlu sudo)
sudo usermod -aG docker $USER

# Logout dan login kembali
```

### 3. Verify All Tools

Jalankan command berikut untuk memastikan semua tools terinstall:

```powershell
# Check .NET SDK
dotnet --version
# Expected output: 8.0.x atau lebih tinggi

# Check Docker
docker --version
# Expected output: Docker version 24.x.x atau lebih tinggi

# Check Docker Compose
docker-compose --version
# Expected output: Docker Compose version v2.x.x atau lebih tinggi

# Check Git
git --version
# Expected output: git version 2.x.x
```

---

## Quick Start Guide

Setelah semua prerequisites terinstall, ikuti langkah berikut:

### Step 1: Create Project Structure

```powershell
# Buat folder proyek
mkdir Ngariung
cd Ngariung

# Buat solution dan project
dotnet new sln -n Ngariung
dotnet new webapi -n Ngariung.Api
dotnet sln add Ngariung.Api

# Buat struktur folder
cd Ngariung.Api
mkdir Controllers
mkdir Hubs
mkdir Services
mkdir Data
mkdir Data/Models
mkdir DTOs
```

### Step 2: Add Required NuGet Packages

```powershell
# Navigate ke project folder
cd Ngariung.Api

# Add Entity Framework Core
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

# Add ASP.NET Core Identity
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore

# Add JWT Authentication
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

# Add SignalR (sudah included di ASP.NET Core, tapi untuk client library nanti)
# SignalR sudah built-in di ASP.NET Core

# Verify packages installed
dotnet list package
```

### Step 3: Create Docker Compose Configuration

Create `docker-compose.yml` di root folder (Ngariung/):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ngariung-db
    environment:
      POSTGRES_DB: ngariung
      POSTGRES_USER: ngariung_user
      POSTGRES_PASSWORD: ngariung_password_123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ngariung-network

volumes:
  postgres_data:

networks:
  ngariung-network:
    driver: bridge
```

### Step 4: Start PostgreSQL Database

```powershell
# Start database container
docker-compose up -d

# Verify database is running
docker ps

# Check logs
docker-compose logs postgres
```

### Step 5: Configure Connection String

Edit `Ngariung.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=ngariung;Username=ngariung_user;Password=ngariung_password_123"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key-minimum-32-characters-long-for-security-ngariung-2026",
    "Issuer": "NgariungApp",
    "Audience": "NgariungClient",
    "ExpiryDays": 7
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

### Step 6: Test Run Application

```powershell
cd Ngariung.Api
dotnet run

# Expected output:
# info: Microsoft.Hosting.Lifetime[14]
#       Now listening on: http://localhost:5000
#       Now listening on: https://localhost:5001
```

Open browser: http://localhost:5000/swagger (untuk melihat API documentation)

---

## Next Steps

Setelah setup selesai, lanjutkan ke Task 2:

1. ✅ Task 1: Setup Proyek (DONE)
2. ⏭️ Task 2: Buat Entity Models dan Database Context
3. ⏭️ Task 3: Buat Database Migrations

---

## Troubleshooting

### .NET SDK tidak ditemukan

**Problem:** `dotnet: command not found`

**Solution:**
1. Pastikan .NET SDK sudah terinstall
2. Restart terminal/PowerShell
3. Verifikasi PATH environment variable

### Docker tidak bisa start

**Problem:** `Cannot connect to Docker daemon`

**Solution:**
1. Pastikan Docker Desktop sudah running
2. Windows: Cek di System Tray apakah Docker icon ada dan running
3. Linux: `sudo systemctl start docker`

### PostgreSQL port sudah digunakan

**Problem:** `port 5432 already allocated`

**Solution:**
1. Cek apakah ada PostgreSQL lain yang running: `netstat -an | findstr 5432`
2. Stop service lain atau ubah port di docker-compose.yml

### Package restore gagal

**Problem:** `error NU1101: Unable to find package`

**Solution:**
1. Clear NuGet cache: `dotnet nuget locals all --clear`
2. Restore ulang: `dotnet restore`
3. Pastikan internet connection stabil

---

## Development Workflow

### Daily Development

```powershell
# 1. Start database (jika belum running)
docker-compose up -d

# 2. Run application dengan hot reload
cd Ngariung.Api
dotnet watch run

# 3. Aplikasi akan auto-reload saat code berubah
```

### Stop Development

```powershell
# Stop aplikasi: Ctrl+C di terminal

# Stop database
docker-compose down

# Stop dan hapus volumes (WARNING: akan hapus data)
docker-compose down -v
```

### Database Management

```powershell
# Connect ke PostgreSQL via psql
docker exec -it ngariung-db psql -U ngariung_user -d ngariung

# Backup database
docker exec ngariung-db pg_dump -U ngariung_user ngariung > backup.sql

# Restore database
docker exec -i ngariung-db psql -U ngariung_user ngariung < backup.sql
```

---

## Additional Resources

- **.NET Documentation:** https://docs.microsoft.com/en-us/dotnet/
- **ASP.NET Core Documentation:** https://docs.microsoft.com/en-us/aspnet/core/
- **SignalR Documentation:** https://docs.microsoft.com/en-us/aspnet/core/signalr/
- **Entity Framework Core:** https://docs.microsoft.com/en-us/ef/core/
- **Docker Documentation:** https://docs.docker.com/

---

## Contact & Support

Jika mengalami kesulitan:
1. Cek documentation di folder `.kiro/specs/ngariung/`
2. Review PRD untuk context requirements
3. Lihat design document untuk architecture decisions

Good luck with implementation! 🚀
