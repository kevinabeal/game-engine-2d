import { ISceneNode } from "./scene-node"
import { IGameShape } from "../objects/game-shape"
import { Subject, Observable } from "rxjs"
import { ICoord, Pixels } from "../objects/geometry"
import { clickEvent$ } from "../controls"
import { takeUntil, filter, pluck, map } from "rxjs/operators"
import { frame$ } from "../game-loop"
import { initialState, store } from "./store"
import { createAction, props } from "./action"
import { reduceHere } from "./reducer"

type HorizontalPosition = "left" | "right"
type VerticalPosition = "top" | "bottom"

export interface ISceneNode {
  remove(): void
  get(): Readonly<IGameShape>
  click$: Observable<IGameShape>
  remove$: Observable<IGameShape>
}

export interface Collision {
  gameObject: IGameShape
  horiztonal: HorizontalPosition
  vertical: VerticalPosition
}

const addNode = createAction(
  "[scene node] add node",
  props<{ node: IGameShape }>()
)
const removeNode = createAction(
  "[scene node] remove node",
  props<{ node: IGameShape }>()
)

reduceHere(["shapes"])
  .on(addNode, function (shapes, action) {
    shapes.push(action.node)
  })
  .on(removeNode, function (shapes, action) {
    shapes.splice(shapes.indexOf(action.node), 1)
  })

export function addSceneNode(
  shape: IGameShape,
  tags: string[] = []
): ISceneNode {
  store.dispatch(addNode({ node: shape }))
  let index = initialState.shapes.length - 1
  const removeThisStream = new Subject<void>()
  const removeSub = objectRemoved$
    .pipe(takeUntil(removeThisStream))
    .subscribe(function (removedIndex) {
      if (removedIndex < index) {
        index--
      }
    })
  const interaction: ISceneNode = {
    remove() {
      removeSub.unsubscribe()
      store.dispatch(removeNode({ node: interaction.get() }))
      removeThisStream.next()
      removeThisStream.complete()
      tags.forEach((tag) => removeTagFromObject(tag, interaction))
      objectRemoved$.next(index)
    },
    remove$: removeThisStream.pipe(map(() => interaction.get())),
    click$: clickEvent$.pipe(
      filter(({ gameObject }) => interaction.get().id === gameObject.id),
      pluck("gameObject"),
      takeUntil(removeThisStream)
    ),
    get() {
      return initialState.shapes[index]
    },
  }
  tags.forEach((tag) => addTagToObject(tag, interaction))
  return interaction
}

const objectRemoved$ = new Subject<number>()

export function getCollisionsForNode(node: IGameShape, shapes: IGameShape[]) {
  const currentObject = node
  const currentHitBox = currentObject.get("hitbox")
  if (!currentHitBox) {
    return []
  }
  const collisions: Collision[] = []
  for (let obj of shapes) {
    const hitBox = obj.get("hitbox")
    if (obj === currentObject || !hitBox || !currentObject.collides(obj)) {
      continue
    }
    const currentPos = currentObject.get("position")
    const currentHitBoxX = currentPos.x + currentHitBox.x
    const currentHitBoxY = currentPos.y + currentHitBox.y
    const objPos = obj.get("position")
    const hitBoxX = objPos.x + hitBox.x
    const hitBoxY = objPos.y + hitBox.y
    const overHalfwayLeft =
      currentHitBoxX + currentHitBox.w / 2 > hitBoxX + hitBox.w / 2
    const overHalfwayDown =
      currentHitBoxY + currentHitBox.h / 2 > hitBoxY + hitBox.h / 2
    collisions.push({
      gameObject: obj,
      horiztonal: overHalfwayLeft ? "right" : "left",
      vertical: overHalfwayDown ? "bottom" : "top",
    })
  }
  return collisions
}

const taggedObjects: { [tag: string]: ISceneNode[] } = {}

export function getObjectsByTag(tag: string): ISceneNode[] {
  return taggedObjects[tag] || []
}

export function getObjectByTag(tag: string): ISceneNode {
  return getObjectsByTag(tag)[0]
}

function addTagToObject(tag: string, obj: ISceneNode) {
  if (!taggedObjects[tag]) {
    taggedObjects[tag] = []
  }
  taggedObjects[tag].push(obj)
}

function removeTagFromObject(tag: string, obj: ISceneNode) {
  if (!taggedObjects[tag]) {
    taggedObjects[tag] = []
  }
  taggedObjects[tag] = taggedObjects[tag].filter((o) => o !== obj)
}

export function getShapeAtCoord(x: Pixels, y: Pixels): IGameShape | void
export function getShapeAtCoord(coord: ICoord): IGameShape | void
export function getShapeAtCoord(
  x: Pixels | ICoord,
  y?: Pixels
): IGameShape | void {
  const topFirst = initialState.shapes.slice().sort(function (goA, goB) {
    return goB.get("layer") - goA.get("layer")
  })
  return topFirst.find((obj) => _isOverlap(obj, x, y))
}

function _isOverlap(obj: IGameShape, x: Pixels | ICoord, y?: Pixels) {
  return typeof x === "number"
    ? obj.isPointOverlapping(x, y as number)
    : obj.isPointOverlapping(x)
}
