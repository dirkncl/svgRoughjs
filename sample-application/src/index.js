import CodeMirror from '../../node_modules/codemirror-6.65.7/src/codemirror.js';
import '../../node_modules/codemirror-6.65.7/mode/xml/xml.js';
import { OutputType, Svg2Roughjs } from '../../src/index.js';
import { initializeTestUI } from './testing.js';
import styles from './assets/styles.css' with { type: "css" };

const SAMPLE_BPMN = await (await fetch('./src/samples/bpmn1.svg')).text();
const SAMPLE_COMPUTER_NETWORK = await (await fetch('./src/samples/computer-network.svg')).text();
const SAMPLE_FLOWCHART = await (await fetch('./src/samples/flowchart4.svg')).text();
const SAMPLE_HIERARCHICAL1 = await (await fetch('./src/samples/hierarchical1.svg')).text();
const SAMPLE_HIERARCHICAL2 = await (await fetch('./src/samples/hierarchical2.svg')).text();
const SAMPLE_MINDMAP = await (await fetch('./src/samples/mindmap.svg')).text();
const SAMPLE_MOVIES = await (await fetch('./src/samples/movies.svg')).text();
const SAMPLE_ORGANIC1 = await (await fetch('./src/samples/organic1.svg')).text();
const SAMPLE_ORGANIC2 = await (await fetch('./src/samples/organic2.svg')).text();
const SAMPLE_TREE = await (await fetch('./src/samples/tree1.svg')).text();
const SAMPLE_VENN = await (await fetch('./src/samples/venn.svg')).text();

document.adoptedStyleSheets.push(styles);
let svg2roughjs;
let loadingSvg = false;
let scheduledLoad = null;
let debouncedTimer = null;
let codeMirrorInstance;
// just for easier access, it's a debug project, so who cares...
const patternsCheckbox = document.getElementById('sketchPatterns');
const pencilCheckbox = document.getElementById('pencilFilter');
const sampleSelect = document.getElementById('sample-select');
const codeContainer = document.querySelector('.raw-svg-container');
const fillStyleSelect = document.getElementById('fill-style');
const outputFormatSelect = document.getElementById('output-format');
const roughnessInput = document.getElementById('roughness-input');
const bowingInput = document.getElementById('bowing-input');
const opacityInput = document.getElementById('opacity');
const fileInput = document.getElementById('file-chooser');
const originalFontCheckbox = document.getElementById('original-font');
const randomizeCheckbox = document.getElementById('randomize');
const onCodeMirrorChange = () => {
    if (debouncedTimer) {
        clearTimeout(debouncedTimer);
    }
    debouncedTimer = setTimeout(() => {
        debouncedTimer = null;
        try {
            loadSvgString(codeMirrorInstance.getValue());
        }
        catch (e) {
            /* do nothing */
        }
    }, 500);
};
/**
 * Sets CodeMirror content without triggering the change listener
 */
