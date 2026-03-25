---
phase: "02.1"
name: "Admin QR Scanner Enhancement"
nyquist_enabled: true
test_framework: "jest"
test_command: "npm test"
---

# Validation Plan

## Test Coverage Matrix

| Req ID | Requirement | Test File | Test Type | Priority |
|--------|-------------|-----------|-----------|----------|
| ADM-SCAN-01 | Scanner component renders without SSR errors | `src/components/qr-scanner/QRScanner.test.tsx` | unit | high |
| ADM-SCAN-02 | QR detection triggers callback | `src/components/qr-scanner/QRScanner.test.tsx` | integration | high |
| ADM-SCAN-03 | Works on mobile browsers | Manual testing | e2e | high |
| ADM-SCAN-04 | Manual entry fallback works | `src/components/qr-scanner/ManualEntry.test.tsx` | unit | medium |

## Manual Testing

### Critical Paths
1. Scanner initializes on `/admin/scan` page load
2. Camera permission request handled gracefully
3. QR code detection triggers order lookup
4. Manual token entry works when camera unavailable
5. Scanner stops after successful scan (not continuous)

### Device Testing
- iOS Safari (iPhone 12+)
- Chrome Android (Pixel 6+)
- Desktop Chrome with camera (fallback verification)

## Gaps
- Test infrastructure for camera-dependent features may require mocking
- No existing tests for admin/scan page detected
- Manual mobile device testing required (cannot be fully automated)
