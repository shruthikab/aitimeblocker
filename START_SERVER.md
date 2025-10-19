# 🚀 Starting the Development Server

## ✅ Quick Start (Fixed Permission Issue)

The dev server is **now configured** to run on `localhost` only, which bypasses macOS firewall restrictions.

```bash
npm run dev
```

Then open: **http://localhost:3000**

---

## 🔧 What Was Fixed

### The Problem
macOS was blocking Next.js from binding to `0.0.0.0:3000` due to firewall/security settings.

### The Solution
Changed the dev command to use `-H localhost` flag, which tells Next.js to only listen on localhost instead of all network interfaces.

**Updated in `package.json`:**
```json
"dev": "next dev -H localhost"
```

---

## 📝 Alternative Solutions

### If You Need Network Access (Other Devices)

If you want to access the app from other devices on your network (phone, tablet, etc.):

1. **Allow in macOS Firewall:**
   - Go to: System Preferences → Security & Privacy → Firewall
   - Click "Firewall Options"
   - Click the "+" button
   - Add `/usr/local/bin/node` (or wherever your Node.js is installed)
   - Allow incoming connections

2. **Then run:**
   ```bash
   npm run dev:network
   ```

3. **Access from other devices:**
   ```
   http://YOUR_IP_ADDRESS:3000
   ```

### Check Your Node Path
```bash
which node
# Example output: /usr/local/bin/node
```

---

## 🧪 Testing the Application

### 1. **Main Page** (http://localhost:3000)
- Import calendar step
- View events in grid
- Configure preferences
- Generate plan

### 2. **Plan Page** (http://localhost:3000/plan)
- Add tasks
- Generate optimal schedule
- Drag and drop to adjust

### 3. **Check Server Logs**
The terminal will show:
- Compile status
- API requests
- Errors (if any)

---

## ⚠️ Common Issues

### "Address already in use"
Another process is using port 3000.

**Solution:**
```bash
# Find what's using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Then start again
npm run dev
```

### "Module not found"
Missing dependencies.

**Solution:**
```bash
npm install
```

### "Permission denied" (still happening)
Node doesn't have permission.

**Solution:**
```bash
# Give Node permission (one-time)
sudo codesign --force --deep --sign - $(which node)

# Or run with sudo (not recommended for dev)
sudo npm run dev
```

---

## 🎯 Quick Test

1. **Server Running?**
   ```bash
   curl http://localhost:3000
   ```
   Should return HTML (not an error)

2. **Open Browser:**
   - Navigate to http://localhost:3000
   - You should see the PlayBlocks stepper interface

3. **Import a Calendar:**
   - Use `test-calendar.ics` from the project root
   - Or export one from Google Calendar/Apple Calendar

---

## 📊 What to Test

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

**Quick Checklist:**
- [ ] Upload .ics file ✅
- [ ] View calendar in grid ✅
- [ ] Save preferences ✅
- [ ] Generate plan ✅
- [ ] Drag/resize events ✅

---

## 🔗 Useful Links

- **Local Dev:** http://localhost:3000
- **Plan Page:** http://localhost:3000/plan
- **API Docs:** See TESTING_GUIDE.md
- **Architecture:** ARCHITECTURE.md

---

**The server is running now! Open http://localhost:3000 to get started! 🎉**

