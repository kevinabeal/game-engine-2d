import { actionUpdates } from "./reducer"
import { produce } from "immer"
import { BehaviorSubject } from "rxjs"
import { unwrap } from "../util/unwrap"
import { path } from "../util/path"
import { _actions, Action } from "./action"
import { IGameState } from "./state"

export const initialState: Readonly<IGameState> = {
    // @see https://stackoverflow.com/a/48131177/832447
    physics: {
        gravity: 0.2,
        drag: 0.999,
        groundDrag: 0.9,
    },
    nodes: [],
    parents: [],
    children: [],
}

export class Store extends BehaviorSubject<IGameState> {
    private constructor() {
        super(initialState)
    }

    dispatch(action: Action) {
        const result = this._applyAction(action)
        if (result) {
            this.next(result)
        }
        _actions.next(action)
    }

    select() {}

    static getSingleton() {
        return (store = store ? store : new Store())
    }

    private _applyAction<A extends Action>(action: A): IGameState | null {
        const updaters = actionUpdates[action.type]
        const startState = unwrap(store) as IGameState
        let state = startState
        if (!updaters || updaters.length === 0) {
            return null
        }
        updaters.forEach(function ({ rPath, updater }) {
            state = produce(state, function (_state) {
                const obj = rPath.length ? path(rPath as any)(_state) : _state
                console.assert(typeof obj === "object")
                updater(obj, action)
            })
        })
        return state === startState ? null : state
    }
}

export let store: Store
Store.getSingleton()
