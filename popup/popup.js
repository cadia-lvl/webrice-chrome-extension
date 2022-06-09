console.log("Popup running");

// Get elements
const playButton = document.getElementById("webrice_play");
const pauseButton = document.getElementById("webrice_pause");
const stopButton = document.getElementById("webrice_stop");
const speedSelector = document.getElementById("webrice_speed_selector");
const loadingIcon = document.getElementById("webrice_load_icon");
const playIcon = document.getElementById("webrice_play_icon");
const moreButton = document.getElementById("webrice_more");
const moreContainer = document.getElementById("webrice_more_container");
const voicesContainer = document.getElementById("webrice_voice_list");
loadingIcon.style.display = "none"; // start by hiding loading icon

/**
 * Helper function to get the current active tab id.
 */
const getCurrentTabId = async () => {
  const tab = await chrome.tabs.query({ currentWindow: true, active: true });
  return tab[0].id;
};

/**
 * Sends messages to content and returns a value if necessary
 * @param {string} message A message o send //TODO: might remove this
 * @param {string} command The command to be executed by content
 * @param {object} settings Optional settings object to send playback rate speed
 * @returns The response from content if necessary. For the play command, this will be SUCCESS or an error message.
 */
const sendToContent = async (
  message,
  command = CONTENT_COMMANDS.MESSAGE,
  settings = {}
) => {
  const tab_id = await getCurrentTabId();
  const response = await chrome.tabs.sendMessage(tab_id, {
    receiver: RECEIVERS.CONTENT,
    message,
    command,
    settings,
  });
  return response;
};

/**
 * Gets the currently selected playback rate from the speedSelector.
 * @returns the playback rate as a float
 */
const getPlayRate = () => {
  const selected = speedSelector[speedSelector.selectedIndex];
  const speed = parseFloat(selected.value);
  return speed;
};

/**
 * Toggles between play and loading icon
 */
const toggleLoad = () => {
  if (playIcon.style.display == "none") {
    // Load complete
    playIcon.style.display = "inline-block";
    loadingIcon.style.display = "none";
    playButton.active = true;
    return;
  }
  // Loading
  playButton.active = false;
  playIcon.style.display = "none";
  loadingIcon.style.display = "inline-block";
};

/**
 * Sends the play command to content
 * @returns the result of play, SUCCESS or FAIL
 */
const onPlayClicked = async () => {
  toggleLoad();
  const result = await sendToContent("play clicked", CONTENT_COMMANDS.PLAY);
  toggleLoad();
  return result;
};

/**
 * Send the pause command to content.
 */
const onPauseClicked = () => {
  sendToContent("pause clicked", CONTENT_COMMANDS.PAUSE);
};

/**
 * Sends the stop command to content.
 */
const onStopClicked = () => {
  sendToContent("stop clicked", CONTENT_COMMANDS.STOP);
};

/**
 * Sends the changed playback rate to content.
 */
const onPlaybackRateChanged = () => {
  const speed = getPlayRate();
  sendToContent("change play rate", CONTENT_COMMANDS.CHANGE_PLAYBACK_RATE, {
    playbackRate: speed,
  });
};

/**
 * Gets the playback rate from the content and updates the speed setting.
 * (The playback rate selector dropdown)
 */
const setPlaybackRate = async () => {
  const speed = await sendToContent("", CONTENT_COMMANDS.GET_PLAYBACK_RATE);

  // Update
  speedSelector.value = speed;
};

const onMoreClicked = () => {
  if (moreContainer.style.display == "none") {
    moreContainer.style.display = "flex";
    return;
  }
  moreContainer.style.display = "none";
};

const onRadioClicked = (value) => {
  console.log(value);
};

// setPlaybackRate();

// Assign button functions
playButton.addEventListener("mouseup", onPlayClicked);
pauseButton.addEventListener("mouseup", onPauseClicked);
stopButton.addEventListener("mouseup", onStopClicked);
speedSelector.onchange = onPlaybackRateChanged;
moreButton.addEventListener("mouseup", onMoreClicked);
console.log(voicesContainer);

for (const voiceButton in voicesContainer) {
  console.log(voiceButton.value);
  voiceButton.addEventListener("mouseup", () =>
    onRadioClicked(voiceButton.value)
  );
}
