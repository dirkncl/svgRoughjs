import { appendPatternPaint } from '../styles/pattern.js';
import { parseStyleConfig } from '../styles/styles.js';
import { applyMatrix } from '../transformation.js';
import { appendSketchElement, getPointsArray } from '../utils.js';
import { drawMarkers } from './marker.js';

export function drawPolyline(context, polyline, svgTransform) {
    const points = getPointsArray(polyline);
    const transformed = points.map(p => {
        const pt = applyMatrix(p, svgTransform);
        return [pt.x, pt.y];
    });
    const style = parseStyleConfig(context, polyline, svgTransform);
    appendPatternPaint(context, polyline, () => {
        const proxy = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        proxy.setAttribute('points', transformed.join(' '));
        return proxy;
    });
    if (style.fill && style.fill !== 'none') {
        const fillStyle = { ...style, stroke: 'none' };
        appendSketchElement(context, polyline, context.rc.polygon(transformed, fillStyle));
    }
    appendSketchElement(context, polyline, context.rc.linearPath(transformed, style));
    drawMarkers(context, polyline, points, svgTransform);
}
