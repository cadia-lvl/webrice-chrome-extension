class AudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.current = 0;
    this.audioUrls = [];
    this.text = "";
    this.voice = "";
  }

  sameTextAndVoice = (text, voice) => {
    return this.text == text && this.voice == voice;
  };

  play = () => {
    if (this.isPlaying() || this.audioUrls.length == 0) {
      return;
    }
    this.audio.play();
  };

  playNext = () => {
    this.current++;
    if (this.current >= this.audioUrls.length) {
      // This means we have reached the end. Should act as stop.
      this.stop();
      return;
    }
    this.audio.src = this.audioUrls[this.current];
    this.audio.play();
  };

  pause = () => {
    this.audio.pause();
  };

  stop = () => {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.current = 0;

    this.audio.src = this.audioUrls[0];
  };

  isPlaying = () => {
    return !this.audio.paused;
  };

  setupPlayer = (urls, text, playbackRate, voice) => {
    // Release urls
    if (this.audioUrls.length > 0) {
      for (const url of this.audioUrls) {
        window.URL.revokeObjectURL(url);
      }
    }
    this.audioUrls = urls;
    this.text = text;
    this.voice = voice;

    // Reset
    this.stop();

    // Set onended listener
    if (this.audio.onended == null) {
      this.audio.onended = this.playNext;
    }

    this.audio.playbackRate = playbackRate;
  };

  setPlaybackRate = (playbackRate) => {
    this.audio.playbackRate = playbackRate;
  };
}
