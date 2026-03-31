# 🔥 COMPLETE FIREBASE SETUP GUIDE

## YOUR FIREBASE PROJECT: quantumard-os

Since you mentioned you've created the Firebase database, follow these exact steps:

---

## STEP 1: Enable Authentication

1. Go to: https://console.firebase.google.com/project/quantumard-os
2. Click **Authentication** in left sidebar
3. Click **Get Started** (if not already enabled)
4. Go to **Sign-in method** tab
5. Click on **Email/Password**
6. Toggle it to **Enabled**
7. Click **Save**

✅ **Authentication is now ready!**

---

## STEP 2: Create Firestore Collections

### 2.1 Users Collection

1. Go to **Firestore Database**
2. Click **Start collection**
3. Collection ID: `users`
4. Click **Auto-ID** for first document
5. Add these fields to create first user (Admin):

```
uid: [the auto-generated ID]
email: admin@quantumard.com
name: Admin User
role: admin
bio: System Administrator  
phone: +1234567890
createdAt: 2024-01-01T00:00:00.000Z
status: active
```

6. Click **Save**

### 2.2 Projects Collection

1. Click **Start collection**
2. Collection ID: `projects`
3. You can leave it empty for now (will be created via app)

### 2.3 Tasks Collection

1. Click **Start collection**
2. Collection ID: `tasks`
3. Leave empty for now

### 2.4 Approvals Collection (NEW)

1. Click **Start collection**
2. Collection ID: `approvals`
3. Leave empty for now

### 2.5 Onboarding Collection (NEW)

1. Click **Start collection**
2. Collection ID: `onboarding`
3. Leave empty for now

### 2.6 Notifications Collection

1. Click **Start collection**
2. Collection ID: `notifications`
3. Leave empty for now

---

## STEP 3: Create Demo Users in Authentication

Go to **Authentication → Users → Add user**

Create these 4 users:

### 1. Admin User
- Email: `admin@quantumard.com`
- Password: `admin123`
- After creating, **copy the UID**
- Then go to Firestore → `users` collection → Create document with that UID
- Add all fields as shown in Step 2.1

### 2. Manager User
- Email: `manager@quantumard.com`
- Password: `manager123`
- Copy UID → Create Firestore document:

```
uid: [copied UID]
email: manager@quantumard.com
name: Deepak Singh
role: manager
bio: Project Manager
phone: +919876543210
createdAt: 2024-01-01T00:00:00.000Z
status: active
assignedClients: []
```

### 3. Employee User
- Email: `employee@quantumard.com`
- Password: `employee123`
- Copy UID → Create Firestore document:

```
uid: [copied UID]
email: employee@quantumard.com
name: Arjun Developer
role: employee
bio: Full Stack Developer
phone: +918765432109
createdAt: 2024-01-01T00:00:00.000Z
status: active
assignedProjects: []
```

### 4. Client User
- Email: `client@quantumard.com`
- Password: `client123`
- Copy UID → Create Firestore document:

```
uid: [copied UID]
email: client@quantumard.com
name: Rajesh Kumar
role: client
bio: CEO - TechLearn Academy
phone: +919999911111
company: TechLearn Academy
industry: EdTech
website: https://techlearn.com
onboardingComplete: false
assignedManager: null
createdAt: 2024-01-01T00:00:00.000Z
status: active
```

---

## STEP 4: Update Firestore Security Rules

1. Go to **Firestore Database → Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

---

## STEP 5: Enable Firebase Storage

1. Click **Storage** in left sidebar
2. Click **Get Started**
3. Accept default security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

4. Click **Done**

---

## STEP 6: Enable Cloud Messaging (Optional)

1. Click **Cloud Messaging** in left sidebar
2. Click **Get Started**
3. Follow prompts to enable FCM

---

## ✅ VERIFICATION CHECKLIST

After completing all steps, verify:

- [ ] Authentication is enabled with Email/Password
- [ ] 4 users exist in Authentication (admin, manager, employee, client)
- [ ] All 4 users have corresponding documents in `users` collection
- [ ] Each user document has the correct `role` field
- [ ] Firestore security rules are published
- [ ] Storage is enabled
- [ ] Collections exist: users, projects, tasks, approvals, onboarding, notifications

---

## 🧪 TEST YOUR SETUP

1. Visit: https://task-manager-os-1.preview.emergentagent.com
2. Login with: `admin@quantumard.com` / `admin123`
3. You should see the dashboard
4. Try creating a new user via the **Users** page (Admin only)
5. Test all roles by logging in with different accounts

---

## 📊 FIREBASE COLLECTIONS STRUCTURE

### `users` Collection
```javascript
{
  uid: string,
  email: string,
  name: string,
  role: 'admin' | 'manager' | 'employee' | 'client',
  bio: string,
  phone: string,
  createdAt: timestamp,
  status: 'active' | 'inactive',
  
  // Conditional fields
  profilePhoto?: string,
  company?: string (clients only),
  industry?: string (clients only),
  website?: string (clients only),
  onboardingComplete?: boolean (clients only),
  assignedManager?: string (clients only),
  assignedClients?: array (managers only),
  assignedProjects?: array (employees only)
}
```

### `projects` Collection
```javascript
{
  name: string,
  createdBy: string (uid),
  managerId: string (uid),
  assignedEmployees: array of uids,
  createdAt: timestamp
}
```

### `tasks` Collection
```javascript
{
  title: string,
  description: string,
  projectId: string,
  assignedTo: string (uid),
  assignedBy: string (uid),
  deadline: string,
  status: 'todo' | 'in_progress' | 'done',
  createdAt: timestamp
}
```

### `approvals` Collection (NEW)
```javascript
{
  clientId: string (uid),
  creativeType: 'ad-copy' | 'design' | 'landing-page',
  title: string,
  description: string,
  driveUrl: string,
  status: 'pending' | 'approved' | 'rejected',
  feedback: string,
  createdBy: string (uid),
  createdAt: timestamp,
  reviewedAt: timestamp
}
```

### `onboarding` Collection (NEW)
```javascript
{
  clientId: string (uid),
  sections: {
    overview: { completed: boolean },
    businessDetails: { completed: boolean, data: object },
    brandAssets: { completed: boolean, links: array },
    adAccounts: { completed: boolean, credentials: object },
    kickoffCall: { completed: boolean, callDetails: object }
  },
  progressPercentage: number (0-100),
  createdAt: timestamp,
  completedAt: timestamp
}
```

### `notifications` Collection
```javascript
{
  userId: string (uid),
  message: string,
  read: boolean,
  type: 'task_assigned' | 'project_update' | 'approval_request',
  createdAt: timestamp
}
```

---

## 🚨 IMPORTANT NOTES

1. **UID Matching**: The UID in Authentication MUST match the document ID in Firestore `users` collection
2. **Role Field**: Every user document MUST have a `role` field
3. **Security Rules**: Current rules allow all authenticated users to read/write. For production, implement stricter rules
4. **Demo Mode**: The app has fallback demo mode if Firebase isn't configured, but won't persist data

---

## 💡 TIPS

- Use Firebase Console's "Import" feature for bulk user creation
- Set up Firebase CLI for easier management: `npm install -g firebase-tools`
- Enable Firebase Analytics for usage tracking
- Set up backup schedules in Firebase Console

---

## Need Help?

- Firebase Docs: https://firebase.google.com/docs/firestore
- Firebase Console: https://console.firebase.google.com/project/quantumard-os
- Check app logs in browser console for detailed error messages

**Your Quantumard OS is ready to rock! 🚀**
