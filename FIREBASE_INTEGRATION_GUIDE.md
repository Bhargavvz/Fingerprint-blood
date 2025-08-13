# Firebase Integration Guide for BloodScan App

## 🔥 Complete Firebase Setup Guide

This guide provides step-by-step instructions to integrate your BloodScan app with Firebase for authentication and Firestore database.

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google account
- Node.js and npm installed

## 1. Firebase Project Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `bloodscan-production`
4. Enable Google Analytics (optional)
5. Create project

### Step 2: Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password** ✅
   - **Google** (optional) ✅
   - **Apple** (optional) ✅

### Step 3: Set up Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location (choose closest to your users)

### Step 4: Create Web App
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click web icon `</>`
4. Register app name: `BloodScan-Frontend`
5. Enable "Also set up Firebase Hosting" (optional)
6. Copy the configuration object

## 2. Frontend Configuration

### Step 1: Update Firebase Config
✅ **ALREADY CONFIGURED!** Your Firebase config is already set up in `/frontend/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyAzCNp73qi6gFbtb37iVCHYiTCP53ZdPyk",
  authDomain: "bloodscan-production.firebaseapp.com",
  projectId: "bloodscan-production",
  storageBucket: "bloodscan-production.firebasestorage.app",
  messagingSenderId: "913273310010",
  appId: "1:913273310010:web:b4ed81eecd43c00eff9e03",
  measurementId: "G-MRGH650D4H"
};
```

✅ **Firebase Analytics**: Analytics is enabled and configured for web platform.

### Step 2: Install Dependencies
All Firebase dependencies are already installed:
```bash
cd frontend
npm install  # Already includes firebase@10.14.1
```

### Step 3: Test Firebase Connection
1. Start the development server:
```bash
cd frontend
npm run dev
```
2. Open the app and try to register/login
3. Check Firebase Console > Authentication to see users

## 3. Backend Configuration

### Step 1: Set up Firebase Admin SDK
1. Go to Firebase Console > Project Settings
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Rename it to `firebase-service-account.json`
6. Place it in `/backend/` directory

### Step 2: Update Environment Variables
Update `/backend/.env`:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=bloodscan-production
FIREBASE_PRIVATE_KEY_ID=your-private-key-id-from-service-account
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bloodscan-production.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/oauth2/v1/certs?x5t={client_email}

# Firebase Service Account Path (alternative)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

### Step 3: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 4: Run Migrations and Start Backend
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

## 4. Firestore Security Rules

### Step 1: Set up Security Rules
Go to Firestore Database > Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Predictions are private to each user
    match /predictions/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Statistics are read-only for authenticated users
    match /statistics/{document} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write
    }
    
    // Public blood group information
    match /bloodGroups/{document} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## 5. Testing the Integration

### Frontend Testing
1. **Registration**: Try creating a new account
2. **Login**: Try signing in with existing credentials
3. **Data Sync**: Make predictions and check if they sync
4. **Offline Mode**: Test app functionality when offline

### Backend Testing
1. **API Health**: `GET http://localhost:8000/api/v1/health/`
2. **Authentication**: `POST http://localhost:8000/api/v1/auth/verify/`
3. **Predictions**: `POST http://localhost:8000/api/v1/predictions/predict/`

## 6. Production Deployment

### Frontend Deployment (Expo)
```bash
cd frontend
npm run build:web
npx expo export --platform web
```

### Backend Deployment (Docker)
```bash
cd backend
docker build -t bloodscan-backend .
docker run -p 8000:8000 bloodscan-backend
```

### Firebase Hosting (Optional)
```bash
cd frontend
firebase login
firebase init hosting
firebase deploy
```

## 7. Monitoring and Analytics

### Firebase Analytics
1. Enable Google Analytics in Firebase Console
2. Add analytics calls in your app:
```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();
logEvent(analytics, 'blood_group_predicted', {
  blood_group: result.bloodGroup,
  confidence: result.confidence
});
```

### Error Monitoring
Firebase Crashlytics is automatically configured for production builds.

## 8. Troubleshooting

### Common Issues

**1. "Firebase app not initialized"**
- Check if firebase config is correct
- Ensure all required fields are filled

**2. "Permission denied" in Firestore**
- Check security rules
- Verify user is authenticated

**3. "Network error" during authentication**
- Check internet connection
- Verify API keys are correct

**4. Backend can't authenticate Firebase tokens**
- Check service account configuration
- Verify GOOGLE_APPLICATION_CREDENTIALS path

### Debug Mode
Enable debug logging:
```typescript
// In firebase.ts
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';

if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(firestore, 'localhost', 8080);
}
```

## 9. Features Included

### ✅ Authentication
- Email/Password registration and login
- Password reset functionality
- Automatic token refresh
- Secure logout

### ✅ Database
- User profile management
- Prediction history storage
- Real-time data synchronization
- Offline data caching

### ✅ Security
- JWT token validation
- Firestore security rules
- API authentication middleware
- Data encryption

### ✅ Backend Integration
- Django REST API with Firebase Auth
- Machine learning model predictions
- User statistics and analytics
- Production-ready deployment

## 10. Next Steps

1. **Custom Claims**: Add user roles (admin, premium user)
2. **Push Notifications**: Implement FCM for app notifications
3. **File Storage**: Use Firebase Storage for image uploads
4. **Analytics**: Add detailed user behavior tracking
5. **A/B Testing**: Use Firebase Remote Config

## Support

For issues or questions:
1. Check Firebase Console logs
2. Check browser developer tools
3. Review Django logs in `backend/logs/`
4. Test with Firebase emulators for development

---

🎉 **Your BloodScan app is now fully integrated with Firebase!**
