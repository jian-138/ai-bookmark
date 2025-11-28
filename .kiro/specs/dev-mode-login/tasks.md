# Implementation Plan - Development Mode Login

- [x] 1. Configure build types and enable BuildConfig


  - Add buildConfigField to debug and release build types in app/build.gradle.kts
  - Set DEV_MODE_ENABLED to true for debug, false for release
  - Enable buildConfig feature in android block
  - _Requirements: 1.1, 1.2_



- [ ] 2. Create DevModeConfig object
  - Create DevModeConfig.kt in util package
  - Define test credentials constants (TEST_USERNAME, TEST_PASSWORD, TEST_USER_ID)
  - Implement isEnabled property that reads from BuildConfig
  - Implement isTestCredentials() validation function
  - Implement generateMockToken() function with proper prefix
  - _Requirements: 2.1, 2.2, 2.3_

- [x]* 2.1 Write property test for mock token generation


  - **Property 2: Mock token format consistency**
  - **Validates: Requirements 2.2, 2.5**

- [ ] 3. Enhance AuthRepositoryImpl with dev mode support
  - Add dev mode check at the beginning of login() method
  - Implement handleDevModeLogin() private method
  - Create mock LoginResponse with generated token and test user ID
  - Store mock token using existing TokenManager
  - Ensure non-test credentials fall through to normal authentication
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 3.1 Write property test for non-test credentials fallback
  - **Property 3: Non-test credentials fallback**
  - **Validates: Requirements 2.4**



- [ ]* 3.2 Write property test for authentication state equivalence
  - **Property 4: Authentication state equivalence**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 4. Update LoginScreen UI with dev mode features
  - Add conditional check for DevModeConfig.isEnabled
  - Add "使用测试账号" OutlinedButton with bug icon
  - Implement button click handler to populate username and password fields
  - Add "开发模式已启用" text indicator below button


  - Ensure button and indicator only appear when dev mode is enabled
  - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4_

- [ ]* 4.1 Write property test for UI visibility consistency
  - **Property 1: Dev mode UI visibility consistency**
  - **Validates: Requirements 1.3, 3.1, 3.4**

- [x] 5. Add ProGuard rules for dev mode code removal



  - Update proguard-rules.pro to ensure dev mode code is stripped in release builds
  - Add rules to remove DevModeConfig class in release builds
  - Verify release build doesn't contain dev mode strings
  - _Requirements: 1.2, 1.4_

- [ ]* 5.1 Write property test for logout behavior consistency
  - **Property 5: Logout behavior consistency**
  - **Validates: Requirements 4.4**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
