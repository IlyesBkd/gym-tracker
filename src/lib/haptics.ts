/**
 * Haptic feedback utilities for enhanced UX
 * Works on mobile devices that support the Vibration API
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 50,
  success: [10, 30, 10], // Double tap
  warning: [30, 50, 30], // Strong pulse
  error: [50, 100, 50, 100, 50], // Triple pulse
}

/**
 * Trigger haptic feedback
 * Gracefully degrades if Vibration API not available
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (!('vibrate' in navigator)) {
    return
  }

  try {
    const vibration = HAPTIC_PATTERNS[pattern]
    navigator.vibrate(vibration)
  } catch (error) {
    // Silent fail - haptics are optional
    console.debug('Haptic feedback failed:', error)
  }
}

/**
 * Cancel any ongoing vibration
 */
export function hapticCancel(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(0)
  }
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticsSupported(): boolean {
  return 'vibrate' in navigator
}

// Convenience functions for common patterns
export const haptics = {
  light: () => haptic('light'),
  medium: () => haptic('medium'),
  heavy: () => haptic('heavy'),
  success: () => haptic('success'),
  warning: () => haptic('warning'),
  error: () => haptic('error'),
  cancel: hapticCancel,
  isSupported: isHapticsSupported,
}
