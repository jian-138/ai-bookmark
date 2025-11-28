# Requirements Document

## Introduction

This feature adds a development mode to the AI Collector Android application, allowing developers to quickly test the app using predefined test credentials without needing to connect to a real backend server. This mode is only available in debug builds and provides a streamlined testing experience.

## Glossary

- **Development Mode**: A special mode available only in debug builds that allows login with test credentials
- **Test Credentials**: Predefined username and password combinations that bypass real authentication
- **Debug Build**: An Android build variant used for development and testing
- **Release Build**: An Android build variant intended for production distribution
- **Build Config**: Android build configuration that can define compile-time constants

## Requirements

### Requirement 1

**User Story:** As a developer, I want to enable development mode in debug builds, so that I can quickly test the app without setting up a real backend.

#### Acceptance Criteria

1. WHEN the app is built in debug mode THEN the system SHALL enable development mode functionality
2. WHEN the app is built in release mode THEN the system SHALL disable development mode functionality completely
3. WHEN development mode is enabled THEN the system SHALL provide a visual indicator on the login screen
4. WHEN a user attempts to access development mode features in release builds THEN the system SHALL prevent access

### Requirement 2

**User Story:** As a developer, I want to use predefined test credentials to login, so that I can test the app without needing real user accounts.

#### Acceptance Criteria

1. WHEN development mode is enabled THEN the system SHALL accept the test username "test" with password "test123"
2. WHEN test credentials are used for login THEN the system SHALL generate a mock authentication token
3. WHEN test credentials are used for login THEN the system SHALL assign a test user ID
4. WHEN invalid credentials are provided in development mode THEN the system SHALL still validate against the real backend
5. WHEN test login succeeds THEN the system SHALL store the mock token using the same mechanism as real authentication

### Requirement 3

**User Story:** As a developer, I want a quick-fill button for test credentials, so that I can login faster during testing.

#### Acceptance Criteria

1. WHEN development mode is enabled THEN the system SHALL display a "Use Test Account" button on the login screen
2. WHEN the "Use Test Account" button is clicked THEN the system SHALL populate the username field with "test"
3. WHEN the "Use Test Account" button is clicked THEN the system SHALL populate the password field with "test123"
4. WHEN development mode is disabled THEN the system SHALL hide the "Use Test Account" button

### Requirement 4

**User Story:** As a developer, I want development mode to work seamlessly with the rest of the app, so that I can test all features without modifications.

#### Acceptance Criteria

1. WHEN logged in with test credentials THEN the system SHALL allow access to all app features
2. WHEN logged in with test credentials THEN the system SHALL use the same navigation flow as real authentication
3. WHEN logged in with test credentials THEN the system SHALL maintain authentication state across app restarts
4. WHEN logout is triggered with test credentials THEN the system SHALL clear authentication state normally
