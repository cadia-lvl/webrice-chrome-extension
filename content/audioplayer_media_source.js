class AudioPlayer {
    constructor() {
        this.mediaSource = null;
        this.audio = new Audio();
        this.playbackRate = 1;
        this.text = '';
        this.voice = '';
        this.sourceBuffer = undefined;
        this.readers = [];
    }

    compareText = (text) => {
        return this.text == text;
    };

    play = () => {
        if (!this.isPlaying()) this.audio.play();
    };

    pause = () => {
        this.audio.pause();
    };

    stop = async () => {
        this.audio.pause();
        this.audio.currentTime = 0;
    };

    isPlaying = () => {
        return !this.audio.paused;
    };

    setupPlayer = async (readers, text, playbackRate, voice) => {
        this.stop();
        this.mediaSource = new MediaSource();
        this.audio.src = window.URL.createObjectURL(this.mediaSource);
        this.readers = readers;
        this.setPlaybackRate(playbackRate);
        this.text = text;
        this.voice = voice;

        this.mediaSource.addEventListener('sourceopen', this.openSource);
    };

    openSource = async (_) => {
        this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');
        for (const reader of this.readers) {
            await this.stream(reader);
        }
        this.mediaSource.endOfStream();
    };

    stream = async (reader) => {
        let streamNotDone = true;
        let first = true;

        while (streamNotDone) {
            const { value, done } = await reader.read();
            if (done) {
                streamNotDone = false;
                break;
            }

            await new Promise((resolve, reject) => {
                this.sourceBuffer.appendBuffer(value);
                this.sourceBuffer.onupdateend = () => {
                    this.play();
                    resolve(true);
                };
            });
        }
    };

    setPlaybackRate = (playbackRate) => {
        this.playbackRate = playbackRate;
        this.audio.playbackRate = playbackRate;
    };
}
