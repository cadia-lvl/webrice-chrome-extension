const DEFAULT_VOICE = 'Alfur';
const SPECIAL_VOICES = [
  'Alfur',
  'Dilja',
  'Alfur_v2',
  'Dilja_v2',
  'Rosa',
  'Bjartur',
];
const AWS_VOICES = ['Dora', 'Karl'];
const MAX_REQUEST_SIZE = 300;

/**
 * Normalizes the input text.
 * Removing newlines and extra whitespaces.
 * Newline(s) will be treated as sentences and punctuation added.
 * @param {string} text
 * @returns normalized text array with max 3000 characters per element
 */
const normalizeText = (text, specialTrim = false) => {
  let trimmed = text
    .replace(/([\.\:\,\:]{0,1})\s{0,}\n+/gm, '. ') // replace all newlines and other special whitespaces with ". "
    .replace(/\s+/gm, ' '); // replace multiple spaces left with a single space

  // For non-amazon voice extra care is needed
  if (specialTrim) {
    trimmed = trimmed
      .replace(/(?<=\d)\s(?=\d)/gm, ', ') // replace digit space digit with digit comma space digit
      .replace(/(?<=[\?\!])\./gm, ''); // replace remove dot from ?. or !.

    // If first characters are ". " then bad sound trim these away if so
    if (trimmed.slice(0, 2) == '. ') {
      trimmed = trimmed.slice(2);
    }
  }

  if (trimmed.length < MAX_REQUEST_SIZE) {
    return [trimmed];
  }

  const output = [];
  while (trimmed.length > MAX_REQUEST_SIZE) {
    const lastSpace = trimmed.lastIndexOf(' ', MAX_REQUEST_SIZE);
    const section = trimmed.substring(0, lastSpace);
    output.push(section);
    trimmed = trimmed.slice(lastSpace);
  }
  output.push(trimmed);
  return output;
};

/**
 * Normalizes the text and outputs an array of tts requests
 * @param {string} text text to normalize for tts
 * @param {object} settings eventual settings that might be used to change voice
 * @param {boolean} ssml default false, turns on SSML settings for the request
 * @returns an array of requests, {url, content}
 */
const getRequestHeaderAndContent = (text, settings, ssml = false) => {
  const audioType = 'mp3';
  const voiceName = settings?.voice ? settings.voice : DEFAULT_VOICE;
  const awsVoice = AWS_VOICES.includes(settings?.voice);

  if (ssml) {
    const ssml = `<speak>${text}</speak>`;
    const request = awsVoice
      ? awsRequest(ssml, audioType, voiceName, true)
      : tiroRequest(ssml, audioType, voiceName, true);
    return {
      backend: awsVoice ? BACKENDS.POLLY : BACKENDS.TIRO,
      requests: [request],
    };
  }
  const specialTrim = SPECIAL_VOICES.includes(voiceName);
  const normalizedTexts = normalizeText(text, specialTrim);

  const requests = normalizedTexts.map((text) => {
    const request = awsVoice
      ? awsRequest(text, audioType, voiceName)
      : tiroRequest(text, audioType, voiceName);
    return request;
  });

  return { backend: awsVoice ? BACKENDS.POLLY : BACKENDS.TIRO, requests };
};

/**
 * Creates the Tiro tts request.
 * @param {string} text The text that should be converted to TTS
 * @param {string} audioType The wanted audio output type
 * @param {string} voiceName The voice used for TTS
 * @param {boolean} ssml If the request handles SSML or not
 * @returns
 */
const tiroRequest = (text, audioType, voiceName, ssml = false) => {
  const url = 'https://tts.tiro.is/v0/speech';

  return {
    url,
    content: {
      method: 'POST',
      mode: 'cors',
      headers: {
        accept: 'audio/mpeg',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Engine: 'standard',
        LanguageCode: 'is-IS',
        LexiconNames: [],
        OutputFormat: audioType,
        SampleRate: '16000',
        SpeechMarkTypes: [],
        Text: text,
        TextType: ssml ? 'ssml' : 'text',
        VoiceId: voiceName,
      }),
    },
  };
};

/**
 * Creates the AWS polly request.
 * @param {string} text The text that should be converted to TTS
 * @param {string} audioType The wanted audio output type
 * @param {string} voiceName The voice used for TTS
 * @param {boolean} ssml If the request handles SSML or not
 * @returns
 */
const awsRequest = (text, audioType, voiceName, ssml = false) => {
  return pollyParams(text, audioType, voiceName, ssml);
};
