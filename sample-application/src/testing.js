import { OutputType } from '../../src/index.js';
import { downloadFile } from './utils.js';
import { specTests } from '../../test/tests.js';
import { loadSvgString } from './index.js';

const localTestsContainer = document.getElementById('local-testing');
const downloadTestcaseBtn = document.getElementById('download-testcase');
const testcaseSelect = document.getElementById('select-testcase');
const prevTestcaseBtn = document.getElementById('prev-testcase');
const nextTestcaseBtn = document.getElementById('next-testcase');
export function initializeTestUI(svg2roughjs) {
    if (location.hostname !== 'localhost') {
        localTestsContainer.style.display = 'none';
    }
    for (const testName of specTests) {
        const option = document.createElement('option');
        option.value = testName;
        option.text = testName;
        testcaseSelect.appendChild(option);
    }
    testcaseSelect.addEventListener('change', e => onTestcaseChange(e.target.value));
    prevTestcaseBtn.addEventListener('click', () => {
        const idx = testcaseSelect.selectedIndex;
        if (idx > 1) {
            testcaseSelect.selectedIndex = idx - 1;
        }
        onTestcaseChange(testcaseSelect.options[testcaseSelect.selectedIndex].value);
    });
    nextTestcaseBtn.addEventListener('click', () => {
        const idx = testcaseSelect.selectedIndex;
        if (idx < testcaseSelect.childElementCount - 1) {
            testcaseSelect.selectedIndex = idx + 1;
        }
        onTestcaseChange(testcaseSelect.options[testcaseSelect.selectedIndex].value);
    });
    downloadTestcaseBtn.addEventListener('click', () => downloadTestcase(svg2roughjs));
}
async function onTestcaseChange(testName) {
    const svgString = loadSvg(`/specs/${testName}/test.svg`);
    loadSvgString(svgString);
}
function loadSvg(url) {
    const request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.overrideMimeType('text/plain; charset=utf-8');
    request.send();
    if (request.status !== 200) {
        throw new Error(`Unable to fetch ${url}, status code: ${request.status}`);
    }
    return request.responseText;
}
function isExistingTestcase(testcase) {
    return specTests.indexOf(testcase) !== -1;
}
/**
 * Creates a reproducible testcase
 */
async function downloadTestcase(svg2roughjs) {
    const prevRandomize = svg2roughjs.randomize;
    const prevPencilFilter = svg2roughjs.pencilFilter;
    const prevOutputType = svg2roughjs.outputType;
    const prevSketchPatters = svg2roughjs.sketchPatterns;
    const prevConfig = Object.assign({}, svg2roughjs.roughConfig);
    svg2roughjs.randomize = false;
    svg2roughjs.pencilFilter = false;
    svg2roughjs.sketchPatterns = true;
    svg2roughjs.outputType = OutputType.SVG;
    svg2roughjs.backgroundColor = 'white';
    svg2roughjs.roughConfig = {
        ...svg2roughjs.roughConfig,
        fixedDecimalPlaceDigits: 3,
        fillStyle: 'solid',
        seed: 4242
    };
    await svg2roughjs.sketch();
    const serializer = new XMLSerializer();
    const testcaseName = testcaseSelect.options[testcaseSelect.selectedIndex].value;
    if (!isExistingTestcase(testcaseName)) {
        const test = document.querySelector('#input svg');
        let inputSvg = serializer.serializeToString(test);
        inputSvg = '<?xml version="1.0" standalone="no"?>\r\n' + inputSvg;
        downloadFile(inputSvg, 'image/svg+xml', 'test.svg');
    }
    const spec = document.querySelector('#output svg');
    let sketchedSvg = serializer.serializeToString(spec);
    sketchedSvg = '<?xml version="1.0" standalone="no"?>\r\n' + sketchedSvg;
    downloadFile(sketchedSvg, 'image/svg+xml', 'expect.svg');
    const config = {
        roughConfig: svg2roughjs.roughConfig,
        outputType: svg2roughjs.outputType,
        pencilFilter: svg2roughjs.pencilFilter,
        sketchPatterns: svg2roughjs.sketchPatterns,
        backgroundColor: 'white'
    };
    downloadFile(JSON.stringify(config), 'text/json', 'config.json');
    // reset state to before testcase creation
    svg2roughjs.randomize = prevRandomize;
    svg2roughjs.pencilFilter = prevPencilFilter;
    svg2roughjs.outputType = prevOutputType;
    svg2roughjs.sketchPatterns = prevSketchPatters;
    svg2roughjs.roughConfig = prevConfig;
    await svg2roughjs.sketch();
}
