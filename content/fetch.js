const DEFAULT_VOICE = "Alfur";
const SPECIAL_VOICES = ["Alfur", "Dilja"];

/**
 * Normalizes the input text.
 * Removing newlines and extra whitespaces.
 * Newline(s) will be treated as sentences and punctuation added.
 * @param {string} text
 * @returns normalized text array with max 3000 characters per element
 */
const normalizeText = (text, specialTrim = false) => {
  let trimmed = text
    .replace(/([\.\:\,\:]{0,1})\s{0,}\n+/gm, ". ") // replace all newlines and other special whitespaces with ". "
    .replace(/\s+/gm, " "); // replace multiple spaces left with a single space

  // For non-amazon voice extra care is needed
  if (specialTrim) {
    trimmed = trimmed
      .replace(/(?<=\d)\s(?=\d)/gm, ", ") // replace digit space digit with digit comma space digit
      .replace(/(?<=[\?\!])\./gm, ""); // replace remove dot from ?. or !.

    // If first characters are ". " then bad sound trim these away if so
    if (trimmed.slice(0, 2) == ". ") {
      trimmed = trimmed.slice(2);
    }
  }

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
  const specialTrim = SPECIAL_VOICES.includes(voiceName);
  const normalizedTexts = normalizeText(text, specialTrim);

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
