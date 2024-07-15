import { getNodeChildren } from '../dom-helpers.js';
import { getEffectiveAttribute } from '../styles/effective-attributes.js';
import { concatStyleStrings } from '../styles/styles.js';
import { convertToPixelUnit } from '../svg-units.js';
import { applyTransform } from '../transformation.js';
import { SKETCH_CLIP_ATTRIBUTE, appendSketchElement, measureText } from '../utils.js';

export function drawText(context, text, svgTransform) {
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    container.setAttribute('class', 'text-container');
    applyTransform(context, svgTransform, container);
    const textClone = text.cloneNode(true);
    if (textClone.transform.baseVal.numberOfItems > 0) {
        // remove transformation, since it is transformed globally by its parent container
        textClone.transform.baseVal.clear();
    }
    // clip-path is applied on the container
    textClone.removeAttribute('clip-path');
    const { cssFont, fontSize: effectiveFontSize } = getCssFont(context, text, true);
    textClone.setAttribute('style', concatStyleStrings(textClone.getAttribute('style'), cssFont));
    copyTextStyleAttributes(context, text, textClone);
    // apply styling to any tspan
    if (textClone.childElementCount > 0) {
        const children = getNodeChildren(textClone);
        const origChildren = getNodeChildren(text);
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child instanceof SVGTSpanElement) {
                copyTextStyleAttributes(context, origChildren[i], child);
            }
        }
    }
    container.appendChild(textClone);
    appendSketchElement(context, text, container);
    // avoid text clipping by scaling the text when changing the font
    const useCustomFontFamily = context.fontFamily !== null;
    const hasClipPath = textClone.hasAttribute(SKETCH_CLIP_ATTRIBUTE);
    if (useCustomFontFamily && hasClipPath && effectiveFontSize) {
        fitFontSize(context, text, textClone, effectiveFontSize);
    }
}
/**
 * Applies a font-size on the clone such that the clone has a smaller width than the original element.
 * Only fits the width because the height is usually no problem wrt. clipping.
 */
function fitFontSize(context, original, clone, effectiveFontSize) {
    const { width, height } = original.getBBox();
    if (width <= 0 || height <= 0) {
        return;
    }
    const fontSizePx = convertToPixelUnit(context, clone, effectiveFontSize, 'font-size');
    fitFontSizeCore(context, { w: width, h: height }, clone, fontSizePx);
}
/**
 * Recursively shrinks the font-size on the element until its width is smaller than the original width.
 */
function fitFontSizeCore(context, originalSize, clone, fontSizePx) {
    const STEP_SIZE = 1;
    const { w: cloneWidth } = measureText(context, clone);
    if (cloneWidth < originalSize.w) {
        // fits original width
        return;
    }
    if (fontSizePx <= 1) {
        // already too small
        return;
    }
    // try a smaller size
    const newFontSize = fontSizePx - STEP_SIZE;
    clone.style.fontSize = `${newFontSize}px`;
    // check again
    fitFontSizeCore(context, originalSize, clone, newFontSize);
}
/**
 * @param asStyleString Formats the return value as inline style string
 */
function getCssFont(context, text, asStyleString = false) {
    const effectiveAttributes = {};
    let cssFont = '';
    const fontStyle = getEffectiveAttribute(context, text, 'font-style', context.useElementContext);
    if (fontStyle) {
        cssFont += asStyleString ? `font-style: ${fontStyle};` : fontStyle;
        effectiveAttributes.fontStyle = fontStyle;
    }
    const fontWeight = getEffectiveAttribute(context, text, 'font-weight', context.useElementContext);
    if (fontWeight) {
        cssFont += asStyleString ? `font-weight: ${fontWeight};` : ` ${fontWeight}`;
        effectiveAttributes.fontWeight = fontWeight;
    }
    const fontSize = getEffectiveAttribute(context, text, 'font-size', context.useElementContext);
    if (fontSize) {
        cssFont += asStyleString ? `font-size: ${fontSize};` : ` ${fontSize}`;
        effectiveAttributes.fontSize = fontSize;
    }
    if (context.fontFamily) {
        cssFont += asStyleString ? `font-family: ${context.fontFamily};` : ` ${context.fontFamily}`;
        effectiveAttributes.fontFamiliy = context.fontFamily;
    }
    else {
        const fontFamily = getEffectiveAttribute(context, text, 'font-family', context.useElementContext);
        if (fontFamily) {
            cssFont += asStyleString ? `font-family: ${fontFamily};` : ` ${fontFamily}`;
            effectiveAttributes.fontFamiliy = fontFamily;
        }
    }
    cssFont = cssFont.trim();
    return { ...effectiveAttributes, cssFont };
}
function copyTextStyleAttributes(context, srcElement, tgtElement) {
    const stroke = getEffectiveAttribute(context, srcElement, 'stroke');
    const strokeWidth = stroke ? getEffectiveAttribute(context, srcElement, 'stroke-width') : null;
    const fill = getEffectiveAttribute(context, srcElement, 'fill');
    const dominantBaseline = getEffectiveAttribute(context, srcElement, 'dominant-baseline');
    const textAnchor = getEffectiveAttribute(context, srcElement, 'text-anchor', context.useElementContext);
    if (stroke) {
        tgtElement.setAttribute('stroke', stroke);
    }
    if (strokeWidth) {
        tgtElement.setAttribute('stroke-width', strokeWidth);
    }
    if (fill) {
        tgtElement.setAttribute('fill', fill);
    }
    if (textAnchor) {
        tgtElement.setAttribute('text-anchor', textAnchor);
    }
    if (dominantBaseline) {
        tgtElement.setAttribute('dominant-baseline', dominantBaseline);
    }
}
