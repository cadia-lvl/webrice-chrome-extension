const DEFAULT_VOICE = "Karl";

/**
 * Normalizes the input text.
 * Removing newlines and extra whitespaces.
 * Newline(s) will be treated as sentences and punctuation added.
 * @param {string} text
 * @returns normalized text array with max 3000 characters per element
 */
const normalizeText = (text) => {
  let trimmed = text
    .replace(/([\.\:\,\:]{0,1})\s{0,}\n+/gm, ". ")
    .replace(/\s+/gm, " ");

  if (trimmed.length < 3000) {
    return [trimmed];
  }
  const output = [];
  while (trimmed.length > 3000) {
    const lastSpace = trimmed.indexOf(" ", 2500);
    const section = trimmed.substring(0, lastSpace);
    output.push(section);
    trimmed = trimmed.slice(lastSpace);
  }
  output.push(trimmed);
  return output;
};

/**
 * Requests the tts audio from the tire tts service
 * @param {string} text text to get tts for
 * @param {object} settings eventual settings that might be used to change voice
 * @returns an array of object blob urls that can be attached to audio elements.
 */
const tts = async (text, settings) => {
  const url = "https://tts.tiro.is/v0/speech";
  const audioType = "mp3";
  const voiceName = settings?.voiceName ? settings.voiceName : DEFAULT_VOICE;
  const normalizedTexts = normalizeText(text);

  const promises = normalizedTexts.map(async (text) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          accept: "audio/mpeg",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Engine: "standard",
          LanguageCode: "is-IS",
          LexiconNames: [],
          OutputFormat: audioType,
          SampleRate: "16000",
          SpeechMarkTypes: [],
          Text: text,
          TextType: "text",
          VoiceId: voiceName,
        }),
      });

      if (!response.ok) {
        console.error(response);
        throw new Error(`${response.status} = ${response.text}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      return blobUrl;
    } catch (error) {
      console.error(`No audio received from tts web service: ${error}`);
      return { error: `No audio received from tts web service: ${error}` };
    }
  });

  const output = await Promise.all(promises);
  return { blobUrls: output };
};
