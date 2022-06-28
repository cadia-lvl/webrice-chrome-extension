// Note, constants are being run first which adds
// RECEIVERS (POPUP, CONTENT, BACKGROUND)
// CONTENT_COMMANDS (PLAY, PAUSE, STOP)
// BACKGROUND_COMMANDS (TTS)

console.log("Content running.");

const player = new AudioPlayer();

// Initial settings
const settings = {
  voice: "Karl",
  playbackRate: 1,
};

// Sends messages to the background script
// Note: This is currently unused but might be used in future versions.
const sendToBackground = async (
  command = BACKGROUND_COMMANDS.MESSAGE,
  message,
  settings = {}
) => {
  const response = await chrome.runtime.sendMessage({
    receiver: RECEIVERS.BACKGROUND,
    command,
    message,
    settings,
  });
  return response;
};

/**
 * Returns all text on the page
 */
const getAllText = () => {
  return document.body.innerText;
};

/**
 * Gets the selected text or all text if none is selected.
 * @returns the selected text or all text if none is selected.
 */
const getText = () => {
  let selectedText = document.getSelection().toString();
  if (!selectedText) {
    selectedText = getAllText();
  }
  return selectedText;
};

/**
 * Start playing audio. If needed setup and requesting of new audio is done.
 * @returns SUCCESS or an error message
 */
const play = async () => {
  const text = getText();
  if (player.compareText(text)) {
    player.setPlaybackRate(settings.playbackRate);
    player.play();
    return "SUCCESS";
  }

  const requests = tts(text);

  if (requests.length == 0) {
    return "Unable to formulate tts requests.";
  }

  player.setupPlayer(requests, text, settings.playbackRate, this.voice);

  return "SUCCESS";
};

const isPlaying = () => {
  return player.isPlaying();
};

/**
 * Pauses the audio
 */
const pause = () => {
  if (isPlaying()) {
    player.pause();
  }
};

/**
 * Stops the audio and resets the time to 0
 */
const stop = () => {
  if (isPlaying()) {
    player.stop();
  }
};

/**
 * Sets the playback rate of the audio, both locally and in
 * the audio player. If audio is playing it will retrigger play
 * to get the updated playback rate.
 * @param {float} playbackRate
 */
const setPlaybackRate = (playbackRate) => {
  // Update the contents settings
  if (settings.playbackRate != playbackRate) {
    settings.playbackRate = playbackRate;
  }
  player.setPlaybackRate(playbackRate);
  if (player.isPlaying()) {
    player.play();
  }
};

/**
 * Gets the current playback rate
 * @returns the playback rate as a float
 */
const getPlaybackRate = () => {
  return settings.playbackRate;
};

/**
 * Handles the different commands that content can receive
 * @param {object} message a message object containing at least a command and settings property
 * @returns may return a success message or none if no response is needed.
 */
const commandHandler = async (message) => {
  switch (message.command) {
    case CONTENT_COMMANDS.PLAY:
      return await play();
    case CONTENT_COMMANDS.PAUSE:
      pause();
      break;
    case CONTENT_COMMANDS.STOP:
      stop();
      break;
    case CONTENT_COMMANDS.IS_PLAYING:
      return isPlaying();
    case CONTENT_COMMANDS.MESSAGE:
      return sendToBackground(message.message);
    case CONTENT_COMMANDS.CHANGE_PLAYBACK_RATE:
      const { playbackRate } = message.settings;
      setPlaybackRate(playbackRate);
      break;
    case CONTENT_COMMANDS.GET_PLAYBACK_RATE:
      return getPlaybackRate();
    default:
      console.log(`WebRice extension: Unknown command -> ${message.command}`);
      break;
  }
};

/**
 * Helper function to be able to use async await syntax in chrome ext. development
 */
const messageHandler = async (message) => {
  if (message.receiver === RECEIVERS.CONTENT) {
    const response = await commandHandler(message);
    return response;
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  messageHandler(message).then(sendResponse);
  return true;
});
