export function downloadFile(content, mime, fileName) {
    const link = document.createElement('a');
    const configBlob = new Blob([content], { type: mime });
    link.download = fileName;
    link.href = URL.createObjectURL(configBlob);
    link.click();
}
