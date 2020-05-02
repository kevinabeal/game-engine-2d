import { Pixels, ICoord } from "./../objects/geometry"
import { IGameState } from "./world-state"
import { IGameShape } from "../objects/game-shape"

export const worldState: IGameState = {
  shapes: [],
}

export function getShapeAtCoord(x: Pixels, y: Pixels): IGameShape | void
export function getShapeAtCoord(coord: ICoord): IGameShape | void
export function getShapeAtCoord(
  x: Pixels | ICoord,
  y?: Pixels
): IGameShape | void {
  const topFirst = worldState.shapes.slice().sort(function (goA, goB) {
    return goB.get("layer") - goA.get("layer")
  })
  return topFirst.find((obj) => _isOverlap(obj, x, y))
}

function _isOverlap(obj: IGameShape, x: Pixels | ICoord, y?: Pixels) {
  return typeof x === "number"
    ? obj.isPointOverlapping(x, y as number)
    : obj.isPointOverlapping(x)
}

export interface IGameState {
  shapes: ReadonlyArray<IGameShape>
}
