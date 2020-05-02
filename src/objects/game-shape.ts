import { ICoord, Pixels, c, IBoundary, IDimension, b, d } from "./geometry"

const fakeContext = document.createElement("canvas").getContext("2d")

// PROPERTIES ----------------]

export interface IGameShape {
  draw(ctx: CanvasRenderingContext2D): void
  position(x: Pixels, y: Pixels, origin?: ICoord): IGameShape
  move(x: Pixels, y: Pixels): IGameShape
  moveToLayer(layer: number): IGameShape
  square(w: Pixels, h?: Pixels): IGameShape
  circle(width: Pixels): IGameShape
  stroke(width: Pixels, style: DrawProps["strokeStyle"]): IGameShape
  fill(style: DrawProps["fillStyle"]): IGameShape

  isPointOverlapping(coord: ICoord): boolean
  isPointOverlapping(x: Pixels, y: Pixels): boolean

  collides(boundary: IBoundary): boolean
  collides(gameObject: IGameShape): boolean

  addHitbox(): IGameShape
  addHitbox(boundary: IBoundary): IGameShape
  addHitbox(coord: ICoord, dimension: IDimension): IGameShape
  addHitbox(x: Pixels, y: Pixels, w: Pixels, h: Pixels): IGameShape
  addHitbox(
    xOrBoundOrCoor: Pixels | ICoord | IBoundary,
    yOrDim?: Pixels | IDimension,
    w?: Pixels,
    h?: Pixels
  ): IGameShape

  get(): Readonly<DrawProps>
  get<K extends keyof DrawProps>(key: K): Readonly<DrawProps[K]>

  edit<K extends keyof DrawProps>(key: K, value: DrawProps[K]): IGameShape
  edit(opts: Partial<DrawProps>): IGameShape

  clone(): IGameShape

  readonly id: number
}

// OBJECT FACTORY ------------]

