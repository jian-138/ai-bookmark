# Implementation Plan

- [x] 1. Set up project structure and dependencies


  - Configure Gradle build files with required dependencies (Hilt, Retrofit, Room, Compose, Kotest)
  - Set up Hilt dependency injection framework
  - Configure ProGuard rules for release builds
  - Set up network security configuration for HTTPS
  - _Requirements: 9.1_

- [x] 2. Implement data models and database layer


  - Create domain models (CollectionItem, CollectionRequest, CollectionResponse, LoginRequest, LoginResponse)
  - Create Room database entities (CollectionEntity, PendingCollectionEntity)
  - Implement Room DAOs for database operations
  - Create data mappers between entities and domain models
  - _Requirements: 4.1, 4.2, 3.2_

- [x] 2.1 Write property test for data model mapping


  - **Property: Round trip consistency for entity-to-model conversion**
  - **Validates: Requirements 4.2**

- [x] 3. Implement network layer



  - Create Retrofit ApiService interface with all endpoints
  - Implement AuthInterceptor for adding authentication tokens to requests
  - Configure OkHttp client with logging and timeout settings
  - Create NetworkRepository for API communication
  - Implement request/response error handling
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 9.1_

- [x] 3.1 Write property test for network request authentication


  - **Property 6: Network request completeness**
  - **Validates: Requirements 3.1, 3.5**

- [x] 3.2 Write property test for HTTPS protocol usage


  - **Property 28: HTTPS protocol usage**
  - **Validates: Requirements 9.1**

- [x] 4. Implement security and encryption layer


  - Set up Android Keystore for secure token storage
  - Implement encryption utilities using AES-256
  - Create SecurePreferences wrapper for encrypted data storage
  - Implement credential logging prevention in logging framework
  - _Requirements: 9.2, 9.3, 9.5_

- [x] 4.1 Write property test for data encryption


  - **Property 29: Data encryption**
  - **Validates: Requirements 9.3**

- [x] 4.2 Write property test for credential logging prevention


  - **Property 30: Credential logging prevention**
  - **Validates: Requirements 9.5**

- [x] 5. Implement offline queue and caching mechanism



  - Create PendingCollectionQueue for offline data storage
  - Implement cache manager with size limits
  - Create sync worker using WorkManager for background sync
  - Implement network connectivity monitoring
  - _Requirements: 3.2, 8.4_

- [x] 5.1 Write property test for offline queueing


  - **Property 7: Offline queueing**
  - **Validates: Requirements 3.2**

- [x] 5.2 Write property test for cache size limits


  - **Property 26: Cache size limits**
  - **Validates: Requirements 8.4**

- [x] 6. Implement authentication repository and use cases



  - Create AuthRepository for login/logout operations
  - Implement LoginUseCase with token storage
  - Implement LogoutUseCase with data clearing
  - Create TokenManager for token expiration handling
  - Implement user session state management
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6.1 Write property test for authentication token storage

  - **Property 18: Authentication token storage**
  - **Validates: Requirements 6.2**

- [x] 6.2 Write property test for token expiration handling

  - **Property 19: Token expiration handling**
  - **Validates: Requirements 6.3**

- [x] 6.3 Write property test for logout data clearing

  - **Property 20: Logout data clearing**
  - **Validates: Requirements 6.4**

- [x] 7. Implement collection repository and use cases



  - Create CollectionRepository implementation
  - Implement SubmitCollectionUseCase with text validation
  - Implement GetCollectionsUseCase with pagination
  - Implement SearchCollectionsUseCase with filtering
  - Implement DeleteCollectionUseCase
  - _Requirements: 2.5, 3.1, 4.1, 4.3, 5.1, 5.2, 5.3, 10.2_

- [x] 7.1 Write property test for whitespace input rejection

  - **Property 5: Whitespace input rejection**
  - **Validates: Requirements 2.5**

- [x] 7.2 Write property test for filter logic

  - **Property 14: Category filter accuracy**
  - **Property 15: Filter combination logic**
  - **Validates: Requirements 5.2, 5.3**

- [x] 7.3 Write property test for deletion API call

  - **Property 32: Deletion API call**
  - **Validates: Requirements 10.2**

