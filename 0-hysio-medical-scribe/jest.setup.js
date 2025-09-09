// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://jestjs.io/docs/configuration#setupfilesafterenv-array
import '@testing-library/jest-dom'

// Mock MediaRecorder for audio recording tests
global.MediaRecorder = class MediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    this.onstart = null;
    this.data = [];
  }

  start() {
    this.state = 'recording';
    if (this.onstart) this.onstart();
  }

  stop() {
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['test audio data'], { type: 'audio/wav' }) });
    }
    if (this.onstop) this.onstop();
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }

  static isTypeSupported(type) {
    return ['audio/wav', 'audio/webm', 'audio/mp4'].includes(type);
  }
};

// Mock getUserMedia for audio recording
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [{
      stop: jest.fn()
    }]
  })
};

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
});