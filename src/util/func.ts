export function identity<T>(v: T) {
  return v
}

export function randomString(length = 5) {
  return Math.random().toString(36).substr(2, length)
}

export function randomHex() {
  return Math.random().toString(16).slice(2, 8)
}

export function not(value: any) {
  return !value
}
