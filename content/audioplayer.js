class AudioPlayer {
  constructor() {
    this.mediaSource = null;
    this.audio = new Audio();
    this.playbackRate = 1;
    this.text = '';
    this.voice = '';
    this.requests = [];
    this.first = true;
  }

  sameTextAndVoice = (text, voice) => {
    return this.text == text && this.voice == voice;
  };

  play = () => {
    if (!this.isPlaying()) this.audio.play();
  };

  pause = () => {
    this.audio.pause();
  };

  stop = () => {
    this.audio.pause();
    this.audio.currentTime = 0;
  };

  isPlaying = () => {
    return !this.audio.paused;
  };

  setupPlayer = (backend, requests, text, playbackRate, voice) => {
    this.stop();
    // Revoke old url
    window.URL.revokeObjectURL(this.audio.src);
    this.mediaSource = new MediaSource();
    this.audio.src = window.URL.createObjectURL(this.mediaSource);
    this.requests = requests;
    this.setPlaybackRate(playbackRate);
    this.text = text;
    this.voice = voice;
    this.first = true;
    this.backend = backend;

    this.mediaSource.addEventListener('sourceopen', this.openSource);
  };

  openSource = async (_) => {
    const sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');

    switch (this.backend) {
      case BACKENDS.TIRO:
        for (const request of this.requests) {
          try {
            const response = await fetch(request.url, request.content);
            const reader = response.body.getReader();
            await this.stream(reader, sourceBuffer);
          } catch (e) {
            console.log(e.message);
            return;
          }
        }
        break;
      case BACKENDS.POLLY:
        const polly = await getPolly();

        for (const request of this.requests) {
          const response = await requestPolly(polly, request);
          const audioStream = response.AudioStream;
          const uIntArray = new Uint8Array(audioStream);
          const arrayBuffer = uIntArray.buffer;

          await new Promise((resolve, reject) => {
            sourceBuffer.appendBuffer(arrayBuffer);
            sourceBuffer.onupdateend = () => {
              if (this.first) {
                this.play();
                this.first = false;
              }
              resolve(true);
            };
          });
        }
        break;

      default:
        break;
    }
    this.mediaSource.endOfStream();
  };

  stream = async (reader, sourceBuffer) => {
    let streamNotDone = true;

    while (streamNotDone) {
      const { value, done } = await reader.read();
      if (done) {
        streamNotDone = false;
        break;
      }

      await new Promise((resolve, reject) => {
        sourceBuffer.appendBuffer(value);
        sourceBuffer.onupdateend = () => {
          if (this.first) {
            this.play();
            this.first = false;
          }
          resolve(true);
        };
      });
    }
  };

  setPlaybackRate = (playbackRate) => {
    this.playbackRate = playbackRate;
    this.audio.playbackRate = playbackRate;
  };

  setVolume = (volume) => {
    this.audio.volume = volume;
  };
}
