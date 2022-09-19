import { show, hide, isHidden } from '../utils/ui-helper.js';

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
const awsForm = document.getElementById('webrice_aws_form');
const awsAKID = document.getElementById('webrice_aws_akid');
const awsSAK = document.getElementById('webrice_aws_sak');
const awsRegion = document.getElementById('webrice_aws_region');
const awsLoading = document.getElementById('aws_loading');
const awsSuccess = document.getElementById('aws_success');
const awsFailure = document.getElementById('aws_failure');
const resetAWSCredsButton = document.getElementById('aws_reset_button');
const resetAWSCredsDiv = document.getElementById('aws_reset');
const doraRadio = document.getElementById('dora_aws');
const karlRadio = document.getElementById('karl_aws');
const helpAWS = document.getElementById('help_aws');
const SSMLText = document.getElementById('webrice_ssml_text');
const SSMLdetails = document.getElementById('ssml_details');

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
  const command = SSMLdetails.open
    ? CONTENT_COMMANDS.PLAY_SSML
    : CONTENT_COMMANDS.PLAY;
  const result = await sendToContent('play clicked', command);
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
  if (isHidden(moreContainer)) {
    show(moreContainer);
    moreIcon.classList.add('webrice_rotate_90');
    return;
  }
  moreIcon.classList.remove('webrice_rotate_90');
  hide(moreContainer);
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

/**
 * Updates a value both in storage and in content
 * @param {string} key The key of the value to update
 * @param {any} value The value that should be stored.
 */
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

/**
 * Updates values when volume slider changes
 * @param {event} e
 */
const onVolumeSliderChanged = (e) => {
  updateValue(WEBRICE_KEYS.VOLUME, e.target.valueAsNumber);
};

/**
 * Keeps the SSML values updated in storage and content
 * @param {event} e
 */
const onSSMLTextChanged = (e) => {
  updateValue(WEBRICE_KEYS.SSML_TEXT, e.target.value);
};

/**HTMLElement
 * On the AWS form submit update the stored values
 * @param {Event} e
 */
const onAWSFormSubmit = async (e) => {
  e.preventDefault();
  hide(awsFailure);
  hide(awsSuccess);

  const akid = awsAKID.value;
  const sak = awsSAK.value;
  const region = awsRegion.value;

  const awsCreds = { region, akid, sak };

  // Show loading
  show(awsLoading);

  const test = await testAws(region, akid, sak);
  hide(awsLoading);

  if (!test.success) {
    show(awsFailure);
    awsFailure.innerText = test.message;
    return;
  }

  show(awsSuccess);
  saveToStorage(WEBRICE_KEYS.AWS_CREDS, awsCreds);
};

/**
 * Hides AWS credential input fields
 */
const hideAWSCreds = () => {
  hide(awsForm);
  show(resetAWSCredsDiv);
};

/**
 * Displays the AWS Form and hides the rest button
 */
const onResetAWS = () => {
  show(awsForm);
  hide(resetAWSCredsDiv);
};

/**
 * Used to initialize values from storage into the popup form
 * @param {string} key
 * @param {any} value
 */
const initialize = (key, value) => {
  switch (key) {
    case WEBRICE_KEYS.PITCH:
      if (value) {
        pitchSlider.value = value;
      }
      updateContentValue(key, value);
      break;
    case WEBRICE_KEYS.PITCH_DEFAULT:
      if (value == undefined || value == null) {
        pitchDefaultCheckbox.checked = true;
        updateValue(WEBRICE_KEYS.PITCH_DEFAULT, true);
        break;
      }
      pitchDefaultCheckbox.checked = value;
      value && pitchSliderDiv.classList.add('webrice_disabled');
      updateContentValue(key, value);
      break;
    case WEBRICE_KEYS.SUBSTITUTIONS:
      // update subs
      break;
    case WEBRICE_KEYS.VOLUME:
      volumeSlider.value = value;
      updateContentValue(key, value);
      break;
    case WEBRICE_KEYS.AWS_CREDS:
      // If we have creds, hide fields and display a reset creds button.
      if (
        value != null &&
        value.sak != null &&
        value.region != null &&
        value.akid != null
      ) {
        hideAWSCreds();
        show(doraRadio);
        show(karlRadio);
        show(helpAWS);
        break;
      }
      break;
    case WEBRICE_KEYS.VOICE:
      updateContentValue(key, value);
      break;
    case WEBRICE_KEYS.SSML_TEXT:
      SSMLText.value = value;
      updateContentValue(key, value);
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
awsForm.onsubmit = onAWSFormSubmit;
resetAWSCredsButton.onclick = onResetAWS;
SSMLText.onkeyup = onSSMLTextChanged;

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
