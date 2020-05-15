import { IGameState } from "./../state/state"
import { createAction, props, actions$ } from "../state/action"
import { reduceHere } from "../state/reducer"
import { ofType } from "../util/operators"
import { store } from "../state/store"
import { unwrap } from "../util/unwrap"
import { not, flatten } from "../util/func"

import "reflect-metadata"

interface GraphNodeOptions {
    code: string
    providers?: Provision[]
}

interface Provision {
    provide: any
    useValue?: any
    useClass?: Constructor
}

interface Constructor<T extends {} = {}> {
    new (...args: any[]): T
}

const nodeTypeConstructorMap = new Map<string, Constructor>()
const idInstanceMap = new Map<number, { [k: string]: any }>()
const providersMap = new WeakMap<{}, Provision[]>()

export function GraphNode(options: GraphNodeOptions) {
    const providing = options.providers || []
    return function <T extends Constructor>(constructor: T) {
        if (nodeTypeConstructorMap.has(options.code)) {
            throw new Error(`Registering node code "${options.code}" twice!`)
        }
        class Extended extends constructor {
            constructor(...args: any[]) {
                const id = args[0] as number
                const ancestors = args[1] as any[]
                super(
                    ...resolveDependencies(dependencies, providing, ancestors)
                )
                providersMap.set(this, providing.slice())
            }
        }
        const dependencies = getDependencies(constructor) || []
        nodeTypeConstructorMap.set(options.code, Extended)
        return Extended
    }
}

function resolveDependencies(
    dependencies: (Constructor | symbol)[],
    newProviders: Provision[],
    ancestors: any[]
): any[] {
    const previousProviders = flatten(
        ancestors.map(function (ancestor) {
            const provider = providersMap.get(ancestor)
            if (!provider) {
                throw new Error(`Can't find provider`)
            }
            return provider
        })
    )
    newProviders.forEach(function (provider) {
        if (provider.useValue) {
            return
        }
        if (!provider.useClass) {
            throw new Error(`Impossible to resolve dependency`)
        }
        const clazz = provider.useClass
        const ancestorDep = ancestors.find(
            (ancestor) => ancestor instanceof clazz
        )
        if (ancestorDep) {
            provider.useValue = ancestorDep
            return
        }
        provider.useValue = new clazz(
            ...resolveDependencies(
                getDependencies(clazz) || [],
                newProviders,
                ancestors
            )
        )
    })
    const allProviders = previousProviders.concat(newProviders)
    return dependencies.map(function (dependency) {
        const provided = allProviders.find(function (provider) {
            return provider.provide === dependency
        })
        if (typeof provided === "undefined") {
            throw new Error(`Missing dependency!`)
        }
        return provided.useValue
    })
}

let uniqueID = 0

export const TEST_SYMBOL = Symbol("TEST_SYMBOL")

export function Inject(token: symbol) {
    return function (
        target: any,
        propertyKey: string | symbol,
        parameterIndex: number
    ) {
        const requiredParameters =
            Reflect.getOwnMetadata(token, target, propertyKey) || []
        requiredParameters.push(parameterIndex)
        requiredParameters.sort()
        Reflect.defineMetadata(token, requiredParameters, target, propertyKey)
    }
}

function getDependencies(
    constructor: Constructor
): (Constructor | symbol)[] | null {
    const parameterTypes = Reflect.getOwnMetadata(
        "design:paramtypes",
        constructor
    ) as Constructor[] | undefined
    if (!parameterTypes) {
        return null
    }
    const allKeys = Reflect.getMetadataKeys(constructor)
    const mKeys = allKeys.filter(function (key) {
        return typeof key === "symbol"
    })
    for (const key of mKeys) {
        const indexes = Reflect.getOwnMetadata(key, constructor) as number[]
        parameterTypes[indexes[0]] = key
    }
    return parameterTypes
}

export const addNode = createAction("[node] add node", function (props: {
    to: number
    code: string
}) {
    return { ...props, id: ++uniqueID }
})
export const removeNode = createAction(
    "[node] remove node",
    props<{ id: number }>()
)

reduceHere([])
    .on(addNode, function (state, { to, code, id }) {
        state.nodes.push({ id, code: code })
        if (!to) {
            return
        }
        const parent = state.nodes.find((n) => n.id === to)
        if (!parent) {
            throw new Error(`Can't find parent`)
        }
        state.parents[id] = to
        state.children[to] = (state.children[to] || []).concat([id])
    })
    .on(removeNode, function (state, { id }) {
        const i = state.nodes.findIndex((n) => n.id === id)
        if (i === -1) {
            throw new Error(`Can't find node`)
        }
        state.nodes.splice(i, 1)
        delete state.parents[id]
        delete state.children[id]
    })
const addNode$ = actions$.pipe(ofType(addNode))
addNode$.subscribe(function (action) {
    const clazz = nodeTypeConstructorMap.get(action.code)
    if (!clazz) {
        throw new Error(`Can't create node w/ code: ${action.code}`)
    }
    const state = unwrap(store) as IGameState
    const ancestorIds = getAllAncestors(action.id, state)
    const ancestors = ancestorIds.map((id) => idInstanceMap.get(id))
    console.assert(!ancestors.some(not), "Ancestors missing!")
    const instance = new clazz(action.id, ancestors)
    idInstanceMap.set(action.id, instance)
})
const removeNode$ = actions$.pipe(ofType(removeNode))
removeNode$.subscribe(function (action) {
    const instance = idInstanceMap.get(action.id)
    if (!instance) {
        throw new Error(`Couldn't destroy object`)
    }
    idInstanceMap.delete(action.id)
    if ("onDestroy" in instance && typeof instance.onDestroy === "function") {
        instance.onDestroy()
    }
})

function getAllAncestors(
    fromId: number,
    state: Pick<IGameState, "parents">
): number[] {
    const ids = [] as number[]
    let nextId = fromId
    while (state.parents[nextId]) {
        ids.push(state.parents[nextId])
        nextId = state.parents[nextId]
    }
    return ids
}

export interface OnDestroy {
    onDestroy(): void
}
