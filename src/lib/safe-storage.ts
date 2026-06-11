/**
 * Type guard for validating parsed data
 */
type Validator<T> = (value: unknown) => value is T

/**
 * Safely parse JSON from localStorage with fallback and optional validation
 * Prevents crashes from corrupted data
 */
export function safeParseJSON<T>(
  key: string,
  fallback: T,
  validator?: Validator<T>
): T {
  try {
    const item = localStorage.getItem(key)
    if (!item) return fallback

    const parsed = JSON.parse(item)

    // Validate structure if validator provided
    if (validator && !validator(parsed)) {
      console.warn(`Invalid data structure for localStorage key "${key}"`)
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.error(`Failed to remove invalid key "${key}":`, e)
      }
      return fallback
    }

    return parsed !== null && parsed !== undefined ? parsed : fallback
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error)

    // Clear corrupted data
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.error(`Failed to remove corrupted key "${key}":`, e)
    }

    return fallback
  }
}

/**
 * Safely set JSON to localStorage
 * Prevents crashes from quota exceeded or serialization errors
 */
export function safeSetJSON(key: string, value: any): boolean {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    console.error(`Failed to save to localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Safely get string from localStorage
 */
export function safeGetString(key: string, fallback: string = ''): string {
  try {
    return localStorage.getItem(key) || fallback
  } catch (error) {
    console.warn(`Failed to read localStorage key "${key}":`, error)
    return fallback
  }
}

/**
 * Safely remove key from localStorage
 */
export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error)
  }
}

/**
 * Check if localStorage is available and working
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Safely get item from localStorage with automatic JSON parsing
 * Returns null if key doesn't exist or parsing fails
 */
export function safeGetItem<T>(
  key: string,
  validator?: Validator<T>
): T | null {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const parsed = JSON.parse(item)

    if (validator && !validator(parsed)) {
      console.warn(`Invalid data structure for localStorage key "${key}"`)
      safeRemove(key)
      return null
    }

    return parsed
  } catch (error) {
    console.warn(`Failed to read localStorage key "${key}":`, error)
    safeRemove(key)
    return null
  }
}

/**
 * Batch clear multiple localStorage keys safely
 */
export function safeClearKeys(...keys: string[]): void {
  keys.forEach(key => safeRemove(key))
}

/**
 * Get all localStorage keys matching a prefix
 */
export function getKeysByPrefix(prefix: string): string[] {
  try {
    return Object.keys(localStorage).filter(key => key.startsWith(prefix))
  } catch {
    return []
  }
}
