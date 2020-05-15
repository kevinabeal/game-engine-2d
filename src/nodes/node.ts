import { GraphNode, OnDestroy, Inject, addNode, removeNode } from "./graphNode"
import { Store, store } from "../state/store"

const MEANING = Symbol("new token")

@GraphNode({
    code: "Simple",
    providers: [{ provide: MEANING, useValue: 42 }],
})
export class SceneNode implements OnDestroy {
    constructor(store: Store, @Inject(MEANING) test2: number) {
        console.debug("MEANING", test2)
        console.debug("store", store)
    }

    onDestroy() {
        console.debug("DESTROY!")
    }
}

setTimeout(() => {
    store.dispatch(addNode({ to: null!, code: "root" }))
    const addSimple = addNode({ to: 1, code: "Simple" })
    store.dispatch(addSimple)

    setTimeout(() => {
        store.dispatch(removeNode({ id: addSimple.id }))
    }, 1000 * 3)
})
