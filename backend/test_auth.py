#!/usr/bin/env python3
"""
Test script for DawgPound user signup and login functionality.
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print('=' * 60)

def test_signup(username, email, password, first_name, last_name):
    """Test user signup endpoint."""
    print_section("Testing Signup")
    
    url = f"{BASE_URL}/users/signup/"
    data = {
        "username": username,
        "email": email,
        "password": password,
        "first_name": first_name,
        "last_name": last_name
    }
    
    print(f"POST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, json=data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            print("✅ Signup successful!")
            return True
        else:
            print("❌ Signup failed!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login(username, password):
    """Test user login endpoint."""
    print_section("Testing Login")
    
    url = f"{BASE_URL}/users/login/"
    data = {
        "username": username,
        "password": password
    }
    
    print(f"POST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, json=data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            return response.cookies
        else:
            print("❌ Login failed!")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_get_current_user(cookies):
    """Test getting current user profile."""
    print_section("Testing Get Current User")
    
    url = f"{BASE_URL}/users/me/"
    
    print(f"GET {url}")
    
    try:
        response = requests.get(url, cookies=cookies)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Get current user successful!")
            return True
        else:
            print("❌ Get current user failed!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_logout(cookies):
    """Test user logout endpoint."""
    print_section("Testing Logout")
    
    url = f"{BASE_URL}/users/logout/"
    
    print(f"POST {url}")
    
    try:
        response = requests.post(url, cookies=cookies)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Logout successful!")
            return True
        else:
            print("❌ Logout failed!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login_invalid_credentials():
    """Test login with invalid credentials."""
    print_section("Testing Login with Invalid Credentials")
    
    url = f"{BASE_URL}/users/login/"
    data = {
        "username": "nonexistent",
        "password": "wrongpassword"
    }
    
    print(f"POST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, json=data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 401:
            print("✅ Correctly rejected invalid credentials!")
            return True
        else:
            print("❌ Should have rejected invalid credentials!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    username = f"testuser_{timestamp}"
    email = f"test_{timestamp}@example.com"
    password = "testpass123"
    first_name = "Test"
    last_name = "User"
    
    print("\n" + "=" * 60)
    print("  DawgPound Backend - User Authentication Test")
    print("=" * 60)
    print(f"Test User: {username}")
    print(f"Email: {email}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Test 1: Signup
    results.append(("Signup", test_signup(username, email, password, first_name, last_name)))
    
    # Test 2: Login
    cookies = test_login(username, password)
    results.append(("Login", cookies is not None))
    
    if cookies:
        # Test 3: Get current user
        results.append(("Get Current User", test_get_current_user(cookies)))
        
        # Test 4: Logout
        results.append(("Logout", test_logout(cookies)))
    
    # Test 5: Invalid credentials
    results.append(("Invalid Login", test_login_invalid_credentials()))
    
    # Summary
    print_section("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed.")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)
