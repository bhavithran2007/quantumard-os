# 🔥 Firebase Setup Guide for Quantumard OS

## Step-by-Step Firebase Configuration

### 1. Enable Firebase Authentication

1. Go to https://console.firebase.google.com/
2. Select project: **quantumard-os**
3. Click on **Authentication** in the left sidebar
4. Click **Get started** (if first time)
5. Go to **Sign-in method** tab
6. Click on **Email/Password**
7. **Enable** the toggle switch
8. Click **Save**

### 2. Create Firestore Database

1. Click on **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in production mode** (we'll update rules next)
4. Choose a location (select closest to your users)
5. Click **Enable**

### 3. Update Firestore Security Rules

1. In Firestore Database, go to the **Rules** tab
2. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // More specific rules (optional - uncomment if needed):
    // match /users/{userId} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null && request.auth.uid == userId;
    // }
    // 
    // match /projects/{projectId} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null;
    // }
    //
    // match /tasks/{taskId} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null;
    // }
  }
}
```

3. Click **Publish**

### 4. Enable Firebase Storage

1. Click on **Storage** in the left sidebar
2. Click **Get started**
3. Use the default security rules (or update them):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click **Done**

### 5. Create Demo Users

#### Method 1: Manual Creation in Firebase Console

**Admin User:**
1. Go to Authentication → Users
2. Click **Add user**
3. Email: `admin@quantumard.com`
4. Password: `admin123`
5. Click **Add user**
6. Copy the **User UID** (you'll need this)

7. Go to **Firestore Database**
8. Click **Start collection**
9. Collection ID: `users`
10. Document ID: Paste the User UID you copied
11. Add these fields:
```
Field Name: uid           Type: string    Value: [paste UID]
Field Name: email         Type: string    Value: admin@quantumard.com
Field Name: name          Type: string    Value: Admin User
Field Name: role          Type: string    Value: admin
Field Name: bio           Type: string    Value: System Administrator
Field Name: phone         Type: string    Value: +1 234 567 8900
Field Name: createdAt     Type: string    Value: 2024-01-01T00:00:00.000Z
Field Name: status        Type: string    Value: active
```

**Manager User:**
Repeat the process with:
- Email: `manager@quantumard.com`
- Password: `manager123`
- Role: `manager`
- Name: Deepak Singh

**Employee User:**
Repeat the process with:
- Email: `employee@quantumard.com`
- Password: `employee123`
- Role: `employee`
- Name: Arjun Developer

#### Method 2: Using Firebase Console Import (Easier for Multiple Users)

1. Download this CSV file structure:
```csv
uid,email,name,role,bio,phone,createdAt,status
[UID1],admin@quantumard.com,Admin User,admin,System Administrator,+1 234 567 8900,2024-01-01T00:00:00.000Z,active
[UID2],manager@quantumard.com,Deepak Singh,manager,Project Manager,+91 98765 43210,2024-01-01T00:00:00.000Z,active
[UID3],employee@quantumard.com,Arjun Developer,employee,Full Stack Developer,+91 87654 32109,2024-01-01T00:00:00.000Z,active
```

2. First create the auth users, get their UIDs
3. Replace [UID1], [UID2], [UID3] with actual UIDs
4. In Firestore, use the import feature to add users collection

### 6. Enable Cloud Messaging (Optional - for Push Notifications)

1. Click on **Cloud Messaging** in the left sidebar
2. Click **Get started**
3. Follow the prompts to enable FCM
4. Generate a new key pair if needed

### 7. Verify Configuration

1. All Firebase services should now show as **enabled**:
   - ✅ Authentication
   - ✅ Firestore Database
   - ✅ Storage
   - ✅ Cloud Messaging (optional)

2. Check that you have at least one user created in Authentication
3. Verify that corresponding user documents exist in Firestore `users` collection
4. Make sure each user document has the `role` field set correctly

## Testing Your Setup

### 1. Visit the App

Go to: https://task-manager-os-1.preview.emergentagent.com

### 2. Test Login

Try logging in with:
- **Admin**: admin@quantumard.com / admin123
- **Manager**: manager@quantumard.com / manager123
- **Employee**: employee@quantumard.com / employee123

### 3. Create Your First Project (as Admin)

1. Login as Admin
2. Go to **Projects**
3. Click **Create Project**
4. Fill in the details
5. Assign a manager and employees
6. Save

### 4. Create Tasks (as Manager or Admin)

1. Go to **Tasks**
2. Click **Create Task**
3. Select a project
4. Assign to an employee
5. Set a deadline
6. Save

### 5. Update Task Status (as Employee)

1. Login as Employee
2. Go to **Tasks**
3. You'll see the Kanban board
4. Move tasks between columns:
   - To Do
   - In Progress
   - Done

## Troubleshooting

### "Configuration not found" Error
**Solution**: Make sure Firebase Authentication is enabled in the console

### "Permission denied" Error
**Solution**: Update Firestore security rules to allow authenticated access

### Can't Login
**Solution**: 
1. Check that user exists in Authentication
2. Verify user document exists in Firestore with correct UID
3. Make sure `role` field is set in the user document

### Profile Photo Upload Fails
**Solution**: 
1. Enable Firebase Storage
2. Update storage rules to allow authenticated uploads
3. Check browser console for detailed error

### No Projects/Tasks Showing
**Solution**:
1. Make sure you're logged in with the correct role
2. Admin sees all data
3. Managers see their assigned projects
4. Employees see their assigned tasks

## Additional Configuration

### Email Verification (Optional)
1. Go to Authentication → Templates
2. Enable email verification
3. Customize the email template

### Password Reset (Optional)
1. Go to Authentication → Templates
2. Enable password reset
3. Customize the reset email

### Custom Domain (Optional)
1. Go to Authentication → Settings
2. Add authorized domains
3. Follow the verification steps

## Security Best Practices

1. ✅ Never share your Firebase config publicly
2. ✅ Use environment variables for sensitive data
3. ✅ Implement proper Firestore security rules
4. ✅ Enable 2FA for Firebase console access
5. ✅ Regularly review Firebase usage and logs
6. ✅ Set up budget alerts in Google Cloud Console

## Need Help?

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/
- Support: https://firebase.google.com/support

---

**Your Quantumard OS is now ready to use! 🎉**
