import { appendPatternPaint } from '../styles/pattern.js';
import { parseStyleConfig } from '../styles/styles.js';
import { applyTransform, applyMatrix, isIdentityTransform, isTranslationTransform } from '../transformation.js';
import { appendSketchElement, sketchPath } from '../utils.js';
import { str } from './primitives.js';

export function drawEllipse(context, ellipse, svgTransform) {
    const cx = ellipse.cx.baseVal.value;
    const cy = ellipse.cy.baseVal.value;
    const rx = ellipse.rx.baseVal.value;
    const ry = ellipse.ry.baseVal.value;
    if (rx === 0 || ry === 0) {
        // zero-radius ellipse is not rendered
        return;
    }
    const center = applyMatrix({ x: cx, y: cy }, svgTransform);
    // transform a point on the ellipse to get the transformed radius
    const radiusPoint = applyMatrix({ x: cx + rx, y: cy + ry }, svgTransform);
    const transformedRx = radiusPoint.x - center.x;
    const transformedRy = radiusPoint.y - center.y;
    let result;
    if (isIdentityTransform(svgTransform) || isTranslationTransform(svgTransform)) {
        // Simple case, there's no transform and we can use the ellipse command
        result = context.rc.ellipse(center.x, center.y, 2 * transformedRx, 2 * transformedRy, {
            ...parseStyleConfig(context, ellipse, svgTransform),
            preserveVertices: true
        });
    }
    else {
        // in other cases we need to construct the path manually.
        const factor = (4 / 3) * (Math.sqrt(2) - 1);
        const p1 = applyMatrix({ x: cx + rx, y: cy }, svgTransform);
        const p2 = applyMatrix({ x: cx, y: cy + ry }, svgTransform);
        const p3 = applyMatrix({ x: cx - rx, y: cy }, svgTransform);
        const p4 = applyMatrix({ x: cx, y: cy - ry }, svgTransform);
        const c1 = applyMatrix({ x: cx + rx, y: cy + factor * ry }, svgTransform);
        const c2 = applyMatrix({ x: cx + factor * rx, y: cy + ry }, svgTransform);
        const c4 = applyMatrix({ x: cx - rx, y: cy + factor * ry }, svgTransform);
        const c6 = applyMatrix({ x: cx - factor * rx, y: cy - ry }, svgTransform);
        const c8 = applyMatrix({ x: cx + rx, y: cy - factor * ry }, svgTransform);
        const path = `M ${str(p1)} C ${str(c1)} ${str(c2)} ${str(p2)} S ${str(c4)} ${str(p3)} S ${str(c6)} ${str(p4)} S ${str(c8)} ${str(p1)}z`;
        result = sketchPath(context, path, parseStyleConfig(context, ellipse, svgTransform));
    }
    appendPatternPaint(context, ellipse, () => {
        const proxy = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        proxy.cx.baseVal.value = center.x;
        proxy.cy.baseVal.value = center.y;
        proxy.rx.baseVal.value = transformedRx;
        proxy.ry.baseVal.value = transformedRy;
        return proxy;
    });
    appendSketchElement(context, ellipse, result);
}
export function applyEllipseClip(context, ellipse, container, svgTransform) {
    const cx = ellipse.cx.baseVal.value;
    const cy = ellipse.cy.baseVal.value;
    const rx = ellipse.rx.baseVal.value;
    const ry = ellipse.ry.baseVal.value;
    if (rx === 0 || ry === 0) {
        // zero-radius ellipse is not rendered
        return;
    }
    const clip = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    clip.cx.baseVal.value = cx;
    clip.cy.baseVal.value = cy;
    clip.rx.baseVal.value = rx;
    clip.ry.baseVal.value = ry;
    applyTransform(context, svgTransform, clip);
    container.appendChild(clip);
}
