export interface IGameState {
    physics: {
        gravity: number
        drag: number
        groundDrag: number
    }
    nodes: NodeRef[]
    parents: { [childId: number]: number }
    children: { [parentId: number]: number[] }
}

export interface NodeRef {
    id: number
    code: string
}
