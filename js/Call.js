class AudioStreamer {
    constructor(onDataCallback) {
        this.mediaRecorder = null;
        this.onDataCallback = onDataCallback;
        this.audioChunks = [];
    }

    async start() {        
        console.log(navigator.mediaDevices)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        //this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
                if (this.onDataCallback) {
                    this.onDataCallback(event.data);
                }
            }
        };
        this.mediaRecorder.start(100);
    }

    async stop() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject("Nagrywanie nie zostało rozpoczęte.");
                return;
            }
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                resolve(audioBlob);
            };
            this.mediaRecorder.stop();
        });
    }
}



class AudioPlayer {
    constructor() {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.bufferQueue = [];  
      this.isPlaying = false; 
      this.sourceNode = null; 
    }
  
    addToQueue(fragment) {
      this.bufferQueue.push(fragment);
      if (!this.isPlaying) {
        this.playNextFragment();
      }
    }
  
    async playNextFragment() {
      if (this.bufferQueue.length === 0) {
        this.isPlaying = false;
        return;
      }
  
      const fragment = this.bufferQueue.shift();
  
      try {
        const audioBuffer = await this.audioContext.decodeAudioData(fragment);
  
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = audioBuffer;
        this.sourceNode.connect(this.audioContext.destination);
        
        this.sourceNode.start();
  
        this.sourceNode.onended = () => {
          this.playNextFragment();
        };
  
        this.isPlaying = true;
      } catch (error) {
        console.error('Błąd przy dekodowaniu lub odtwarzaniu fragmentu audio:', error);
      }
    }
  }