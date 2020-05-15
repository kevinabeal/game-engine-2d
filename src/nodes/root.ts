import { GraphNode } from "./graphNode"
import { store, Store } from "../state/store"

@GraphNode({
    code: "root",
    providers: [{ provide: Store, useValue: store }],
})
export class RootNode {
    constructor() {}
}
