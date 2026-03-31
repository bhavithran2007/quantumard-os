# 🔥 Quantumard OS - Project Management System

## Complete Task Management Platform with Firebase

### ✨ Features

- **Authentication**: Email/Password login with Firebase Auth
- **Role-Based Access**: Admin, Manager, Employee roles
- **Projects Management**: Create and assign projects
- **Task Board**: Kanban-style task management (To Do, In Progress, Done)
- **User Profiles**: Photo upload, bio, password change
- **Notifications**: Real-time task assignments
- **PWA Ready**: Install as mobile/desktop app
- **Modern UI**: Glassmorphism design with gradient accents

### 🚀 Quick Start

#### 1. Firebase Setup (IMPORTANT)

Before using the app, you MUST enable Firebase services:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `quantumard-os`
3. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Click Save

4. **Create Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **production mode**
   - Choose a location
   - Update Firestore Rules:
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

5. **Enable Storage**:
   - Go to Storage
   - Click "Get Started"
   - Use default rules

6. **Enable Cloud Messaging** (Optional):
   - Go to Cloud Messaging
   - Generate a key pair

#### 2. Create Demo Users

After enabling Firebase Authentication, create these demo users manually in Firebase Console:

**Go to Authentication → Users → Add user**

1. **Admin User**
   - Email: `admin@quantumard.com`
   - Password: `admin123`
   - Then go to Firestore → Create document in `users` collection:
   ```json
   {
     "uid": "[copy from auth user]",
     "email": "admin@quantumard.com",
     "name": "Admin User",
     "role": "admin",
     "bio": "System Administrator",
     "createdAt": "2024-01-01T00:00:00.000Z",
     "status": "active"
   }
   ```

2. **Manager User**
   - Email: `manager@quantumard.com`
   - Password: `manager123`
   - Firestore document with `role: "manager"`

3. **Employee User**
   - Email: `employee@quantumard.com`
   - Password: `employee123`
   - Firestore document with `role: "employee"`

#### 3. Access the App

Visit: `https://task-manager-os-1.preview.emergentagent.com`

Login with:
- **Admin**: admin@quantumard.com / admin123
- **Manager**: manager@quantumard.com / manager123
- **Employee**: employee@quantumard.com / employee123

### 📱 Install as PWA

1. Visit the app in Chrome/Edge
2. Click the install icon in the address bar
3. App will be installed on your device

### 🎯 Usage Guide

#### Admin Functions
- Create projects
- Assign managers to projects
- Assign employees to projects
- View all tasks and projects
- Full system access

#### Manager Functions
- View assigned projects
- Create tasks
- Assign tasks to employees
- Track task progress
- Update task status

#### Employee Functions
- View assigned tasks
- Update task status (To Do → In Progress → Done)
- Manage profile

### 🎨 Design System

- **Colors**: Dark theme with orange/pink gradients
- **Fonts**: Syne (headings), DM Sans (body)
- **Effects**: Glassmorphism, animated backgrounds
- **Icons**: Font Awesome 6

### 🔐 Security

- All routes protected with authentication
- Role-based access control
- Firestore security rules
- Environment variables for sensitive data

### 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Custom CSS
- **Backend**: Firebase (Auth, Firestore, Storage, FCM)
- **UI Components**: ShadCN UI
- **Icons**: Font Awesome 6
- **PWA**: Service Worker, Web Manifest

### 📂 Project Structure

```
/app
├── app/
│   ├── dashboard/      # Main dashboard
│   ├── projects/       # Projects management
│   ├── tasks/          # Task board (Kanban)
│   ├── profile/        # User profile
│   └── login/          # Login page
├── components/
│   ├── Sidebar.js      # Navigation sidebar
│   └── Topbar.js       # Top navigation bar
├── context/
│   └── AuthContext.js  # Authentication context
├── lib/
│   └── firebase.js     # Firebase configuration
└── public/
    ├── manifest.json   # PWA manifest
    └── sw.js           # Service worker
```

### 🔄 Firestore Collections

- **users**: User profiles and roles
- **projects**: Project data with assignments
- **tasks**: Task details with status
- **notifications**: User notifications
- **dailyTasks**: Recurring daily tasks

### 🐛 Troubleshooting

**"Configuration not found" error**:
- Make sure Firebase Authentication is enabled
- Check that Firestore database is created
- Verify .env.local has correct Firebase credentials

**Can't login**:
- Ensure users are created in Firebase Console
- Check that user documents exist in Firestore
- Verify role field is set correctly

**Profile photo upload fails**:
- Enable Firebase Storage
- Check storage rules allow authenticated uploads

### 📝 Notes

- First time setup requires manual user creation in Firebase Console
- Each user MUST have a corresponding Firestore document with their role
- Make sure to set Firestore rules to allow authenticated access
- PWA installation works best in Chrome/Edge browsers

### 🎉 Next Steps

1. Enable Firebase services in Console
2. Create demo users
3. Login and explore!
4. Create your first project
5. Assign tasks to team members
6. Track progress on Kanban board

---

Built with ❤️ using Next.js and Firebase