- [x] 8. Implement foreground service for background operation


  - Create CollectorForegroundService with notification
  - Implement service lifecycle management
  - Create notification channel for service status
  - Implement boot receiver for auto-start after device restart
  - Handle battery optimization whitelist request
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 8.1 Write property test for service lifecycle

  - **Property 1: Service lifecycle consistency**
  - **Validates: Requirements 1.1, 1.3, 1.5**

- [x] 9. Implement overlay service and text capture



  - Create OverlayService for floating button
  - Implement floating button UI with drag functionality
  - Create TextCaptureManager using Accessibility Service
  - Implement text selection mode activation
  - Handle overlay permission request
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 9.1 Write property test for permission-based UI

  - **Property 2: Permission-based UI availability**
  - **Validates: Requirements 1.4, 2.1**

- [x] 9.2 Write property test for text selection activation

  - **Property 3: Text selection activation**
  - **Validates: Requirements 2.2**

- [x] 9.3 Write property test for text capture

  - **Property 4: Text capture and confirmation**
  - **Validates: Requirements 2.4**

- [ ] 10. Implement LoginViewModel and login screen
  - Create LoginViewModel with login state management
  - Implement login screen UI with Compose
  - Add form validation for username and password
  - Handle login success and error states
  - Implement navigation to main screen after login
  - _Requirements: 6.1, 6.2, 7.3, 7.4_

- [ ] 10.1 Write property test for unauthenticated initial state
  - **Property 17: Unauthenticated initial state**
  - **Validates: Requirements 6.1**

- [ ] 11. Implement CollectionListViewModel and collection list screen
  - Create CollectionListViewModel with collection state
  - Implement collection list screen UI with LazyColumn
  - Add pull-to-refresh functionality
  - Implement pagination with scroll detection
  - Display loading indicators and error states
  - Handle empty state display
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 7.3, 7.4_

- [ ] 11.1 Write property test for collection list data fetching
  - **Property 9: Collection list data fetching**
  - **Validates: Requirements 4.1**

- [ ] 11.2 Write property test for collection item completeness
  - **Property 10: Collection item completeness**
  - **Validates: Requirements 4.2**

- [ ] 11.3 Write property test for pagination trigger
  - **Property 11: Pagination trigger**
  - **Validates: Requirements 4.3**

- [ ] 12. Implement collection detail screen
  - Create CollectionDetailViewModel
  - Implement detail screen UI showing full text and AI analysis
  - Add navigation from list to detail screen
  - Display keywords as chips
  - Show category and timestamp
  - _Requirements: 4.4_

- [ ] 12.1 Write property test for detail navigation
  - **Property 12: Detail navigation**
  - **Validates: Requirements 4.4**

- [ ] 13. Implement search and filter functionality
  - Add search bar to collection list screen
  - Implement search query handling in ViewModel
  - Create category filter UI with chips
  - Implement keyword highlighting in search results
  - Handle empty search results state
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 13.1 Write property test for search request transmission
  - **Property 13: Search request transmission**
  - **Validates: Requirements 5.1**

- [ ] 13.2 Write property test for keyword highlighting
  - **Property 16: Keyword highlighting**
  - **Validates: Requirements 5.4**

- [ ] 14. Implement collection item actions
  - Add long-press gesture detection on collection items
  - Create action menu with delete option
  - Implement delete confirmation dialog
  - Handle successful deletion with UI update
  - Handle failed deletion with error message
  - Implement undo functionality with Snackbar
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14.1 Write property test for long press action menu
  - **Property 31: Long press action menu**
  - **Validates: Requirements 10.1**

- [ ] 14.2 Write property test for deletion UI updates
  - **Property 33: Successful deletion UI update**
  - **Property 34: Failed deletion handling**
  - **Validates: Requirements 10.3, 10.4**

- [ ] 14.3 Write property test for undo availability
  - **Property 35: Undo availability**
  - **Validates: Requirements 10.5**

- [ ] 15. Implement response notification system
  - Create notification manager for collection responses
  - Implement success notification display
  - Implement error notification with retry action
  - Handle notification click actions
  - _Requirements: 3.3, 3.4_

