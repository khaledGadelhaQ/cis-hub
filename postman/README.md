# MU-Compass API Postman Collection

This folder contains the complete Postman collection, environments, and test suites for the comprehensive MU-Compass university platform API.

## 🌟 **Platform Capabilities**

The MU-Compass Postman collection will eventually cover all aspects of the university platform:

### 🔐 **Authentication & Security**
- User authentication (login, logout, token management)
- Role-based access control (Student, TA, Professor, Admin)
- Email verification and password reset workflows
- Multi-factor authentication and session management

### 👥 **User & Identity Management**
- Student, faculty, and staff profile management
- Avatar uploads and personal information
- Department and college organization
- User role assignments and permissions

### 🎓 **Academic Management**
- Course creation and management
- Student enrollment and class rosters
- Academic year and semester tracking
- Grade and transcript management

### 📚 **Course Content & Materials**
- Lecture materials and resources upload
- Assignment creation and submission
- Reading lists and bibliography management
- Multimedia content handling

### 📝 **Assessment & Assignments**
- Assignment creation with due dates
- Student submission workflows
- Grading and feedback systems
- Plagiarism detection integration

### 💬 **Communication & Collaboration**
- Direct messaging between users
- Course discussion forums
- Announcement systems
- Group chat functionality

### 🔔 **Notifications & Alerts**
- Real-time notification delivery
- Email and in-app notifications
- Assignment reminders and deadlines
- System announcements

### 📅 **Scheduling & Calendar**
- Class schedule management
- Exam scheduling and venues
- Office hours and appointments
- Academic calendar integration

### 📊 **Analytics & Reporting**
- Student performance analytics
- Course engagement metrics
- Attendance tracking
- Administrative reports

### 📁 **File Management**
- Document upload and storage
- File sharing and permissions
- Version control for documents
- Media file handling

### 🏛️ **Administrative Tools**
- Department management
- Faculty administration
- Student records management
- System configuration

*Note: Currently implemented endpoints focus on authentication and user management. Additional modules will be added progressively.*

## 📁 Folder Structure

```
postman/
├── collections/
│   └── MU-Compass-API.postman_collection.json
├── environments/
│   ├── development.postman_environment.json
│   ├── staging.postman_environment.json
│   └── production.postman_environment.json
├── tests/
│   └── api-test-suite.js
└── README.md
```

## 🚀 Quick Start

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import the collection: `collections/MU-Compass-API.postman_collection.json`
4. Import the appropriate environment:
   - Development: `environments/development.postman_environment.json`
   - Staging: `environments/staging.postman_environment.json`
   - Production: `environments/production.postman_environment.json`

### 2. Select Environment

1. In Postman, select the imported environment from the dropdown (top-right)
2. For development, ensure your NestJS server is running on `http://localhost:3000`

### 3. Authentication Flow

1. **Login**: Use the "Login" request in the "🔐 Authentication" folder
   - Default credentials are set in environment variables
   - Tokens will be automatically saved to environment variables
2. **Test Authentication**: Use "Get Me" to verify your session
3. **Logout**: Use "Logout" or "Logout All Devices" when done

## 📋 Collection Overview

### 🔐 Authentication
- **Login**: Authenticate and get access/refresh tokens
- **Refresh Token**: Get new tokens using refresh token
- **Get Me**: Get current user profile
- **Logout**: Logout from current device
- **Logout All Devices**: Logout from all devices
- **Change Password**: Change user password

### 👤 User Profile
- **Update My Profile**: Update current user's profile
- **Upload Avatar**: Upload profile picture (file upload)

### 👥 User Management (Admin Only)
- **Get All Users**: List users with filtering and pagination
- **Get User by ID**: Get specific user details
- **Create User**: Create new user (admin only)
- **Update User**: Update user details (admin only)
- **Delete User**: Soft delete user (admin only)
- **Activate/Deactivate User**: Change user status
- **Reset User Password**: Reset user password to collegeId

### 📧 Email Verification
- **Send Verification Email**: Send OTP for email verification
- **Verify Email**: Verify email with OTP