export const o = createGameShape()
export function createGameShape(opts: Partial<DrawProps> = {}): IGameShape {
  const props: DrawProps = {
    ...DEFAULT_PROPS,
    ...opts,
  }
  currentId = currentId < Number.MAX_SAFE_INTEGER ? currentId + 1 : 0
  const gameShape: IGameShape = {
    id: currentId,
    draw: render,
    position,
    square,
    circle,
    stroke,
    fill,
    move,
    isPointOverlapping,
    addHitbox,
    get,
    edit,
    collides,
    moveToLayer,
    clone,
  }
  return gameShape

  // RENDERING -----------------]

  function _applyGlobalSettings(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = props.globalAlpha
    ctx.globalCompositeOperation = props.globalCompositeOperation
    ctx.imageSmoothingEnabled = props.imageSmoothingEnabled
    ctx.imageSmoothingQuality = props.imageSmoothingQuality
  }

  function _applyStyleSettings(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = props.fillStyle
    ctx.strokeStyle = props.strokeStyle
    ctx.shadowBlur = props.shadowBlur
    ctx.shadowColor = props.shadowColor
    ctx.shadowOffsetX = props.shadowOffsetX
    ctx.shadowOffsetY = props.shadowOffsetY
    ctx.lineWidth = props.lineWidth
    ctx.lineCap = props.lineCap
    ctx.lineDashOffset = props.lineDashOffset
    ctx.lineJoin = props.lineJoin
    ctx.textAlign = props.textAlign
    ctx.textBaseline = props.textBaseline
    ctx.miterLimit = props.miterLimit
    ctx.font = props.font
    ctx.direction = props.direction
  }

  function _drawPath(ctx: CanvasRenderingContext2D) {
    ctx.fill(props.path)

    if (props.lineWidth > 0) {
      ctx.stroke(props.path)
    }
  }

  function render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    _applyGlobalSettings(ctx)
    _applyStyleSettings(ctx)
    ctx.translate(
      props.position.x - props.transitionOrigin.x,
      props.position.y - props.transitionOrigin.y
    )
    _drawPath(ctx)
    ctx.restore()
    props.mutations.length = 0
  }

  // SHAPES / PATHS ------------]

  function square(w: Pixels, h: Pixels = w) {
    const newPath = new Path2D()
    newPath.rect(0, 0, w, h)
    props.path = newPath
    props.dimension = d(w, h)
    props.mutations.push(GameMutations.PATH)
    return gameShape
  }

  function circle(width: Pixels) {
    const circle = new Path2D()
    const radius = width / 2
    circle.arc(0, 0, radius, 0, 2 * Math.PI)
    props.path = translatePath(circle, radius, radius)
    props.dimension = d(width, width)
    props.mutations.push(GameMutations.PATH)
    return gameShape
  }

  // QUERYING ------------------]

  function isPointOverlapping(x: Pixels | ICoord, y?: Pixels): boolean {
    if (typeof x !== "number") {
      y = x.y
      x = x.x
    }
    const newX = props.position.x - props.transitionOrigin.x
    const newY = props.position.y - props.transitionOrigin.y
    return fakeContext!.isPointInPath(
      translatePath(props.path, newX, newY),
      x,
      y as Pixels
    )
  }

  function _boundaryFromGameObject(
    go: IGameShape,
    useHitBox = false
  ): IBoundary {
    const pos = go.get("position")
    if (useHitBox) {
      const hitBox = go.get("hitbox") as IBoundary
      return { ...hitBox, x: hitBox.x + pos.x, y: hitBox.y + pos.y }
    }
    const dim = go.get("dimension")
    return { ...pos, ...dim }
  }

  function collides(rect2: IBoundary | IGameShape): boolean {
    const otherBoundary =
      "position" in rect2 ? _boundaryFromGameObject(rect2, true) : rect2
    if (!props.hitbox || !otherBoundary) {
      return false
    }
    const refBoundary = _boundaryFromGameObject(gameShape, true)
    const beforeEndX = refBoundary.x < otherBoundary.x + otherBoundary.w
    const afterStartX = refBoundary.x + refBoundary.w > otherBoundary.x
    const beforeEndY = refBoundary.y < otherBoundary.y + otherBoundary.h
    const afterStartY = refBoundary.y + refBoundary.h > otherBoundary.y
    return beforeEndX && afterStartX && beforeEndY && afterStartY
  }

  function get<K extends keyof DrawProps>(key?: K): DrawProps | DrawProps[K] {
    return key ? props[key] : props
  }

  function clone(): IGameShape {
    return createGameShape({
      ...props,
      position: { ...props.position },
      transitionOrigin: { ...props.transitionOrigin },
      dimension: { ...props.dimension },
      hitbox: props.hitbox ? { ...props.hitbox } : null,
      mutations: props.mutations.slice(),
    })
  }

  // SHAPE MUTATION ------------]

  function fill(style: DrawProps["fillStyle"]) {
    props.fillStyle = style
    props.mutations.push(GameMutations.FILL)
    return gameShape
  }

  function position(x: Pixels, y: Pixels, origin: ICoord = c(0, 0)) {
    props.position = c(x, y)
    props.transitionOrigin = origin
    props.mutations.push(GameMutations.MOVE)
    return gameShape
  }

  function moveToLayer(layer: number): IGameShape {
    props.layer = layer
    props.mutations.push(GameMutations.LAYER)
    return gameShape
  }

  function stroke(
    width: Pixels = 1,
    style: DrawProps["strokeStyle"] = props.strokeStyle
  ) {
    props.lineWidth = width
    props.strokeStyle = style
    props.mutations.push(GameMutations.STROKE)
    return gameShape
  }

  function move(x: Pixels, y: Pixels) {
    props.position = c(props.position.x + x, props.position.y + y)
    props.mutations.push(GameMutations.MOVE)
    return gameShape
  }

  function edit<K extends keyof DrawProps>(
    key: K | Partial<DrawProps>,
    value?: DrawProps[K]
  ): IGameShape {
    props.mutations.push(GameMutations.EDIT)
    if (typeof key === "string" && typeof value !== "undefined") {
      props[key] = value
    } else if (typeof key === "object") {
      Object.assign(props, key)
    }
    return gameShape
  }

  function addHitbox(
    xOrBoundOrCoor?: Pixels | ICoord | IBoundary,
    yOrDim?: Pixels | IDimension,
    w?: Pixels,
    h?: Pixels
  ): IGameShape {
    let hitbox = b(0, 0, props.dimension.w, props.dimension.h)
    if (typeof xOrBoundOrCoor === "undefined") {
      // nothing. we're already good
    } else if (
      typeof xOrBoundOrCoor === "number" &&
      typeof yOrDim === "number"
    ) {
      hitbox = b(xOrBoundOrCoor, yOrDim, w as Pixels, h as Pixels)
    } else if (typeof xOrBoundOrCoor === "object" && !yOrDim) {
      hitbox = xOrBoundOrCoor as IBoundary
    } else if (
      typeof xOrBoundOrCoor === "object" &&
      typeof yOrDim === "object"
    ) {
      hitbox = b(xOrBoundOrCoor.x, xOrBoundOrCoor.y, yOrDim.w, yOrDim.h)
    }
    props.hitbox = hitbox
    props.mutations.push(GameMutations.HITBOX)
    return gameShape
  }
}

