export function safeAlert(message: string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) {
      console.warn(message)
      return
    }
    window.alert(message)
  } catch {
    console.warn(message)
  }
}
