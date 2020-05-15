import { Observable } from "rxjs"
import { take } from "rxjs/operators"

export function unwrap<T>(ob: Observable<T>): T | void {
  if (!ob) {
    return
  }
  let v: T | void = void 0
  ob.pipe(take(1)).subscribe((_v) => {
    v = _v
  })
  return v as T | void
}
