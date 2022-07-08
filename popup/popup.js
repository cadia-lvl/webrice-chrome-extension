import {
  getFromStorage,
  saveToStorage,
  // WEBRICE_KEYS,
} from '../utils/storage_helper.js';

// console.log('Popup running'); // useful for dev

// Get elements
const playButton = document.getElementById('webrice_play');
const pauseButton = document.getElementById('webrice_pause');
const stopButton = document.getElementById('webrice_stop');
const speedSelector = document.getElementById('webrice_speed_selector');
const loadingIcon = document.getElementById('webrice_load_icon');
const playIcon = document.getElementById('webrice_play_icon');
const moreButton = document.getElementById('webrice_more_button');
const moreIcon = document.getElementById('webrice_more_icon');
const moreContainer = document.getElementById('webrice_more_container');
const voicesContainer = document.getElementById('webrice_voice_list');
const pitchSlider = document.getElementById('webrice_pitch_slider');
const pitchSliderDiv = document.getElementById('webrice_pitch_slider_div');
const pitchDefaultCheckbox = document.getElementById('webrice_default_pitch');
const volumeSlider = document.getElementById('webrice_volume_slider');
loadingIcon.style.display = 'none'; // start by hiding loading icon

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

const updateContentValue = (key, value) => {
  sendToContent('update value', CONTENT_COMMANDS.UPDATE_VALUE, {
    setting: key,
    value,
  });
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
  if (playIcon.style.display == 'none') {
    // Load complete
    playIcon.style.display = 'inline-block';
    loadingIcon.style.display = 'none';
    playButton.active = true;
    return;
  }
  // Loading
  playButton.active = false;
  playIcon.style.display = 'none';
  loadingIcon.style.display = 'inline-block';
};

/**
 * Sends the play command to content
 * @returns the result of play, SUCCESS or FAIL
 */
const onPlayClicked = async () => {
  toggleLoad();
  const result = await sendToContent('play clicked', CONTENT_COMMANDS.PLAY);
  toggleLoad();
  return result;
};

/**
 * Send the pause command to content.
 */
const onPauseClicked = () => {
  sendToContent('pause clicked', CONTENT_COMMANDS.PAUSE);
};

/**
 * Sends the stop command to content.
 */
const onStopClicked = () => {
  sendToContent('stop clicked', CONTENT_COMMANDS.STOP);
};

/**
 * Sends the changed playback rate to content.
 */
const onPlaybackRateChanged = () => {
  const speed = getPlayRate();
  sendToContent('change play rate', CONTENT_COMMANDS.CHANGE_PLAYBACK_RATE, {
    playbackRate: speed,
  });
};

/**
 * Gets the playback rate from the content and updates the speed setting.
 * (The playback rate selector dropdown)
 */
const setPlaybackRate = async () => {
  const speed = await sendToContent('', CONTENT_COMMANDS.GET_PLAYBACK_RATE);

  // Update
  speedSelector.value = speed;
};

/**
 * Toggles the more menu
 */
const onMoreClicked = () => {
  if (moreContainer.classList.contains('webrice_hide')) {
    moreContainer.classList.remove('webrice_hide');
    moreIcon.classList.add('webrice_rotate_90');
    return;
  }
  moreIcon.classList.remove('webrice_rotate_90');
  moreContainer.classList.add('webrice_hide');
};

/**
 * Toggles which voice is the active one.
 * @param {Event} e
 */
const onRadioClicked = (e) => {
  let voice = '';
  if (e.target instanceof HTMLInputElement) {
    voice = e.target.value;
  } else {
    voice = e.target.firstElementChild.value;
  }
  updateValue(WEBRICE_KEYS.VOICE, voice);
};

const updateValue = (key, value) => {
  saveToStorage(key, value);
  updateContentValue(key, value);
};

const onPitchSliderChanged = (e) => {
  updateValue(WEBRICE_KEYS.PITCH, e.target.valueAsNumber);
};

const onPitchDefaultChanged = (e) => {
  // Checked is the current value that is about to be changed.
  const default_pitch = !e.target.checked;
  updateValue(WEBRICE_KEYS.PITCH_DEFAULT, default_pitch);

  if (default_pitch) {
    // Disable slider
    pitchSliderDiv.classList.add('webrice_disabled');
    return;
  }
  pitchSliderDiv.classList.remove('webrice_disabled');
};

const onVolumeSliderChanged = (e) => {
  updateValue(WEBRICE_KEYS.VOLUME, e.target.valueAsNumber);
};

const initialize = (key, value) => {
  updateContentValue(key, value);
  switch (key) {
    case WEBRICE_KEYS.PITCH:
      if (value) {
        pitchSlider.value = value;
      }
      break;
    case WEBRICE_KEYS.PITCH_DEFAULT:
      if (value == undefined || value == null) {
        pitchDefaultCheckbox.checked = true;
        updateValue(WEBRICE_KEYS.PITCH_DEFAULT, true);
        break;
      }
      pitchDefaultCheckbox.checked = value;
      value && pitchSliderDiv.classList.add('webrice_disabled');
      break;
    case WEBRICE_KEYS.SUBSTITUTIONS:
      // update subs
      break;
    case WEBRICE_KEYS.VOLUME:
      volumeSlider.value = value;
      break;
    default:
      break;
  }
};

// Set playback rate
setPlaybackRate();

// Load storage data
for (const key of Object.values(WEBRICE_KEYS)) {
  const value = await getFromStorage(key);
  initialize(key, value);
}

// Assign button functions
playButton.addEventListener('mouseup', onPlayClicked);
pauseButton.addEventListener('mouseup', onPauseClicked);
stopButton.addEventListener('mouseup', onStopClicked);
moreButton.addEventListener('mouseup', onMoreClicked);
pitchDefaultCheckbox.onchange = onPitchDefaultChanged;
speedSelector.onchange = onPlaybackRateChanged;
pitchSlider.onchange = onPitchSliderChanged;
volumeSlider.oninput = onVolumeSliderChanged;

let initialVoice = await getFromStorage(WEBRICE_KEYS.VOICE);
if (!initialVoice) {
  initialVoice = 'Alfur';
}

for (const label of voicesContainer.children) {
  if (label.firstElementChild?.value == initialVoice) {
    label.firstElementChild.setAttribute('checked', true);
  }

  label.addEventListener('mouseup', onRadioClicked);
}
