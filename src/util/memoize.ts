let CACHE_DEPTH = 1
let MEMOIZATION = true

export function memoize<T extends (...args: any[]) => any, R = ReturnType<T>>(
  this: any,
  func: T,
  searchCache: IMemoizeResolver<R> = memoizeByReference
): T & IMemoizedFunction {
  const memoized = (...args: any[]) => {
    if (args.length === 0) {
      return func.apply(this, args)
    }
    if (MEMOIZATION && cache.length) {
      if (cache.length > CACHE_DEPTH) {
        cache.length = CACHE_DEPTH
      }
      const [found, prevResult] = searchCache(args, cache)
      if (found) {
        return prevResult
      }
    }
    const result = func.apply(this, args)
    cache.push([args, result])
    return result
  }

  const cache = [] as IMemoizedCache
  memoized.clearCache = function () {
    cache.length = 0
  }
  memoized.getCache = function () {
    return cache.slice()
  }

  return (memoized as unknown) as T & IMemoizedFunction
}

export function memoizeByReference(
  args: any[],
  cache: IMemoizedCache
): [IFound, any] {
  const foundEntry = cache.find(function ([_args]) {
    if (_args.length !== args.length) {
      return false
    }
    return !_args.some(function (arg, i) {
      return arg !== args[i]
    })
  })
  return foundEntry ? [true, foundEntry[1]] : [false, void 0]
}

export interface IMemoizedFunction {
  clearCache(): void
  getCache(): IMemoizedCache
}

export type IMemoizeResolver<IFoundResult = any> = (
  args: any[],
  cache: IMemoizedCache
) => [IFound, IFoundResult]

type IMemoizedCache = Array<[any[], any]>
type IFound = boolean
