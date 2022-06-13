// export const WEBRICE_KEYS = {
//   VOICE: "webrice_voice",
//   FREE_TEXT: "webrice_free_text",
//   PITCH: "webrice_pitch",
//   PITCH_DEFAULT: "webrice_default",
//   SUBSTITUTIONS: "webrice_substitutions",
// };

export const getFromStorage = async (key) => {
  const res = await chrome.storage.local.get(key);
  return res[key];
};

export const saveToStorage = (key, value) => {
  chrome.storage.local.set({ [key]: value });
};
