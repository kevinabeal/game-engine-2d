import { createGameShape } from "./objects/game-shape"
import { addObject, colliding, getObjectByTag } from "./state/object-state"
import { startLoop } from "./game-loop"
import { b } from "./objects/geometry"
import "./objects/red-square"

startLoop()

const ground = addObject(
  createGameShape()
    .square(window.innerWidth, 10)
    .fill("brown")
    .position(0, window.innerHeight - 10)
    .addHitbox(),
  ["scene", "ground"]
)

const blueCircle = addObject(
  createGameShape({ fillStyle: "lightblue", layer: 2 })
    .position(10, 10)
    .circle(100)
    .stroke(2, "black")
    .addHitbox(b(10, 10, 80, 80))
)

const sky = addObject(
  createGameShape()
    .square(window.innerWidth, window.innerHeight)
    .fill("lightblue")
    .moveToLayer(-1),
  ["scene", "background"]
)

colliding(getObjectByTag("player"), blueCircle).subscribe(function (collision) {
  if (collision.horiztonal === "left" && collision.vertical === "top") {
    collision.gameObject.fill("red")
  } else if (
    collision.horiztonal === "left" &&
    collision.vertical === "bottom"
  ) {
    collision.gameObject.fill("green")
  } else if (
    collision.horiztonal === "right" &&
    collision.vertical === "bottom"
  ) {
    collision.gameObject.fill("blue")
  } else {
    collision.gameObject.fill("gold")
  }
})
