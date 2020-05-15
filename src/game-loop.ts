import { startWith, shareReplay, filter } from "rxjs/operators"
import { fromEvent, interval } from "rxjs"
import { animationFrame } from "rxjs/internal/scheduler/animationFrame"
import { initialState } from "./state/store"
import { IGameShape } from "./objects/game-shape"
import { memoize } from "./util/memoize"

const stage = document.getElementById("stage") as HTMLCanvasElement
const context = stage.getContext("2d") as CanvasRenderingContext2D
const resize$ = fromEvent(window, "resize").pipe(
  startWith(new CustomEvent("resize"))
)
resize$.subscribe(function () {
  stage.width = window.innerWidth
  stage.height = window.innerHeight
})

export const frame$ = interval(0, animationFrame).pipe(
  shareReplay(),
  filter(() => !document.hidden)
)

function _objectsOrderedByLayer(
  shapes: ReadonlyArray<IGameShape>
): IGameShape[] {
  return shapes.slice().sort(function (goA, goB) {
    return goA.get("layer") - goB.get("layer")
  })
}
const orderedByLayer = memoize(_objectsOrderedByLayer)

export function startLoop() {
  frame$.subscribe(function () {
    context.clearRect(0, 0, stage.width, stage.height)
    const orderedObjects = orderedByLayer(initialState.shapes)
    orderedObjects.forEach(function (obj) {
      obj.draw(context)
    })
  })
}
