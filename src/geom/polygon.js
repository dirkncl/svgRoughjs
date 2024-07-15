import { appendPatternPaint } from '../styles/pattern.js';
import { parseStyleConfig } from '../styles/styles.js';
import { applyTransform, applyMatrix } from '../transformation.js';
import { appendSketchElement, getPointsArray } from '../utils.js';
import { drawMarkers } from './marker.js';

export function drawPolygon(context, polygon, svgTransform) {
    const points = getPointsArray(polygon);
    const transformed = points.map(p => {
        const pt = applyMatrix(p, svgTransform);
        return [pt.x, pt.y];
    });
    const polygonSketch = context.rc.polygon(transformed, parseStyleConfig(context, polygon, svgTransform));
    appendPatternPaint(context, polygon, () => {
        const proxy = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        proxy.setAttribute('points', transformed.join(' '));
        return proxy;
    });
    appendSketchElement(context, polygon, polygonSketch);
    // https://www.w3.org/TR/SVG11/painting.html#MarkerProperties
    // Note that for a ‘path’ element which ends with a closed sub-path,
    // the last vertex is the same as the initial vertex on the given
    // sub-path (same applies to polygon).
    if (points.length > 0) {
        points.push(points[0]);
        drawMarkers(context, polygon, points, svgTransform);
    }
}
export function applyPolygonClip(context, polygon, container, svgTransform) {
    const clip = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    clip.setAttribute('points', polygon.getAttribute('points'));
    applyTransform(context, svgTransform, clip);
    container.appendChild(clip);
}
