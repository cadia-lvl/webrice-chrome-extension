class AudioPlayer {
  constructor() {
    this.mediaSource = null;
    this.audio = new Audio();
    this.playbackRate = 1;
    this.text = '';
    this.voice = '';
    this.sourceBuffer = undefined;
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

  setupPlayer = (requests, text, playbackRate, voice) => {
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

    this.mediaSource.addEventListener('sourceopen', this.openSource);
  };

  openSource = async (_) => {
    this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');

    for (const request of this.requests) {
      const response = await fetch(request.url, request.content);
      const reader = response.body.getReader();
      await this.stream(reader);
    }
    this.mediaSource.endOfStream();
  };

  stream = async (reader) => {
    let streamNotDone = true;

    while (streamNotDone) {
      const { value, done } = await reader.read();
      if (done) {
        streamNotDone = false;
        break;
      }

      await new Promise((resolve, reject) => {
        this.sourceBuffer.appendBuffer(value);
        this.sourceBuffer.onupdateend = () => {
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
