const CONTENT_COMMANDS = {
  PLAY: 'play',
  PAUSE: 'pause',
  IS_PLAYING: 'is_playing',
  STOP: 'stop',
  MESSAGE: 'message',
  CHANGE_PLAYBACK_RATE: 'change_playback_rate',
  GET_PLAYBACK_RATE: 'get_playback_rate',
  UPDATE_VALUE: 'update_value',
  PLAY_SSML: 'play_ssml',
};

const BACKGROUND_COMMANDS = {
  TTS: 'tts',
  MESSAGE: 'message',
};

const RECEIVERS = {
  BACKGROUND: 'background_script',
  CONTENT: 'content_script',
  POPUP: 'popup_script',
};

const WEBRICE_AUDIO_ID = 'webrice_audio';

const WEBRICE_KEYS = {
  VOICE: 'webrice_voice',
  PITCH: 'webrice_pitch',
  PITCH_DEFAULT: 'webrice_default',
  SUBSTITUTIONS: 'webrice_substitutions',
  VOLUME: 'webrice_volume',
  AWS_CREDS: 'webrice_aws_creds',
  SSML_TEXT: 'webrice_ssml_text',
};

const BACKENDS = {
  TIRO: 'tiro',
  POLLY: 'polly',
};