### 🔑 Password Reset
- **Send Password Reset Email**: Send reset token via email
- **Reset Password**: Reset password using token

## 🧪 Automated Testing

### Using Built-in Tests

Each request includes pre-written test scripts that automatically:
- Validate response status codes
- Check response structure
- Validate data types and formats
- Save authentication tokens
- Test response times

### Running Test Suite

1. **Individual Tests**: Tests run automatically with each request
2. **Collection Runner**: 
   - Click on collection name → "Run collection"
   - Select environment and requests to test
   - Click "Run MU-Compass API"

### Custom Test Scripts

Use the test functions from `tests/api-test-suite.js`:

```javascript
// In Postman Tests tab
AuthTests.login();        // For login requests
UserTests.getAllUsers();  // For user listing
TestHelpers.validateResponse(pm.response.json()); // Custom validation
```

## 🌍 Environment Variables

### Development Environment
- **baseUrl**: `http://localhost:3000/api`
- **adminEmail**: `admin@mans.edu.eg`
- **studentEmail**: `student@std.mans.edu.eg`
- Default passwords included for testing

### Staging/Production Environments
- **baseUrl**: Configured for deployed API endpoints
- **Passwords**: Empty for security (set manually)

### Dynamic Variables
- **accessToken**: JWT access token (auto-saved)
- **refreshToken**: JWT refresh token (auto-saved)
- **userId**: Current user ID (auto-saved)
- **createdUserId**: ID of newly created users (for testing)

## 🔒 Security Best Practices

### Development
- Use the development environment for local testing
- Default credentials are for testing only

### Staging/Production
- Never commit real passwords to version control
- Set sensitive environment variables manually in Postman
- Use HTTPS endpoints only
- Regularly rotate test credentials

## 📊 Request Examples

### Authentication
```bash
# Login
POST /api/auth/login
{
  "email": "student@std.mans.edu.eg",
  "password": "password123"
}

# Get current user
GET /api/auth/me
Authorization: Bearer {accessToken}
```

### User Management
```bash
# Get users with filters
GET /api/users?skip=0&take=20&search=john&role=STUDENT&isActive=true

# Create user (admin only)
POST /api/users/create
{
  "email": "newstudent@std.mans.edu.eg",
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "collegeId": "202012345",
  "role": "STUDENT"
}
```

## 🔄 Sync with Git

### Manual Sync
1. Export updated collections from Postman
2. Replace files in this folder
3. Commit changes to Git

### Automated Sync (Recommended)
1. Use Postman API or CLI tools
2. Set up GitHub Actions for sync
3. Use Postman's Git integration (if available)

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if access token is valid
   - Try refreshing token or re-login

2. **403 Forbidden**
   - Verify user has required role/permissions
   - Check if admin endpoints are being accessed by non-admin users

3. **404 Not Found**
   - Verify baseUrl in environment
   - Check if API server is running
   - Confirm endpoint paths are correct

4. **Validation Errors**
   - Check request body format
   - Verify email follows Mansoura format
   - Ensure required fields are included

### Environment Issues

1. **Wrong Environment Selected**
   - Check environment dropdown in Postman
   - Verify baseUrl matches your setup

2. **Missing Variables**
   - Import the correct environment file
   - Set required passwords manually for staging/production

## 📝 Contributing

When adding new endpoints:
1. Add request to appropriate folder in collection
2. Include test scripts using the test suite functions
3. Update environment variables if needed
4. Document new endpoints in this README
5. Export and commit updated collection file

### Git Best Practices
- The `node_modules/` directory is automatically ignored
- Test reports in `reports/` are ignored by Git
- Only commit source files: collections, environments, scripts, tests
- Run `npm run validate` before committing changes

### Cleaning Dependencies
```bash
# Clean and reinstall dependencies
npm run clean

# Check if .gitignore is working properly
npm run check-gitignore
```

## 📞 Support

For issues with the API collection:
1. Check this README for common solutions
2. Verify your environment setup
3. Test with the development environment first
4. Check API server logs for errors

---

**Last Updated**: June 2025
**API Version**: v1.0
**Postman Version**: v10.x compatible
