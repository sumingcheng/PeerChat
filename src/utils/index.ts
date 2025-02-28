/**
 * 设置 localStorage
 * @param key 键名
 * @param value 值
 */
export const setLocalStorage = (key: string, value: any): void => {
  try {
    const stringValue = JSON.stringify(value)
    localStorage.setItem(key, stringValue)
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

/**
 * 获取 localStorage
 * @param key 键名
 * @param defaultValue 默认值
 */
export const getLocalStorage = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return defaultValue ?? null
    }
    return JSON.parse(item)
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue ?? null
  }
}

/**
 * 删除指定的 localStorage
 * @param key 键名
 */
export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }
}

/**
 * 清空所有 localStorage
 */
export const clearLocalStorage = (): void => {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}
