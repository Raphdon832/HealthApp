# Google Authentication Troubleshooting Guide

## 🔍 **Debugging Google Auth Issues**

### 🚀 **Quick Debug Steps**

1. **Add debug parameter to URL**: Add `?debugGoogleAuth=1` to any auth page URL
2. **Check browser console**: Look for detailed error messages and configuration info
3. **Verify Firebase setup**: Ensure all environment variables are correctly set

### ⚠️ **Common Issues & Solutions**

#### **Issue 1: "Sign in failed. Please try again"**
**Possible Causes:**
- Firebase project not configured for Google Auth
- Missing or incorrect environment variables
- Google Auth not enabled in Firebase Console

**Solutions:**
1. **Check Firebase Console:**
   - Go to Authentication → Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains

2. **Verify Environment Variables:**
   ```bash
   # Check .env file has:
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

3. **Check Console Logs:**
   - Look for specific Firebase error codes
   - Common codes: `auth/configuration-not-found`, `auth/internal-error`

#### **Issue 2: Popup Closes Immediately**
**Possible Causes:**
- Pop-up blocked by browser
- Domain not authorized in Firebase
- CORS issues

**Solutions:**
1. **Allow popups** in browser settings for your domain
2. **Add domain to Firebase:**
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add `localhost`, `127.0.0.1`, and your production domain

3. **Check browser console** for CORS errors

#### **Issue 3: Firebase Configuration Errors**
**Error Codes:**
- `auth/configuration-not-found`: Google Auth not configured
- `auth/internal-error`: Invalid Firebase config
- `auth/network-request-failed`: Connection issues

**Solutions:**
1. **Download fresh config** from Firebase Console
2. **Verify project ID** matches your Firebase project
3. **Check internet connection** and Firebase status

### 🔧 **Firebase Console Setup**

#### **Step 1: Enable Google Authentication**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Authentication → Sign-in method
4. Click on Google
5. Enable Google sign-in
6. Add your email as a test user (optional)

#### **Step 2: Configure Authorized Domains**
1. In Authentication → Settings → Authorized domains
2. Add these domains:
   - `localhost` (for development)
   - `127.0.0.1` (for local testing)
   - Your production domain (e.g., `yourapp.com`)

#### **Step 3: Set OAuth Consent Screen**
1. Go to Google Cloud Console
2. Select your project
3. Go to APIs & Services → OAuth consent screen
4. Fill in app information:
   - App name
   - User support email
   - Developer contact information
5. Add test users (for testing phase)

### 📱 **Browser-Specific Issues**

#### **Safari (iOS/macOS)**
- **Issue**: Popup blocking is aggressive
- **Solution**: 
  - Disable popup blocking for your domain
  - Use `prompt: 'select_account'` in provider config (already added)

#### **Chrome**
- **Issue**: Third-party cookies blocked
- **Solution**: 
  - Ensure Firebase domain is in allowed cookies
  - Check incognito mode restrictions

#### **Firefox**
- **Issue**: Enhanced tracking protection
- **Solution**: 
  - Disable tracking protection for Firebase domains
  - Check privacy settings

### 🧪 **Testing Steps**

#### **Development Testing**
1. **Local development**: 
   ```bash
   npm run dev
   # Navigate to http://localhost:5173/auth/customer/signin?debugGoogleAuth=1
   ```

2. **Check console output**:
   - Look for "🔍 Google Auth Configuration Diagnostic"
   - Verify all config items show ✅

3. **Test Google sign-in**:
   - Click Google sign-in button
   - Should see console logs for each step
   - Any errors will be detailed in console

#### **Production Testing**
1. **Deploy to production**
2. **Add production domain** to Firebase authorized domains
3. **Test with real users**
4. **Monitor Firebase console** for auth events

### 🔄 **Error Recovery**

#### **If Sign-In Keeps Failing:**
1. **Clear browser data** (cookies, local storage)
2. **Try incognito/private mode**
3. **Test different browser**
4. **Check Firebase project quota** (free tier limits)

#### **If Registration Fails:**
1. **Check Firestore rules** allow user creation
2. **Verify user data structure** matches expected format
3. **Check network connectivity**
4. **Monitor Firebase console** for write errors

### 📊 **Debug Information Available**

When you add `?debugGoogleAuth=1` to URL, you'll see:

- ✅/❌ Firebase API Key status
- ✅/❌ Auth Domain status  
- ✅/❌ Project ID status
- Current hostname and protocol
- Browser type and potential restrictions
- Environment (dev/production)

### 🆘 **Getting Help**

If Google Auth still isn't working:

1. **Check browser console** for specific error codes
2. **Share error codes** when seeking help
3. **Verify Firebase project settings** match configuration
4. **Test with different browsers/devices**
5. **Check Firebase status page** for service issues

### 📋 **Checklist Before Reporting Issues**

- [ ] Google Auth enabled in Firebase Console
- [ ] Authorized domains include your domain
- [ ] Environment variables are correct
- [ ] Browser allows popups
- [ ] Console shows detailed error messages
- [ ] Tested in different browsers
- [ ] Firebase project has remaining quota

**Remember**: Google Auth requires proper Firebase configuration. Most issues are configuration-related, not code issues!