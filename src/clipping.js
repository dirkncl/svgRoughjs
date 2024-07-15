import { getIdFromUrl, getNodeChildren } from './dom-helpers.js';
import { applyCircleClip } from './geom/circle.js';
import { applyEllipseClip } from './geom/ellipse.js';
import { applyPathClip } from './geom/path.js';
import { applyPolygonClip } from './geom/polygon.js';
import { applyRectClip } from './geom/rect.js';
import { getCombinedTransform } from './transformation.js';
import { getDefsElement, SKETCH_CLIP_ATTRIBUTE } from './utils.js';

/**
 * Applies the clip-path to the CanvasContext.
 */
export function applyClipPath(context, owner, clipPathAttr, svgTransform) {
    const id = getIdFromUrl(clipPathAttr);
    if (!id) {
        return;
    }
    const clipPath = context.idElements[id];
    if (!clipPath) {
        return;
    }
    // TODO clipPath: consider clipPathUnits
    //  create clipPath defs
    const targetDefs = getDefsElement(context);
    // unfortunately, we cannot reuse clip-paths due to the 'global transform' approach
    const sketchClipPathId = `${id}_${targetDefs.childElementCount}`;
    const clipContainer = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipContainer.id = sketchClipPathId;
    storeSketchClipId(owner, sketchClipPathId);
    // traverse clip-path elements in DFS
    const stack = [];
    const children = getNodeChildren(clipPath);
    for (let i = children.length - 1; i >= 0; i--) {
        const childElement = children[i];
        const childTransform = getCombinedTransform(context, childElement, svgTransform);
        stack.push({ element: childElement, transform: childTransform });
    }
    while (stack.length > 0) {
        const { element, transform } = stack.pop();
        try {
            applyElementClip(context, element, clipContainer, transform);
        }
        catch (e) {
            console.error(e);
        }
        if (element.tagName === 'defs' ||
            element.tagName === 'svg' ||
            element.tagName === 'clipPath' ||
            element.tagName === 'text') {
            // some elements are ignored on clippaths
            continue;
        }
        // process children
        const children = getNodeChildren(element);
        for (let i = children.length - 1; i >= 0; i--) {
            const childElement = children[i];
            const childTransform = getCombinedTransform(context, childElement, transform);
            stack.push({ element: childElement, transform: childTransform });
        }
    }
    if (clipContainer.childNodes.length > 0) {
        // add the clip-path only if it contains converted elements
        // some elements are not yet supported
        targetDefs.appendChild(clipContainer);
    }
}
/**
 * Creates a clip element and appends it to the given container.
 */
function applyElementClip(context, element, container, svgTransform) {
    switch (element.tagName) {
        case 'rect':
            applyRectClip(context, element, container, svgTransform);
            break;
        case 'circle':
            applyCircleClip(context, element, container, svgTransform);
            break;
        case 'ellipse':
            applyEllipseClip(context, element, container, svgTransform);
            break;
        case 'polygon':
            applyPolygonClip(context, element, container, svgTransform);
            break;
        case 'path':
            applyPathClip(context, element, container, svgTransform);
            break;
    }
}
/**
 * Store clippath-id on each child for <g> elements, or on the owner itself for other
 * elements.
 *
 * <g> elements are skipped in the processing loop, thus the clip-path id must be stored
 * on the child elements.
 */
function storeSketchClipId(element, id) {
    if (element.tagName !== 'g') {
        element.setAttribute(SKETCH_CLIP_ATTRIBUTE, id);
        return;
    }
    const stack = [];
    const children = getNodeChildren(element);
    for (let i = children.length - 1; i >= 0; i--) {
        stack.push(children[i]);
    }
    while (stack.length > 0) {
        const element = stack.pop();
        element.setAttribute(SKETCH_CLIP_ATTRIBUTE, id);
        const children = getNodeChildren(element);
        for (let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
        }
    }
}
