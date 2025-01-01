class MediaSourceHandler {
    constructor() {
        this.mediaSource = new MediaSource();
        this.audioElement = document.createElement('audio');
        this.audioElement.src = URL.createObjectURL(this.mediaSource);
        document.body.appendChild(this.audioElement);

        this.sourceBuffer = null;
        this.totalBytesBuffered = 0;

        this.mediaSource.addEventListener('sourceopen', this.onSourceOpen.bind(this));
    }

    onSourceOpen() {
        this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/webm; codecs="opus"');
        console.log("MediaSource otwarte, gotowe do dodawania fragmentów.");
        //this.monitorBufferedDataInterval = setInterval(this.monitorBufferedData.bind(this), 500);
    }

    monitorBufferedData() {
        if (!this.sourceBuffer) return;

        let buffered = this.sourceBuffer.buffered;
        this.totalBytesBuffered = 0;

        for (let i = 0; i < buffered.length; i++) {
            let start = buffered.start(i);
            let end = buffered.end(i);
            console.log(`Buffered range: ${start} - ${end} seconds`);

            let duration = end - start;
            let estimatedBytes = duration * 96000; // Przybliżona liczba bajtów
            this.totalBytesBuffered += estimatedBytes;
            console.log(`Estimated size of buffered range: ${estimatedBytes} bytes`);
        }

        console.log(`Total buffered size: ${this.totalBytesBuffered} bytes`);
    }

    /*
    addAudioFragment(fragment) {
        if (!this.sourceBuffer) {
            console.error("SourceBuffer nie jest zainicjowany.");
            return;
        }

        if (!this.sourceBuffer.updating) {
            this.sourceBuffer.appendBuffer(fragment);
        } else {
            this.sourceBuffer.addEventListener('updateend', () => {
                this.sourceBuffer.appendBuffer(fragment);
            }, { once: true });
        }
    }*/

    addAudioFragment(fragment) {
        if (!this.sourceBuffer) {
            return;
            console.error("SourceBuffer nie jest zainicjowany.");
        }
    
        const playIfPaused = () => {
            if (this.audioElement.paused && this.audioElement.buffered.length > 0) {
                const currentBuffered = this.audioElement.buffered;
                const currentTime = this.audioElement.currentTime;
    
                for (let i = 0; i < currentBuffered.length; i++) {
                    if (currentBuffered.start(i) <= currentTime && currentBuffered.end(i) > currentTime) {
                        this.audioElement.play()
                            .then(() => console.log("Odtwarzanie wznowione"))
                            .catch(err => console.error("Błąd przy wznawianiu odtwarzania:", err));
                        break;
                    }
                }
            }
        };
    
        if (!this.sourceBuffer.updating) {
            this.sourceBuffer.appendBuffer(fragment);
            playIfPaused();
        } else {
            this.sourceBuffer.addEventListener('updateend', () => {
                this.sourceBuffer.appendBuffer(fragment);
                playIfPaused();
            }, { once: true });
        }
    }

    resetPlayback() {
        this.audioElement.currentTime = 0;

        this.audioElement.play()
            .then(() => {
                console.log("Odtwarzanie rozpoczęte od początku");
            })
            .catch(err => {
                console.error("Błąd przy odtwarzaniu:", err);
            });
    }

    destroy() {
        if (this.monitorBufferedDataInterval) {
            clearInterval(this.monitorBufferedDataInterval);
        }

        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.remove();
        }

        this.mediaSource = null;
        this.sourceBuffer = null;
        console.log("MediaSourceHandler został zniszczony.");
    }
}

// Przykład użycia:
// const mediaHandler = new MediaSourceHandler();
// mediaHandler.addAudioFragment(fragment);
