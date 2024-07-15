import { getParentElement } from '../dom-helpers.js';

/**
 * Returns the attribute value of an element under consideration
 * of inherited attributes from the `parentElement`.
 * @param attributeName Name of the attribute to look up
 * @param currentUseCtx Consider different DOM hierarchy for use elements
 * @return attribute value if it exists
 */
export function getEffectiveAttribute(context, element, attributeName, currentUseCtx) {
    // getComputedStyle doesn't work for, e.g. <svg fill='rgba(...)'>
    let attr;
    if (!currentUseCtx) {
        attr =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            getComputedStyle(element)[attributeName] || element.getAttribute(attributeName);
    }
    else {
        // use elements traverse a different parent-hierarchy, thus we cannot use getComputedStyle here
        attr = element.getAttribute(attributeName);
    }
    if (!attr) {
        let parent = getParentElement(element);
        const useCtx = currentUseCtx;
        let nextCtx = useCtx;
        if (useCtx && useCtx.referenced === element) {
            // switch context and traverse the use-element parent now
            parent = useCtx.root;
            nextCtx = useCtx.parentContext;
        }
        if (!parent || parent === context.sourceSvg) {
            return;
        }
        return getEffectiveAttribute(context, parent, attributeName, nextCtx);
    }
    return attr;
}
/**
 * Traverses the given elements hierarchy bottom-up to determine its effective
 * opacity attribute.
 * @param currentUseCtx Consider different DOM hierarchy for use elements
 */
export function getEffectiveElementOpacity(context, element, currentOpacity, currentUseCtx) {
    let attr;
    if (!currentUseCtx) {
        attr = getComputedStyle(element)['opacity'] || element.getAttribute('opacity');
    }
    else {
        // use elements traverse a different parent-hierarchy, thus we cannot use getComputedStyle here
        attr = element.getAttribute('opacity');
    }
    if (attr) {
        let elementOpacity = 1;
        if (attr.indexOf('%') !== -1) {
            elementOpacity = Math.min(1, Math.max(0, parseFloat(attr.substring(0, attr.length - 1)) / 100));
        }
        else {
            elementOpacity = Math.min(1, Math.max(0, parseFloat(attr)));
        }
        // combine opacities
        currentOpacity *= elementOpacity;
    }
    // traverse upwards to combine parent opacities as well
    let parent = getParentElement(element);
    const useCtx = currentUseCtx;
    let nextUseCtx = useCtx;
    if (useCtx && useCtx.referenced === element) {
        // switch context and traverse the use-element parent now
        parent = useCtx.root;
        nextUseCtx = useCtx.parentContext;
    }
    if (!parent || parent === context.sourceSvg) {
        return currentOpacity;
    }
    return getEffectiveElementOpacity(context, parent, currentOpacity, nextUseCtx);
}
