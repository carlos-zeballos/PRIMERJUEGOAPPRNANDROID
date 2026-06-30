/**
 * createMatch.utils.ts
 *
 * SISTEMA RESPONSIVE — cómo funciona:
 *
 * 1. Root View mide su tamaño real con onLayout → container.{width,height}
 * 2. getRenderedImageRect calcula el rect exacto donde debe aparecer la imagen
 *    (usando el aspect ratio real del PNG 941×1672, con resizeMode='contain')
 * 3. Un View "artboard" se posiciona en ese rect (left/top/width/height)
 * 4. La imagen se renderiza con resizeMode="stretch" DENTRO del artboard
 *    (el artboard ya tiene el aspect ratio correcto; stretch completa sin distorsión real)
 * 5. Todos los hotspots son hijos del artboard en coordenadas LOCALES
 *    (mapToLocalArtboard convierte artboard 1080×1920 → local)
 *
 * Esta arquitectura garantiza que imagen y hotspots siempre se mueven juntos.
 * No hay double-offset: el artboard ya está en su posición, los hotspots no suman x/y.
 */

export const ARTBOARD_W = 1080;
export const ARTBOARD_H = 1920;

// Dimensiones nativas del PNG base
export const BASE_IMAGE_W = 941;
export const BASE_IMAGE_H = 1672;

export type ArtboardRect = { x: number; y: number; w: number; h: number };

export type RenderedImageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GetRenderedImageRectParams = {
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;
  resizeMode: 'contain' | 'cover';
};

/**
 * Calcula el rect exacto donde una imagen quedaría dibujada dentro de un contenedor,
 * respetando el resizeMode indicado.
 *
 * Para resizeMode='contain':
 *   - La imagen queda completamente dentro del contenedor.
 *   - Se preserva el aspect ratio.
 *   - Si el contenedor es más estrecho, la imagen llena el ancho y tiene margen vertical.
 *   - Si el contenedor es más ancho, la imagen llena el alto y tiene margen lateral.
 *
 * iPhone 14 Pro (393×852) con imagen 941×1672:
 *   imageAspect=0.5628, containerAspect=0.4613
 *   0.4613 < 0.5628 → width-constrained
 *   → { x:0, y:76.5, width:393, height:699 }
 *
 * iPhone SE (375×667) con imagen 941×1672:
 *   containerAspect=0.5622 ≈ imageAspect=0.5628
 *   → imagen casi perfecta, margen mínimo
 */
export function getRenderedImageRect({
  containerWidth,
  containerHeight,
  imageWidth,
  imageHeight,
  resizeMode,
}: GetRenderedImageRectParams): RenderedImageRect {
  const imageAspect     = imageWidth  / imageHeight;
  const containerAspect = containerWidth / containerHeight;

  let w: number;
  let h: number;

  if (resizeMode === 'contain') {
    if (containerAspect <= imageAspect) {
      // Contenedor más estrecho (portrait) → escala por ANCHO
      w = containerWidth;
      h = containerWidth / imageAspect;
    } else {
      // Contenedor más ancho → escala por ALTO
      h = containerHeight;
      w = containerHeight * imageAspect;
    }
  } else {
    // cover: imagen llena el contenedor, puede haber crop
    if (containerAspect >= imageAspect) {
      // Contenedor más ancho → escala por ANCHO
      w = containerWidth;
      h = containerWidth / imageAspect;
    } else {
      // Contenedor más portrait → escala por ALTO
      h = containerHeight;
      w = containerHeight * imageAspect;
    }
  }

  return {
    x:      (containerWidth  - w) / 2,
    y:      (containerHeight - h) / 2,
    width:  w,
    height: h,
  };
}

/**
 * Convierte un rect del artboard 1080×1920 a coordenadas LOCALES
 * dentro del View artboard (que ya fue posicionado con getRenderedImageRect).
 *
 * No suma imageRect.x ni imageRect.y — el View padre ya está en esas coords.
 *
 * @param rect           Rect en espacio artboard 1080×1920
 * @param artboardWidth  Ancho actual del artboard en pantalla (imageRect.width)
 * @param artboardHeight Alto actual del artboard en pantalla (imageRect.height)
 */
export function mapToLocalArtboard(
  rect: ArtboardRect,
  artboardWidth: number,
  artboardHeight: number,
): { position: 'absolute'; left: number; top: number; width: number; height: number } {
  return {
    position: 'absolute',
    left:   (rect.x / ARTBOARD_W) * artboardWidth,
    top:    (rect.y / ARTBOARD_H) * artboardHeight,
    width:  (rect.w / ARTBOARD_W) * artboardWidth,
    height: (rect.h / ARTBOARD_H) * artboardHeight,
  };
}
