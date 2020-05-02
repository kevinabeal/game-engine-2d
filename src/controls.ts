import { fromEvent, of } from "rxjs"
import { filter, map, mapTo, shareReplay, switchMap } from "rxjs/operators"
import { frame$ } from "./game-loop"
import { IGameShape } from "./objects/game-shape"
import { c } from "./objects/geometry"
import { getShapeAtCoord } from "./state/world-state"

export enum Keys {
  ArrowDown = "ArrowDown",
  ArrowUp = "ArrowUp",
  ArrowLeft = "ArrowLeft",
  ArrowRight = "ArrowRight",
  Space = " ",
  Enter = "Enter",
}

const controls = {
  downKeys: new Set<string>(),
  upKeys: new Set<string>(),
  mouseDown: false,
  mouseCoord: c(0, 0),
}

export const control$ = frame$.pipe(mapTo(controls))

fromEvent(window, "keydown")
  .pipe(map((event) => (event as KeyboardEvent).key))
  .subscribe((key) => controls.downKeys.add(key))

fromEvent(window, "keyup")
  .pipe(map((event) => (event as KeyboardEvent).key))
  .subscribe((key) => controls.downKeys.delete(key))

fromEvent(window, "mousedown").subscribe(() => (controls.mouseDown = true))
fromEvent(window, "mouseup").subscribe(() => (controls.mouseDown = false))
fromEvent(window, "mousemove").subscribe(function (e) {
  const event = e as MouseEvent
  controls.mouseCoord = c(event.pageX, event.pageY)
})

export const clickEvent$ = fromEvent(window, "click").pipe(
  switchMap(function (e) {
    const event = e as MouseEvent
    const coord = c(event.pageX, event.pageY)
    return of(getShapeAtCoord(coord)).pipe(
      filter((v) => !!v),
      map(function (gameObject) {
        return { gameObject: gameObject as IGameShape, coord }
      })
    )
  }),
  shareReplay()
)
