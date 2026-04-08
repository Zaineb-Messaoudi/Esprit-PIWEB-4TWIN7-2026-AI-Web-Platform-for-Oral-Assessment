declare module 'canvas' {
  export class Canvas {
    width: number;
    height: number;
    getContext(contextId: '2d'): CanvasRenderingContext2D;
    toBuffer(mimeType?: string): Buffer;
    toDataURL(mimeType?: string): string;
  }

  export class Image {
    width: number;
    height: number;
    src: string | Buffer;
    onload: (() => void) | null;
    onerror: ((err: Error) => void) | null;
  }

  export class ImageData {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
    constructor(data: Uint8ClampedArray, width: number, height?: number);
  }

  export function createCanvas(width: number, height: number): Canvas;

  export function loadImage(
    src: string | Buffer | ArrayBuffer | Uint8Array,
  ): Promise<Image>;
}
