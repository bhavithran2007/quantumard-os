# ⚡ QUICK START - Quantumard OS

## 🚀 Your App is LIVE!

**URL**: https://task-manager-os-1.preview.emergentagent.com

---

## 🔥 URGENT: Setup Firebase (5 Minutes)

Your app is built but needs Firebase to work. Follow these simple steps:

### Step 1: Enable Firebase Authentication
1. Go to: https://console.firebase.google.com/
2. Select: **quantumard-os** project
3. Click **Authentication** → **Get started**
4. Enable **Email/Password** sign-in method
5. Click **Save**

### Step 2: Create Firestore Database
1. Click **Firestore Database**
2. Click **Create database**
3. Choose **Production mode**
4. Select a location
5. Click **Enable**

### Step 3: Update Firestore Rules
Click **Rules** tab and paste:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
Click **Publish**

### Step 4: Enable Storage
1. Click **Storage** → **Get started**
2. Use default rules
3. Click **Done**

### Step 5: Create Demo Users

**In Firebase Console → Authentication → Users:**

Create 3 users:
1. **Admin**: admin@quantumard.com / password: admin123
2. **Manager**: manager@quantumard.com / password: manager123  
3. **Employee**: employee@quantumard.com / password: employee123

**IMPORTANT**: After creating each user in Authentication:
1. Copy their **User UID**
2. Go to **Firestore Database** → Create collection `users`
3. Create a document with the UID as Document ID
4. Add these fields:

For Admin:
```
uid: [paste the UID]
email: admin@quantumard.com
name: Admin User
role: admin
bio: System Administrator
createdAt: 2024-01-01T00:00:00.000Z
status: active
```

Repeat for Manager (role: manager) and Employee (role: employee)

---

## ✅ Test Your App

1. Visit: https://task-manager-os-1.preview.emergentagent.com
2. Login with: **admin@quantumard.com** / **admin123**
3. Create a project
4. Create tasks
5. Assign to team members

---

## 📱 Install as Mobile App (PWA)

1. Open app in Chrome/Edge
2. Click install icon in address bar
3. App installs on your device!

---

## 🎯 Features

✅ **Role-Based Access**: Admin, Manager, Employee
✅ **Project Management**: Create and assign projects
✅ **Task Board**: Kanban-style (To Do, In Progress, Done)
✅ **User Profiles**: Upload photos, update info
✅ **Real-Time**: Instant notifications
✅ **PWA**: Works offline, installable
✅ **Beautiful UI**: Dark theme with gradients

---

## 📖 Full Documentation

- **README.md** - Complete project documentation
- **FIREBASE_SETUP.md** - Detailed Firebase setup guide

---

## 🆘 Need Help?

**Common Issues:**

1. **Can't login?**
   - Make sure user exists in Firebase Authentication
   - Verify user document exists in Firestore with correct role

2. **Permission denied?**
   - Update Firestore security rules
   - Make sure they allow authenticated access

3. **Profile photo won't upload?**
   - Enable Firebase Storage
   - Check storage rules

---

## 🎉 You're All Set!

Once Firebase is configured (5 min), your team can start using Quantumard OS immediately!

**Login → Create Projects → Assign Tasks → Track Progress**

Enjoy your new project management system! 🚀
