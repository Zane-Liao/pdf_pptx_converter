  // 设置 PDF.js 的 worker 路径
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('libs/pdfjs/pdf.worker.js');

document.getElementById('convertButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const status = document.getElementById('status');

    if (fileInput.files.length === 0) {
        status.textContent = 'Please select a PDF file.';
        status.style.color = 'red';
        return;
    }

    const file = fileInput.files[0];

    if (file.type !== 'application/pdf') {
        status.textContent = 'Please select a valid PDF file.';
        status.style.color = 'red';
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        status.textContent = 'File size exceeds the 50MB limit.';
        status.style.color = 'red';
        return;
    }

    status.textContent = 'Converting...';
    status.style.color = 'blue';

    try {
        const arrayBuffer = await file.arrayBuffer();
        await convertPdfToPptx(arrayBuffer, file.name, status);
        status.textContent = 'Conversion successful! Download should start automatically.';
        status.style.color = 'green';
    } catch (error) {
        status.textContent = 'Conversion failed: ' + error.message;
        status.style.color = 'red';
    }
});

async function convertPdfToPptx(arrayBuffer, originalFileName, status) {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pptx = new PptxGenJS();

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        status.textContent = `Converting page ${pageNum} of ${pdf.numPages}...`;

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const imgData = canvas.toDataURL('image/png');

        const slide = pptx.addSlide();
        slide.addImage({ data: imgData, x: 0, y: 0, w: pptx.width, h: pptx.height });
    }

    const pptxBlob = await pptx.write('blob');
    const url = URL.createObjectURL(pptxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalFileName.replace('.pdf', '.pptx');
    a.click();
    URL.revokeObjectURL(url);
}