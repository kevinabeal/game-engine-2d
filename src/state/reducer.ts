import { ActionCreator, Action } from "./action"
import { IGameState } from "./state"

interface MiniReducer<U> {
  on<T extends string, R>(
    action: ActionCreator<T, any, R>,
    updater: ReducerUpdater<U, Action<T> & R>
  ): MiniReducer<U>
}

export type ReducerUpdater<S, A> = (slice: Mutable<S>, action: A) => void

export function reduceHere(rPath: []): MiniReducer<IGameState>
export function reduceHere<T1 extends keyof IGameState>(
  rPath: [T1]
): MiniReducer<IGameState[T1]>
export function reduceHere<
  T1 extends keyof IGameState,
  T2 extends keyof IGameState[T1]
>(rPath: [T1, T2]): MiniReducer<IGameState[T1][T2]>
export function reduceHere<
  T1 extends keyof IGameState,
  T2 extends keyof IGameState[T1],
  T3 extends keyof IGameState[T1][T2]
>(rPath: [T1, T2, T3]): MiniReducer<IGameState[T1][T2][T3]>
export function reduceHere<
  T1 extends keyof IGameState,
  T2 extends keyof IGameState[T1],
  T3 extends keyof IGameState[T1][T2],
  T4 extends keyof IGameState[T1][T2][T3]
>(rPath: [T1, T2, T3, T4]): MiniReducer<IGameState[T1][T2][T3][T4]>
export function reduceHere<
  T1 extends keyof IGameState,
  T2 extends keyof IGameState[T1],
  T3 extends keyof IGameState[T1][T2],
  T4 extends keyof IGameState[T1][T2][T3],
  T5 extends keyof IGameState[T1][T2][T3][T4]
>(rPath: [T1, T2, T3, T4, T5]): MiniReducer<IGameState[T1][T2][T3][T4][T5]>
export function reduceHere(rPath: (string | number)[]): MiniReducer<any> {
  const mini = {
    on(action: any, updater: ReducerUpdater<IGameState, any>) {
      if (!actionUpdates[action.type]) {
        actionUpdates[action.type] = []
      }
      actionUpdates[action.type].push({ rPath, updater })
      return mini
    },
  }
  return mini
}

export interface ReducerAt {
  rPath: (string | number)[]
  updater: ReducerUpdater<any, any>
}

export const actionUpdates: { [actionType: string]: ReducerAt[] } = {}