function setCodeMirrorValue(value) {
    codeMirrorInstance.off('change', onCodeMirrorChange);
    codeMirrorInstance.setValue(value);
    codeMirrorInstance.on('change', onCodeMirrorChange);
}
function getSvgSize(svg) {
    let width, height;
    const hasViewbox = svg.hasAttribute('viewBox');
    if (svg.hasAttribute('width')) {
        // percantage sizes for the root SVG are unclear, thus use viewBox if available
        if (svg.width.baseVal.unitType === SVGLength.SVG_LENGTHTYPE_PERCENTAGE && hasViewbox) {
            width = svg.viewBox.baseVal.width;
        }
        else {
            width = svg.width.baseVal.value;
        }
    }
    else if (hasViewbox) {
        width = svg.viewBox.baseVal.width;
    }
    else {
        width = 300;
    }
    if (svg.hasAttribute('height')) {
        // percantage sizes for the root SVG are unclear, thus use viewBox if available
        if (svg.height.baseVal.unitType === SVGLength.SVG_LENGTHTYPE_PERCENTAGE && hasViewbox) {
            height = svg.viewBox.baseVal.height;
        }
        else {
            height = svg.height.baseVal.value;
        }
    }
    else if (hasViewbox) {
        height = svg.viewBox.baseVal.height;
    }
    else {
        height = 150;
    }
    return { width, height };
}
export function loadSvgString(fileContent) {
    if (loadingSvg) {
        scheduledLoad = fileContent;
        return;
    }
    setUIState(false);
    loadingSvg = true;
    const inputElement = document.getElementById('input');
    const outputElement = document.getElementById('output');
    const canvas = outputElement.querySelector('canvas');
    const parser = new DOMParser();
    const doc = parser.parseFromString(fileContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    while (inputElement.childElementCount > 0) {
        inputElement.removeChild(inputElement.firstChild);
    }
    if (!svg) {
        console.error('Could not load SVG file');
        setUIState(true);
        loadingSvg = false;
        return;
    }
    const svgSize = getSvgSize(svg);
    if (svgSize) {
        inputElement.style.width = `${svgSize.width}px`;
        inputElement.style.height = `${svgSize.height}px`;
    }
    inputElement.appendChild(svg);
    // make sure the SVG is part of the DOM and rendered, before it is converted by
    // Svg2Rough.js. Otherwise, CSS percentaged width/height might not be applied yet
    setTimeout(async () => {
        if (svg.tagName === 'HTML') {
            console.error('Error parsing XML');
            inputElement.style.opacity = '1';
            inputElement.style.width = '100%';
            inputElement.style.height = '100%';
            if (canvas) {
                canvas.style.opacity = '0';
            }
        }
        else {
            const opacityInput = document.getElementById('opacity');
            inputElement.style.opacity = opacityInput.value;
            if (canvas) {
                canvas.style.opacity = '1';
            }
            try {
                svg2roughjs.svg = svg;
                await svg2roughjs.sketch();
            }
            catch (e) {
                console.error("Couldn't sketch content");
                throw e; // re-throw to show error on console
            }
            finally {
                setUIState(true);
                loadingSvg = false;
            }
            // maybe there was a load during the rendering.. so load this instead
            if (scheduledLoad) {
                loadSvgString(scheduledLoad);
                scheduledLoad = null;
            }
        }
    }, 0);
}
function loadSample(sample) {
    let sampleString = '';
    switch (sample) {
        case 'bpmn1':
            sampleString = SAMPLE_BPMN;
            break;
        case 'computer-network':
            sampleString = SAMPLE_COMPUTER_NETWORK;
            break;
        case 'flowchart4':
            sampleString = SAMPLE_FLOWCHART;
            break;
        case 'hierarchical1':
            sampleString = SAMPLE_HIERARCHICAL1;
            break;
        case 'hierarchical2':
            sampleString = SAMPLE_HIERARCHICAL2;
            break;
        case 'mindmap':
            sampleString = SAMPLE_MINDMAP;
            break;
        case 'movies':
            sampleString = SAMPLE_MOVIES;
            break;
        case 'organic1':
            sampleString = SAMPLE_ORGANIC1;
            break;
        case 'organic2':
            sampleString = SAMPLE_ORGANIC2;
            break;
        case 'tree1':
            sampleString = SAMPLE_TREE;
            break;
        case 'venn':
            sampleString = SAMPLE_VENN;
            break;
    }
    setCodeMirrorValue(sampleString);
    loadSvgString(sampleString);
}
function updateOpacity(inputContainerOpacity) {
    const inputContainer = document.getElementById('input');
    const outputContainer = document.getElementById('output');
    inputContainer.style.opacity = `${inputContainerOpacity}`;
    outputContainer.style.opacity = `${1 - inputContainerOpacity}`;
}
function run() {
    svg2roughjs = new Svg2Roughjs('#output', OutputType.SVG);
    svg2roughjs.backgroundColor = 'white';
    svg2roughjs.pencilFilter = !!pencilCheckbox.checked;
    svg2roughjs.sketchPatterns = !!patternsCheckbox.checked;
    svg2roughjs.roughConfig = {
        bowing: parseInt(bowingInput.value),
        roughness: parseInt(roughnessInput.value),
        fillStyle: fillStyleSelect.value
    };
    sampleSelect.addEventListener('change', () => {
        loadSample(sampleSelect.value);
    });
    const toggleSourceBtn = document.getElementById('source-toggle');
    toggleSourceBtn.addEventListener('change', () => {
        if (toggleSourceBtn.checked) {
            codeContainer.classList.remove('hidden');
            setTimeout(() => {
                codeMirrorInstance.refresh();
                codeMirrorInstance.focus();
            }, 20);
        }
        else {
            codeContainer.classList.add('hidden');
        }
    });
    codeMirrorInstance = CodeMirror(codeContainer, {
        mode: 'xml',
        lineNumbers: true
    });
    // make sure codemirror is rendered when the expand animation has finished
    codeContainer.addEventListener('transitionend', () => {
        if (toggleSourceBtn.checked) {
            codeMirrorInstance.refresh();
            codeMirrorInstance.focus();
        }
    });
    // pre-select a sample
    sampleSelect.selectedIndex = 0;
    loadSample(sampleSelect.value);
    outputFormatSelect.addEventListener('change', async () => {
        setUIState(false);
        svg2roughjs.outputType = outputFormatSelect.value === 'svg' ? OutputType.SVG : OutputType.CANVAS;
        await svg2roughjs.sketch();
        setUIState(true);
    });
    fillStyleSelect.addEventListener('change', async () => {
        svg2roughjs.roughConfig = {
            bowing: parseInt(bowingInput.value),
            roughness: parseInt(roughnessInput.value),
            fillStyle: fillStyleSelect.value
        };
        setUIState(false);
        await svg2roughjs.sketch();
        setUIState(true);
    });
    roughnessInput.addEventListener('change', async () => {
        svg2roughjs.roughConfig = {
            bowing: parseInt(bowingInput.value),
            roughness: parseInt(roughnessInput.value),
            fillStyle: fillStyleSelect.value
        };
        setUIState(false);
        await svg2roughjs.sketch();
        setUIState(true);
    });
    bowingInput.addEventListener('change', async () => {
        svg2roughjs.roughConfig = {
            bowing: parseInt(bowingInput.value),
            roughness: parseInt(roughnessInput.value),
            fillStyle: fillStyleSelect.value
        };
        setUIState(false);
        await svg2roughjs.sketch();
        setUIState(true);
    });
    opacityInput.addEventListener('change', () => {
        updateOpacity(parseFloat(opacityInput.value));
    });
    const opacityLabel = document.querySelector('label[for=opacity]');
    opacityLabel.addEventListener('click', () => {
        const currentOpacity = parseFloat(opacityInput.value);
        const newOpacity = currentOpacity < 1 ? 1 : 0;
        opacityInput.value = `${newOpacity}`;
        updateOpacity(newOpacity);
    });
    function loadFile(file) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.addEventListener('load', () => {
            const fileContent = reader.result;
            setCodeMirrorValue(fileContent);
            loadSvgString(fileContent);
        });
    }
    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (files && files.length > 0) {
            loadFile(files[0]);
        }
    });
    const body = document.getElementsByTagName('body')[0];
    body.addEventListener('dragover', e => {
        e.preventDefault();
    });
    body.addEventListener('drop', e => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.items) {
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                if (e.dataTransfer.items[i].kind === 'file') {
                    const file = e.dataTransfer.items[i].getAsFile();
                    if (file) {
                        loadFile(file);
                    }
                    return;
                }
            }
        }
        else if (e.dataTransfer) {
            // Use DataTransfer interface to access the file(s)
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                loadFile(e.dataTransfer.files[i]);
                return;
            }
        }
    });
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        if (svg2roughjs.outputType === OutputType.CANVAS) {
            const canvas = document.querySelector('#output canvas');
            const image = canvas.toDataURL('image/png', 1.0).replace('image/png', 'image/octet-stream');
            link.download = 'svg2roughjs.png';
            link.href = image;
        }
        else {
            const serializer = new XMLSerializer();
            const svg = document.querySelector('#output svg');
            let svgString = serializer.serializeToString(svg);
            svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
            link.download = 'svg2roughjs.svg';
            link.href = URL.createObjectURL(svgBlob);
        }
        link.click();
    });
    initializeTestUI(svg2roughjs);
    originalFontCheckbox.addEventListener('change', async () => {
        if (originalFontCheckbox.checked) {
            svg2roughjs.fontFamily = null;
        }
        else {
            svg2roughjs.fontFamily = 'Comic Sans MS, cursive';
        }
        setUIState(false);
        await svg2roughjs.sketch();
        setUIState(true);
    });
    randomizeCheckbox.addEventListener('change', async () => {
        svg2roughjs.randomize = !!randomizeCheckbox.checked;
        setUIState(false);
        await svg2roughjs.sketch();
        setUIState(true);
    });
    pencilCheckbox.addEventListener('change', async () => {
        svg2roughjs.pencilFilter = !!pencilCheckbox.checked;
        setUIState(false);
        await svg2roughjs.sketch();
        setUIState(true);
    });
    patternsCheckbox.addEventListener('change', async () => {
        svg2roughjs.sketchPatterns = !!patternsCheckbox.checked;
        setUIState(false);
        await svg2roughjs.sketch();
        setUIState(true);
    });
}
function setUIState(enabled) {
    const elements = [
        patternsCheckbox,
        pencilCheckbox,
        sampleSelect,
        fillStyleSelect,
        outputFormatSelect,
        roughnessInput,
        bowingInput,
        opacityInput,
        fileInput,
        originalFontCheckbox,
        randomizeCheckbox
    ];
    for (const ele of elements) {
        ele.disabled = !enabled;
    }
}
run();
