import { Action } from "./../state/action"
import { Observable } from "rxjs"
import { ActionCreator } from "../state/action"
import { filter } from "rxjs/operators"

export function ofType<T extends string, P>(action: ActionCreator<any, P>) {
  return function (ob: Observable<Action>) {
    return (ob.pipe(
      filter((v) => !!v && !!v.type && v.type === action.type)
    ) as unknown) as Observable<Action<T> & P>
  }
}
