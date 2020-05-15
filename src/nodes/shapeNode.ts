import { SceneNode } from "./node"
import { createGameShape } from "../objects/game-shape"
import { GraphNode } from "./graphNode"
import { Store } from "../state/store"

@GraphNode({ code: "shape" })
export class ShapeNode {
    shape = createGameShape()
    constructor() {}
}
