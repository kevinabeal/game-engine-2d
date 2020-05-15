type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P]
}

type AnyFn = (...a: any[]) => any

type AnyObject = { [k: string]: any }
