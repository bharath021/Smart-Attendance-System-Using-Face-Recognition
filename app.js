const video = document.getElementById('video');
const captureBtn = document.getElementById('capture-btn');
const resultDiv = document.getElementById('result');

// Load face-api models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models') // Load SsdMobilenetv1 model as well
]).then(startVideo).catch(err => {
    console.error('Error loading models:', err);
});

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => console.error('Error accessing webcam:', err));
}

video.addEventListener('loadedmetadata', () => {
    // Ensure the video has started playing
    video.play();
});

video.addEventListener('playing', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    }, 100);
});

captureBtn.addEventListener('click', async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

    if (detections.length > 0) {
        resultDiv.innerHTML = 'Face detected!';
        
        // Extract face descriptors (these are the key data points)
        const faceDescriptors = detections.map(d => d.descriptor);

        // Prepare the data to send to the backend
        const payload = {
            descriptors: faceDescriptors,
            // Optionally, you can add additional data like timestamp, video frame, etc.
        };

        // Send the data to the backend for recognition
        fetch('/api/recognize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => {
            // Handle the response from the backend
            if (data.recognized) {
                resultDiv.innerHTML += `<br>Recognized as: ${data.name}`;
            } else {
                resultDiv.innerHTML += '<br>Face not recognized.';
            }
        })
        .catch(error => {
            console.error('Error sending face data:', error);
            resultDiv.innerHTML += '<br>Error processing face data.';
        });
    } else {
        resultDiv.innerHTML = 'No face detected.';
    }
});
