import * as faceapi from 'face-api.js';

const MODEL_URI = 'https://justadudewhohacks.github.io/face-api.js/models';
const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.5,
});

let modelsPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeDescriptor = (descriptor) => {
  if (!descriptor) return null;
  const arr = Array.isArray(descriptor) ? descriptor : Array.from(descriptor);
  const normalized = arr.map((value) => Number(value));
  return normalized.some((v) => Number.isNaN(v)) ? null : normalized;
};

export const loadFaceModels = async () => {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI),
    ]);
  }

  return modelsPromise;
};

export const detectFaceWithDescriptor = async (videoElement) => {
  if (!videoElement) return null;
  if (!videoElement.videoWidth || !videoElement.videoHeight) return null;

  const result = await faceapi
    .detectSingleFace(videoElement, DETECTOR_OPTIONS)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result) return null;

  return {
    descriptor: normalizeDescriptor(result.descriptor),
    score: result.detection.score,
    box: result.detection.box,
  };
};

export const evaluateFrameQuality = (videoElement, faceBox) => {
  if (!videoElement || !faceBox || !videoElement.videoWidth || !videoElement.videoHeight) {
    return {
      isValid: false,
      reasons: ['Camera frame not ready'],
      metrics: {},
    };
  }

  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;
  const faceAreaRatio = (faceBox.width * faceBox.height) / (width * height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return {
      isValid: false,
      reasons: ['Unable to analyze camera frame'],
      metrics: {},
    };
  }

  context.drawImage(videoElement, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height).data;

  let brightnessTotal = 0;
  let edgeTotal = 0;

  const stride = 24;
  for (let y = stride; y < height - stride; y += stride) {
    for (let x = stride; x < width - stride; x += stride) {
      const index = (y * width + x) * 4;
      const leftIndex = (y * width + (x - stride)) * 4;
      const upIndex = ((y - stride) * width + x) * 4;

      const gray = imageData[index] * 0.299 + imageData[index + 1] * 0.587 + imageData[index + 2] * 0.114;
      const grayLeft =
        imageData[leftIndex] * 0.299 +
        imageData[leftIndex + 1] * 0.587 +
        imageData[leftIndex + 2] * 0.114;
      const grayUp =
        imageData[upIndex] * 0.299 +
        imageData[upIndex + 1] * 0.587 +
        imageData[upIndex + 2] * 0.114;

      brightnessTotal += gray;
      edgeTotal += Math.abs(gray - grayLeft) + Math.abs(gray - grayUp);
    }
  }

  const sampleCount = Math.max(1, Math.floor((width / stride) * (height / stride)));
  const avgBrightness = brightnessTotal / sampleCount;
  const sharpness = edgeTotal / sampleCount;

  const reasons = [];
  if (faceAreaRatio < 0.075) reasons.push('Move closer to camera');
  if (avgBrightness < 60) reasons.push('Increase lighting');
  if (avgBrightness > 220) reasons.push('Reduce overexposure/glare');
  if (sharpness < 26) reasons.push('Hold still for a clearer frame');

  return {
    isValid: reasons.length === 0,
    reasons,
    metrics: {
      faceAreaRatio,
      avgBrightness,
      sharpness,
    },
  };
};

export const averageDescriptors = (descriptors) => {
  if (!Array.isArray(descriptors) || descriptors.length === 0) return null;
  const length = descriptors[0].length;
  if (!length) return null;

  const sum = new Array(length).fill(0);
  for (const descriptor of descriptors) {
    if (!Array.isArray(descriptor) || descriptor.length !== length) return null;
    for (let index = 0; index < length; index += 1) {
      sum[index] += descriptor[index];
    }
  }

  return sum.map((value) => Number((value / descriptors.length).toFixed(8)));
};

export const buildStableDescriptorFromVideo = async (videoElement, options = {}) => {
  const frames = options.frames || 5;
  const minValidFrames = options.minValidFrames || 3;
  const delayMs = options.delayMs || 180;

  const validDescriptors = [];
  let lastQualityFailure = null;

  for (let frame = 0; frame < frames; frame += 1) {
    const detection = await detectFaceWithDescriptor(videoElement);
    if (detection?.descriptor) {
      const quality = evaluateFrameQuality(videoElement, detection.box);
      if (quality.isValid) {
        validDescriptors.push(detection.descriptor);
      } else {
        lastQualityFailure = quality;
      }
    }

    if (frame < frames - 1) {
      await sleep(delayMs);
    }
  }

  if (validDescriptors.length < minValidFrames) {
    return {
      descriptor: null,
      descriptors: validDescriptors,
      validFrames: validDescriptors.length,
      qualityFailure: lastQualityFailure,
    };
  }

  return {
    descriptor: averageDescriptors(validDescriptors),
    descriptors: validDescriptors,
    validFrames: validDescriptors.length,
    qualityFailure: null,
  };
};

export const descriptorDistance = (a, b) => {
  const left = normalizeDescriptor(a);
  const right = normalizeDescriptor(b);
  if (!left || !right || left.length !== right.length) return Number.POSITIVE_INFINITY;

  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    const diff = left[index] - right[index];
    total += diff * diff;
  }

  return Math.sqrt(total);
};

export const findBestFaceMatch = (descriptor, students, threshold = 0.56) => {
  const source = normalizeDescriptor(descriptor);
  if (!source || !Array.isArray(students) || students.length === 0) {
    return { match: null, distance: Number.POSITIVE_INFINITY, confidence: 0 };
  }

  let match = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const student of students) {
    const descriptorPool = [];

    const primary = normalizeDescriptor(student.faceDescriptor);
    if (primary) {
      descriptorPool.push(primary);
    }

    if (Array.isArray(student.faceSamples)) {
      for (const sample of student.faceSamples) {
        const normalizedSample = normalizeDescriptor(sample);
        if (normalizedSample) {
          descriptorPool.push(normalizedSample);
        }
      }
    }

    for (const target of descriptorPool) {
      if (!target || target.length !== source.length) continue;

      const distance = descriptorDistance(source, target);
      if (distance < bestDistance) {
        bestDistance = distance;
        match = student;
      }
    }
  }

  if (!match || bestDistance > threshold) {
    return { match: null, distance: bestDistance, confidence: 0 };
  }

  const confidence = Math.max(0, Math.min(100, Math.round((1 - bestDistance / threshold) * 100)));
  return { match, distance: bestDistance, confidence };
};
