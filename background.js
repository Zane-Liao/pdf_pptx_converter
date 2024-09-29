chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'convertFile') {
        const file = request.file;
        const convertType = request.convertType;

        // 由于无法直接在 Service Worker 中读取文件，需要使用 FileReader
        const reader = new FileReader();

        reader.onload = function(e) {
            const arrayBuffer = e.target.result;

            // 这里调用转换函数（需要实现）
            convertFile(arrayBuffer, convertType).then((convertedArrayBuffer) => {
                const convertedBlob = new Blob([convertedArrayBuffer], { type: getMimeType(convertType) });
                sendResponse({
                    success: true,
                    convertedFile: convertedBlob,
                    fileName: getFileName(file.name, convertType)
                });
            }).catch((error) => {
                sendResponse({
                    success: false,
                    error: error.message
                });
            });
        };

        reader.onerror = function(error) {
            sendResponse({
                success: false,
                error: error.message
            });
        };

        reader.readAsArrayBuffer(file);

        // 必须返回 true 以表示响应是异步的
        return true;
    }
});

function getMimeType(convertType) {
    return convertType === 'pdfToPptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'application/pdf';
}

function getFileName(originalName, convertType) {
    const newExtension = convertType === 'pdfToPptx' ? '.pptx' : '.pdf';
    return originalName.replace(/\.[^/.]+$/, newExtension);
}

// 模拟转换函数，需要实际实现
function convertFile(arrayBuffer, convertType) {
    return new Promise((resolve, reject) => {
        // TODO: 实现实际的文件转换逻辑
        // 这里仅做示例，直接返回原始数据
        resolve(arrayBuffer);
    });
}