let currentId = 0

const DEFAULT_CANVAS_PROPS: CanvasProps = {
  fillStyle: "transparent",
  globalAlpha: 1,
  globalCompositeOperation: "source-over",
  imageSmoothingEnabled: true,
  imageSmoothingQuality: "medium",
  strokeStyle: "black",
  shadowBlur: 0,
  shadowColor: "rgba(0, 0, 0, 0)",
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  lineWidth: 0,
  lineCap: "square",
  lineDashOffset: 0,
  lineJoin: "miter",
  textAlign: "start",
  textBaseline: "alphabetic",
  filter: "none", // same as CSS filter property
  miterLimit: 10,
  font: "10px sans-serif",
  direction: "ltr",
}

const DEFAULT_SPECIAL_PROPS: SpecialDrawProps = {
  position: c(0, 0),
  transitionOrigin: c(0, 0),
  path: new Path2D(),
  dimension: d(0, 0),
  hitbox: null,
  layer: 0,
  mutations: [],
}

const DEFAULT_PROPS = {
  ...DEFAULT_CANVAS_PROPS,
  ...DEFAULT_SPECIAL_PROPS,
}

// HELPER FUNCTIONS ----------]

const matrix = document
  .createElementNS("http://www.w3.org/2000/svg", "svg")
  .createSVGMatrix()

function translatePath(path: Path2D, x: Pixels, y: Pixels): Path2D {
  const t = matrix.translate(x, y)
  const newPath = new Path2D()
  newPath.addPath(path, t)
  return newPath
}

// PROPERTIES ----------------]

type NonFnCanvasKeys = {
  [K in keyof CanvasRenderingContext2D]: CanvasRenderingContext2D[K] extends Function
    ? never
    : K
}[keyof CanvasRenderingContext2D]
type NonIgnoredCanvasKeys = Exclude<NonFnCanvasKeys, "canvas">
type CanvasProps = Pick<CanvasRenderingContext2D, NonIgnoredCanvasKeys>
type SpecialDrawProps = {
  position: ICoord
  transitionOrigin: ICoord
  path: Path2D
  dimension: IDimension
  hitbox: IBoundary | null
  layer: number
  mutations: GameMutations[]
}

type DrawProps = SpecialDrawProps & CanvasProps

export enum GameMutations {
  MOVE = "move",
  FILL = "fill",
  STROKE = "stroke",
  HITBOX = "hitbox",
  EDIT = "edit",
  PATH = "path",
  LAYER = "layer",
}
