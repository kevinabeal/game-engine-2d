import { Subject, identity } from "rxjs"
export const _actions = new Subject<Action>()
export const actions$ = _actions.asObservable()
export type Action<T extends string = string> = { type: T }

export interface ActionCreator<T extends string, P, R = P> {
  (props: P): Action<T> & R
  type: T
}

export function createAction<T extends string, P extends {}>(
  type: T
): ActionCreator<T, P, P>
export function createAction<T extends string, P extends {}, R>(
  type: T,
  transform: (p: P) => R
): ActionCreator<T, P, R>
export function createAction<T extends string, P extends {}, R = P>(
  type: T,
  transform?: (p: P) => R
): ActionCreator<T, P, R> {
  if (typeof transform === "undefined") {
    transform = (v: {}) => v as R
  }
  const t = typeof transform === "undefined" ? identity : transform
  const creator = function (props: P) {
    return { ...t(props), type } as Action<T> & R
  }
  creator.type = type
  return creator as ActionCreator<T, P, R>
}

export function props<P extends {}, R = P>(transform?: (p: P) => R) {
  return transform ? transform : (p: P) => p
}
