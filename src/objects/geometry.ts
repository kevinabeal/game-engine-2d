import { IBoundary, Pixels, ICoord } from './geometry';
export interface ICoord {
	x: Pixels;
	y: Pixels;
}
export function c(x: Pixels, y: Pixels): ICoord {
	return { x, y };
}

export interface IDimension {
	w: Pixels;
	h: Pixels;
}
export function d(w: Pixels, h: Pixels): IDimension {
	return { w, h };
}

export interface IBoundary extends ICoord, IDimension {}
export function b(x: Pixels, y: Pixels, w: Pixels, h: Pixels): IBoundary {
	return { x, y, w, h };
}

export type Pixels = number;
