// MU-Compass API Automated Test Suite
// This file contains Postman test scripts for automated API testing

// Common test functions
const TestHelpers = {
  // Validate response structure
  validateResponse: function (response, expectedKeys = []) {
    pm.test('Response has correct structure', function () {
      pm.expect(response).to.have.property('success');
      pm.expect(response).to.have.property('message');
      pm.expect(response).to.have.property('data');

      if (expectedKeys.length > 0) {
        expectedKeys.forEach((key) => {
          pm.expect(response.data).to.have.property(key);
        });
      }
    });
  },

  // Validate authentication response
  validateAuthResponse: function (response) {
    this.validateResponse(response, ['accessToken', 'refreshToken', 'user']);

    pm.test('Auth tokens are present', function () {
      pm.expect(response.data.accessToken).to.be.a('string');
      pm.expect(response.data.refreshToken).to.be.a('string');
      pm.expect(response.data.accessToken).to.have.length.above(10);
      pm.expect(response.data.refreshToken).to.have.length.above(10);
    });

    pm.test('User object is valid', function () {
      const user = response.data.user;
      pm.expect(user).to.have.property('id');
      pm.expect(user).to.have.property('email');
      pm.expect(user).to.have.property('firstName');
      pm.expect(user).to.have.property('lastName');
      pm.expect(user).to.have.property('role');
    });
  },

  // Validate user object structure
  validateUserObject: function (user) {
    pm.test('User object has required fields', function () {
      pm.expect(user).to.have.property('id');
      pm.expect(user).to.have.property('email');
      pm.expect(user).to.have.property('firstName');
      pm.expect(user).to.have.property('lastName');
      pm.expect(user).to.have.property('role');
      pm.expect(user).to.have.property('isActive');
      pm.expect(user).to.have.property('createdAt');
      pm.expect(user).to.have.property('updatedAt');
    });

    pm.test('Email follows Mansoura University format', function () {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@(std\.)?mans\.edu\.eg$/;
      pm.expect(user.email).to.match(emailRegex);
    });

    pm.test('Role is valid', function () {
      const validRoles = ['STUDENT', 'TA', 'PROFESSOR', 'ADMIN'];
      pm.expect(validRoles).to.include(user.role);
    });
  },

  // Validate pagination response
  validatePaginationResponse: function (response) {
    this.validateResponse(response, ['users', 'total', 'skip', 'take']);

    pm.test('Pagination data is valid', function () {
      pm.expect(response.data.users).to.be.an('array');
      pm.expect(response.data.total).to.be.a('number');
      pm.expect(response.data.skip).to.be.a('number');
      pm.expect(response.data.take).to.be.a('number');
      pm.expect(response.data.total).to.be.at.least(0);
    });
  },

  // Save tokens from auth response
  saveAuthTokens: function (response) {
    if (response.success && response.data) {
      pm.collectionVariables.set('accessToken', response.data.accessToken);
      pm.collectionVariables.set('refreshToken', response.data.refreshToken);

      if (response.data.user && response.data.user.id) {
        pm.collectionVariables.set('userId', response.data.user.id);
      }

      console.log('✅ Authentication tokens saved successfully');
    }
  },

  // Common status code tests
  testStatusCode: function (expectedCode = 200) {
    pm.test(`Status code is ${expectedCode}`, function () {
      pm.response.to.have.status(expectedCode);
    });
  },

  // Test response time
  testResponseTime: function (maxTime = 2000) {
    pm.test(`Response time is less than ${maxTime}ms`, function () {
      pm.expect(pm.response.responseTime).to.be.below(maxTime);
    });
  },
};

// Test scripts for different endpoints

// Authentication Tests
const AuthTests = {
  login: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    pm.test('Response is JSON', function () {
      pm.response.to.be.json;
    });

    if (pm.response.code === 200) {
      const response = pm.response.json();
      TestHelpers.validateAuthResponse(response);
      TestHelpers.saveAuthTokens(response);
    }
  },

  refreshToken: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    if (pm.response.code === 200) {
      const response = pm.response.json();
      TestHelpers.validateAuthResponse(response);
      TestHelpers.saveAuthTokens(response);
    }
  },

  getMe: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    if (pm.response.code === 200) {
      const response = pm.response.json();
      TestHelpers.validateResponse(response, ['id', 'email', 'firstName']);
      TestHelpers.validateUserObject(response.data);
    }
  },

  logout: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    pm.test('Logout successful', function () {
      const response = pm.response.json();
      pm.expect(response.success).to.be.true;
    });

    // Clear tokens after logout
    pm.collectionVariables.set('accessToken', '');
    pm.collectionVariables.set('refreshToken', '');
  },

  changePassword: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    pm.test('Password change successful', function () {
      const response = pm.response.json();
      pm.expect(response.success).to.be.true;
      pm.expect(response.message).to.include('password');
    });
  },
};

// User Management Tests
const UserTests = {
  getAllUsers: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    if (pm.response.code === 200) {
      const response = pm.response.json();
      TestHelpers.validatePaginationResponse(response);

      if (response.data.users.length > 0) {
        TestHelpers.validateUserObject(response.data.users[0]);
      }
    }
  },

  getUserById: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    if (pm.response.code === 200) {
      const response = pm.response.json();
      TestHelpers.validateResponse(response);
      TestHelpers.validateUserObject(response.data);
    }
  },

  createUser: function () {
    TestHelpers.testStatusCode(201);
    TestHelpers.testResponseTime();

    if (pm.response.code === 201) {
      const response = pm.response.json();
      TestHelpers.validateResponse(response);
      TestHelpers.validateUserObject(response.data);

      // Save created user ID for future tests
      pm.collectionVariables.set('createdUserId', response.data.id);
      console.log('✅ User created with ID:', response.data.id);
    }
  },

  updateUser: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    if (pm.response.code === 200) {
      const response = pm.response.json();
      TestHelpers.validateResponse(response);
      TestHelpers.validateUserObject(response.data);
    }
  },

  updateProfile: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    if (pm.response.code === 200) {
      const response = pm.response.json();
      TestHelpers.validateResponse(response);
      TestHelpers.validateUserObject(response.data);
    }
  },

  deleteUser: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    pm.test('User deletion successful', function () {
      const response = pm.response.json();
      pm.expect(response.success).to.be.true;
      pm.expect(response.message).to.include('deleted');
    });
  },

  activateUser: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    pm.test('User activation successful', function () {
      const response = pm.response.json();
      pm.expect(response.success).to.be.true;
      pm.expect(response.data.isActive).to.be.true;
    });
  },

  deactivateUser: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    pm.test('User deactivation successful', function () {
      const response = pm.response.json();
      pm.expect(response.success).to.be.true;
      pm.expect(response.data.isActive).to.be.false;
    });
  },

  resetPassword: function () {
    TestHelpers.testStatusCode(200);
    TestHelpers.testResponseTime();

    pm.test('Password reset successful', function () {
      const response = pm.response.json();
      pm.expect(response.success).to.be.true;
      pm.expect(response.message).to.include('reset');
    });
  },
};

// Export test functions for use in Postman requests
// Usage: Add to the "Tests" tab of your Postman requests
// Example: AuthTests.login();

module.exports = {
  TestHelpers,
  AuthTests,
  UserTests,
};
