# Google Authentication & Duplicate Email Handling

## 🔐 How Duplicate Emails Are Handled

### Firebase's Built-in Protection
Firebase Auth automatically prevents duplicate accounts with the same email address. Here's how our enhanced system handles various scenarios:

## 📋 User Scenarios & Handling

### Scenario 1: Email/Password User → Google Sign-In
- **What happens**: Firebase automatically links the accounts
- **User experience**: Seamless sign-in, no issues
- **Result**: User keeps their original profile data

### Scenario 2: Existing Google Customer → "Register with Google"
- **What happens**: System detects existing customer account
- **User experience**: Automatically signed in (no duplicate account created)
- **Message**: "Existing customer - just sign them in"

### Scenario 3: Email/Password Account Exists → Someone Tries Google Register
- **What happens**: Firebase throws `auth/account-exists-with-different-credential`
- **User experience**: Clear error message
- **Message**: "An account with this email already exists. Please sign in with your email and password instead, or use the 'Sign In with Google' option."

### Scenario 4: Pharmacy Account Exists → Customer Google Register
- **What happens**: System checks role in Firestore
- **User experience**: Prevented with helpful message
- **Message**: "This email is associated with a pharmacy account. Please use pharmacy sign-in instead."

## 🛡️ Enhanced Error Handling

### Google-Specific Errors
- **Pop-up blocked**: "Pop-up was blocked by your browser. Please allow pop-ups and try again."
- **User cancelled**: "Google sign-in was cancelled. Please try again."
- **Network issues**: Standard network error handling

### Profile Data Management
- **New Google users**: Auto-create customer profile with location-based address
- **Existing users**: Preserve all existing profile data
- **Role validation**: Ensures customers can't accidentally access pharmacy accounts

## 🔄 Account Linking Flow

1. **Firebase Auth Level**: Prevents duplicate emails automatically
2. **Firestore Level**: Checks existing user profiles and roles  
3. **App Level**: Provides user-friendly feedback and appropriate navigation
4. **Location Integration**: Only applies to genuinely new Google customers

## ✅ Benefits

- **No Data Loss**: Existing user data is always preserved
- **Clear User Guidance**: Users get helpful error messages explaining what to do
- **Automatic Linking**: Email/password and Google accounts merge seamlessly
- **Role Security**: Customers can't accidentally access pharmacy features
- **Location Smart**: Only new customers get auto-location address

## 🧪 Testing Scenarios

To test the duplicate email handling:
1. Create an account with email/password
2. Try "Register with Google" using same email → Should get helpful error
3. Use "Sign in with Google" instead → Should link accounts seamlessly
4. Try registering as pharmacy with email, then customer Google → Should prevent with role message