const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');

async function recognizeFace(imagePath) {
    // Load face-api models
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk('/models'),
        faceapi.nets.faceLandmark68Net.loadFromDisk('/models'),
        faceapi.nets.faceRecognitionNet.loadFromDisk('/models')
    ]);

    // Load image and run face recognition
    const img = await canvas.loadImage(imagePath);
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

    return detections;
}

module.exports = { recognizeFace };
