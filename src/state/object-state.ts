import { IObjectInteraction } from "./object-state"
import { IGameShape } from "../objects/game-shape"
import { Subject, Observable } from "rxjs"
import { ICoord } from "../objects/geometry"
import { clickEvent$ } from "../controls"
import { takeUntil, filter, pluck, map, tap } from "rxjs/operators"
import { frame$ } from "../game-loop"
import { worldState } from "./world-state"

type UpdateFn = (o: IGameShape) => IGameShape | void
type HorizontalPosition = "left" | "right"
type VerticalPosition = "top" | "bottom"

export interface IObjectInteraction {
  remove(): void
  get(): Readonly<IGameShape>
  click$: Observable<IGameShape>
  collisions$: Observable<Collision[]>
  remove$: Observable<IGameShape>
}

export interface Collision {
  gameObject: IGameShape
  horiztonal: HorizontalPosition
  vertical: VerticalPosition
}

export function addObject(
  shape: IGameShape,
  tags: string[] = []
): IObjectInteraction {
  worldState.shapes = worldState.shapes.concat([shape])
  let index = worldState.shapes.length - 1
  const removeThisStream = new Subject<void>()
  const removeSub = objectRemoved$
    .pipe(takeUntil(removeThisStream))
    .subscribe(function (removedIndex) {
      if (removedIndex < index) {
        index--
      }
    })
  const interaction: IObjectInteraction = {
    remove() {
      removeSub.unsubscribe()
      worldState.shapes = worldState.shapes.filter(
        (s) => s !== interaction.get()
      )
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
    collisions$: frame$.pipe(
      map(function () {
        const currentObject = interaction.get()
        const currentHitBox = currentObject.get("hitbox")
        if (!currentHitBox) {
          return []
        }
        const collisions: Collision[] = []
        for (let obj of worldState.shapes) {
          const hitBox = obj.get("hitbox")
          if (
            obj === currentObject ||
            !hitBox ||
            !currentObject.collides(obj)
          ) {
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
      }),
      takeUntil(removeThisStream)
    ),
    get() {
      return worldState.shapes[index]
    },
  }
  tags.forEach((tag) => addTagToObject(tag, interaction))
  return interaction
}

const objectRemoved$ = new Subject<number>()

export function colliding(
  o1: IObjectInteraction,
  o2: IObjectInteraction
): Observable<Collision> {
  return o1.collisions$.pipe(
    map((c) => c.find((e) => e.gameObject.id === o2.get().id)),
    filter((v) => !!v)
  ) as Observable<Collision>
}

const taggedObjects: { [tag: string]: IObjectInteraction[] } = {}

export function getObjectsByTag(tag: string): IObjectInteraction[] {
  return taggedObjects[tag] || []
}

export function getObjectByTag(tag: string): IObjectInteraction {
  return getObjectsByTag(tag)[0]
}

function addTagToObject(tag: string, obj: IObjectInteraction) {
  if (!taggedObjects[tag]) {
    taggedObjects[tag] = []
  }
  taggedObjects[tag].push(obj)
}

function removeTagFromObject(tag: string, obj: IObjectInteraction) {
  if (!taggedObjects[tag]) {
    taggedObjects[tag] = []
  }
  taggedObjects[tag] = taggedObjects[tag].filter((o) => o !== obj)
}
