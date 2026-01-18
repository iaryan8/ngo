import requests
import sys
import json
from datetime import datetime
import uuid

class NGOAPITester:
    def __init__(self, base_url="https://pay-desktop-compat.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.user_token = None
        self.admin_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if token:
            test_headers['Authorization'] = f'Bearer {token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True, "No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    self.log_test(name, False, f"Status {response.status_code}: {error_data}")
                except:
                    self.log_test(name, False, f"Status {response.status_code}: {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"testuser_{uuid.uuid4().hex[:8]}@test.com"
        user_data = {
            "name": "Test User",
            "email": test_email,
            "password": "testpass123",
            "role": "user"
        }
        
        success, response = self.run_test(
            "User Registration", 
            "POST", 
            "auth/register", 
            201, 
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            self.test_user_id = response['user']['id']
            print(f"   User registered with ID: {self.test_user_id}")
        
        return success

    def test_user_login(self):
        """Test user login with existing admin credentials"""
        login_data = {
            "email": "admin@ngo.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login", 
            "POST", 
            "auth/login", 
            200, 
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin logged in successfully")
        
        return success

    def test_duplicate_registration(self):
        """Test duplicate email registration"""
        duplicate_data = {
            "name": "Duplicate User",
            "email": "admin@ngo.com",  # Use existing admin email
            "password": "testpass123",
            "role": "user"
        }
        
        return self.run_test(
            "Duplicate Email Registration", 
            "POST", 
            "auth/register", 
            400, 
            data=duplicate_data
        )

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        
        return self.run_test(
            "Invalid Login", 
            "POST", 
            "auth/login", 
            401, 
            data=invalid_data
        )

    def test_user_profile(self):
        """Test user profile retrieval"""
        if not self.user_token:
            self.log_test("User Profile", False, "No user token available")
            return False
        
        return self.run_test(
            "User Profile", 
            "GET", 
            "user/profile", 
            200, 
            token=self.user_token
        )

    def test_admin_dashboard(self):
        """Test admin dashboard access"""
        if not self.admin_token:
            self.log_test("Admin Dashboard", False, "No admin token available")
            return False
        
        success, response = self.run_test(
            "Admin Dashboard", 
            "GET", 
            "admin/dashboard", 
            200, 
            token=self.admin_token
        )
        
        if success:
            # Verify response structure
            required_fields = ['total_users', 'total_donations', 'total_amount', 'recent_registrations', 'recent_donations']
            for field in required_fields:
                if field not in response:
                    self.log_test("Admin Dashboard Structure", False, f"Missing field: {field}")
                    return False
            print(f"   Dashboard stats: {response['total_users']} users, {response['total_donations']} donations, ${response['total_amount']}")
        
        return success

    def test_unauthorized_admin_access(self):
        """Test admin access with user token"""
        if not self.user_token:
            self.log_test("Unauthorized Admin Access", False, "No user token available")
            return False
        
        return self.run_test(
            "Unauthorized Admin Access", 
            "GET", 
            "admin/dashboard", 
            403, 
            token=self.user_token
        )

    def test_donation_initialization(self):
        """Test donation initialization"""
        if not self.user_token:
            self.log_test("Donation Initialization", False, "No user token available")
            return False
        
        donation_data = {
            "amount": 50.00
        }
        
        # Add origin_url as query parameter
        success, response = self.run_test(
            "Donation Initialization", 
            "POST", 
            "donate/initialize?origin_url=https://pay-desktop-compat.preview.emergentagent.com", 
            200, 
            data=donation_data,
            token=self.user_token
        )
        
        if success:
            required_fields = ['checkout_url', 'session_id', 'donation_id']
            for field in required_fields:
                if field not in response:
                    self.log_test("Donation Response Structure", False, f"Missing field: {field}")
                    return False
            print(f"   Donation initialized with ID: {response['donation_id']}")
        
        return success

    def test_no_auth_endpoints(self):
        """Test endpoints that should fail without authentication"""
        endpoints = [
            ("user/profile", "GET"),
            ("admin/dashboard", "GET")
        ]
        
        all_passed = True
        for endpoint, method in endpoints:
            success, _ = self.run_test(
                f"No Auth - {endpoint}", 
                method, 
                endpoint, 
                401
            )
            if not success:
                all_passed = False
        
        return all_passed

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting NGO API Testing...")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)

        # Basic API tests
        self.test_health_check()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        self.test_duplicate_registration()
        self.test_invalid_login()
        
        # Authorization tests
        self.test_no_auth_endpoints()
        self.test_unauthorized_admin_access()
        
        # Functional tests
        self.test_user_profile()
        self.test_admin_dashboard()
        self.test_donation_initialization()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return 1

def main():
    tester = NGOAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())