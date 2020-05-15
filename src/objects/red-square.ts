import { addSceneNode } from "../state/scene-node"
import { createGameShape } from "./game-shape"
import { randomHex } from "../util/func"
import { control$, Keys } from "../controls"
import { map, filter } from "rxjs/operators"
import { merge } from "rxjs"

const redSquare = addSceneNode(
  createGameShape().square(100).fill("red").position(120, 120).addHitbox(),
  ["player"]
)
const spacebar$ = control$.pipe(
  filter(({ downKeys }) => downKeys.has(Keys.Space)),
  map(() => redSquare.get())
)
merge(redSquare.click$, spacebar$).subscribe(function (ob) {
  ob.fill("#" + randomHex())
})

control$.subscribe(function ({ downKeys }) {
  let speed = 3
  const square = redSquare.get()
  if (downKeys.has(Keys.ArrowDown)) {
    square.move(0, speed)
  }
  if (downKeys.has(Keys.ArrowUp)) {
    square.move(0, -speed)
  }
  if (downKeys.has(Keys.ArrowLeft)) {
    square.move(-speed, 0)
  }
  if (downKeys.has(Keys.ArrowRight)) {
    square.move(speed, 0)
  }
})
