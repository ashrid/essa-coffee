# PostgreSQL Setup Guide for Ubuntu WSL

**Purpose:** Get PostgreSQL running for the ShopSeeds project on Windows Subsystem for Linux (Ubuntu).

---

## Step 1: Install PostgreSQL

```bash
# Update package lists
sudo apt update

# Install PostgreSQL and contrib packages
sudo apt install -y postgresql postgresql-contrib

# Verify installation
psql --version
```

**Expected output:** `psql (PostgreSQL) 14.x` (or higher)

---

## Step 2: Start PostgreSQL Service

```bash
# Start the PostgreSQL service
sudo service postgresql start

# Check status (should show "online")
sudo service postgresql status

# Enable auto-start on WSL login (optional but recommended)
sudo systemctl enable postgresql 2>/dev/null || echo "WSL doesn't use systemd, manual start required"
```

**Note:** WSL doesn't persist services across reboots. You'll need to run `sudo service postgresql start` each time you open a new WSL session, or add it to your `.bashrc`.

---

## Step 3: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql
```

In the PostgreSQL prompt (`postgres=#`):

```sql
-- Create database
CREATE DATABASE shopseeds;

-- Create user (choose your own password)
CREATE USER shopuser WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE shopseeds TO shopuser;

-- Exit
\q
```

---

## Step 4: Configure for Local Development

Edit PostgreSQL config to allow local connections:

```bash
# Edit pg_hba.conf (path may vary by version)
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Find these lines and ensure they exist:

```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256

# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256
```

Save (Ctrl+O, Enter, Ctrl+X) and restart:

```bash
sudo service postgresql restart
```

---

## Step 5: Create .env.local for the Project

In your project root:

```bash
cd /mnt/c/Users/force/.projects/shop-seeds
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://shopuser:your_secure_password@localhost:5432/shopseeds"

# NextAuth (generate with: openssl rand -hex 32)
NEXTAUTH_SECRET="your_generated_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Admin access
ADMIN_EMAIL="your-email@example.com"

# Resend (for emails - optional for now)
AUTH_RESEND_KEY="your_resend_api_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

---

## Step 6: Run Prisma Migrations

```bash
# Install dependencies (if not already done)
npm install

# Push schema to database (creates tables)
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database with sample data
npx prisma db seed
```

**Expected output:**
- Tables created: categories, products, orders, order_items, users, accounts, sessions, verification_tokens
- Sample categories and products inserted

---

## Step 7: Verify Setup

```bash
# Connect to database and list tables
psql $DATABASE_URL -c "\dt"

# Or check via Prisma
npx prisma studio
```

Prisma Studio will open at `http://localhost:5555` — you should see your tables with seed data.

---

## Step 8: Start Development Server

```bash
npm run dev
```

Visit:
- Store: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- Prisma Studio: `http://localhost:5555` (if running)

---

## Troubleshooting

### "could not connect to server: Connection refused"

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# If not running, start it
sudo service postgresql start
```

### "password authentication failed"

```bash
# Reset the password
sudo -u postgres psql -c "ALTER USER shopuser WITH PASSWORD 'new_password';"

# Update .env.local with new password
```

### "database 'shopseeds' does not exist"

```bash
sudo -u postgres createdb shopseeds
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE shopseeds TO shopuser;"
```

### Prisma: "P1001: Can't reach database server"

- Check `.env.local` DATABASE_URL format
- Ensure PostgreSQL is running: `sudo service postgresql start`
- Verify credentials: `psql postgresql://shopuser:password@localhost:5432/shopseeds`

### WSL: PostgreSQL not auto-starting

Add to `~/.bashrc`:

```bash
# Auto-start PostgreSQL
if ! pg_isready -q; then
    sudo service postgresql start >/dev/null 2>&1
fi
```

---

## Quick Reference Commands

```bash
# Start PostgreSQL
sudo service postgresql start

# Stop PostgreSQL
sudo service postgresql stop

# Restart PostgreSQL
sudo service postgresql restart

# Check status
sudo service postgresql status

# Connect to database
psql $DATABASE_URL

# View logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Reset database (DANGER: deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

---

## Next Steps

After PostgreSQL is running:

1. ✅ Database connected
2. ✅ Tables created
3. ✅ Seed data loaded
4. ⏭️ Execute Plan 01-02: Storefront UI

Run: `/gsd:execute-phase 01` to continue with the storefront.

---

*Created: 2026-02-17*
*For: ShopSeeds Phase 1 (Core MVP)*