- [ ] 15.1 Write property test for response notification mapping
  - **Property 8: Response notification mapping**
  - **Validates: Requirements 3.3, 3.4**

- [ ] 16. Implement theme support
  - Create Material 3 theme with light and dark variants
  - Implement theme switching based on system settings
  - Ensure all UI components support both themes
  - Test theme transitions
  - _Requirements: 7.5_

- [ ] 16.1 Write property test for theme adaptation
  - **Property 24: Theme adaptation**
  - **Validates: Requirements 7.5**

- [ ] 17. Implement resource optimization
  - Add memory management in background state
  - Implement low battery mode detection and adaptation
  - Optimize database queries with indexes
  - Implement image loading optimization (if needed)
  - Add performance monitoring
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 17.1 Write property test for background memory reduction
  - **Property 25: Background memory reduction**
  - **Validates: Requirements 8.2**

- [ ] 17.2 Write property test for low battery adaptation
  - **Property 27: Low battery adaptation**
  - **Validates: Requirements 8.5**

- [ ] 18. Implement loading indicators and error handling UI
  - Add loading indicators to all async operations
  - Create reusable error message composables
  - Implement retry mechanisms for failed operations
  - Add user-friendly error messages
  - _Requirements: 7.3, 7.4_

- [ ] 18.1 Write property test for loading indicator display
  - **Property 22: Loading indicator display**
  - **Validates: Requirements 7.3**

- [ ] 18.2 Write property test for error message display
  - **Property 23: Error message display**
  - **Validates: Requirements 7.4**

- [ ] 19. Implement navigation and app structure
  - Set up Navigation Compose with nav graph
  - Create main activity with navigation host
  - Implement bottom navigation or drawer (if needed)
  - Handle deep links for notifications
  - Implement back stack management
  - _Requirements: 6.1, 4.4_

- [ ] 19.1 Write integration tests for navigation flows
  - Test login to collection list flow
  - Test collection list to detail flow
  - Test back navigation

- [ ] 20. Implement user association for collections
  - Ensure all collection requests include user ID
  - Implement user-specific data filtering
  - Handle multi-user scenarios
  - _Requirements: 6.5_

- [ ] 20.1 Write property test for user association
  - **Property 21: User association**
  - **Validates: Requirements 6.5**

- [ ] 21. Add permissions handling
  - Implement runtime permission requests for overlay
  - Implement accessibility service permission flow
  - Add battery optimization whitelist request
  - Create permission explanation dialogs
  - Handle permission denial gracefully
  - _Requirements: 1.4, 2.1, 2.3_

- [ ] 22. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Implement accessibility service
  - Create custom AccessibilityService
  - Implement text extraction from other apps
  - Handle accessibility events
  - Add service enabled/disabled detection
  - _Requirements: 2.3_

- [ ] 23.1 Write integration tests for accessibility service
  - Test text capture from sample apps
  - Test service lifecycle

- [ ] 24. Add app configuration and settings
  - Create settings screen
  - Implement preferences for sync frequency
  - Add option to enable/disable notifications
  - Implement cache clearing option
  - Add about screen with version info
  - _Requirements: 8.4_

- [ ] 25. Implement analytics and crash reporting (optional)
  - Set up Firebase Analytics or similar
  - Add crash reporting
  - Implement event tracking for key user actions
  - Ensure privacy compliance

- [ ] 26. Polish UI and animations
  - Add smooth transitions between screens
  - Implement item animations in lists
  - Add ripple effects and visual feedback
  - Optimize UI performance
  - _Requirements: 7.1, 7.2_

- [ ] 27. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27.1 Run all property-based tests
  - Verify all 35 properties pass with 100+ iterations

- [ ] 27.2 Run integration tests
  - Test end-to-end user flows
  - Test service integration
  - Test database operations

- [ ] 27.3 Perform manual testing
  - Test on different Android versions
  - Test on different screen sizes
  - Test with poor network conditions
  - Test battery optimization scenarios

- [ ] 28. Prepare for release
  - Configure ProGuard/R8 rules
  - Generate signed APK
  - Test release build thoroughly
  - Prepare app store assets (if publishing)
  - Write user documentation
  - _Requirements: All_
