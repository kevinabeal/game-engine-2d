export const path = _path as {
  <U extends {}, T1 extends keyof U, T2 extends keyof U[T1]>(p: [T1, T2]): (
    v: U
  ) => U[T1][T2]
  <
    U extends {},
    T1 extends keyof U,
    T2 extends keyof U[T1],
    T3 extends keyof U[T1][T2]
  >(
    p: [T1, T2]
  ): (v: U) => U[T1][T2][T3]
}

export const pathEq = _pathEq as {
  <U extends {}, T1 extends keyof U, T2 extends keyof U[T1]>(p: [T1, T2]): (
    v: U[T1][T2]
  ) => (o: U) => boolean
  <
    U extends {},
    T1 extends keyof U,
    T2 extends keyof U[T1],
    T3 extends keyof U[T1][T2]
  >(
    p: [T1, T2]
  ): (v: U[T1][T2][T3]) => (o: U) => boolean
}

function _path(paths: IPathArg) {
  return function (obj: { [k: string]: any }) {
    let val = obj
    let idx = 0
    while (idx < paths.length) {
      if (val == null) {
        return void 0
      }
      val = val[paths[idx]]
      idx += 1
    }
    return val
  }
}

function _pathEq(p: IPathArg) {
  return function (value: any) {
    return function (obj: {}) {
      return _path(p)(obj) === value
    }
  }
}

type IPathArg = (string | number)[]
