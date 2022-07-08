export const getFromStorage = async (key) => {
  const res = await chrome.storage.local.get(key);
  return res[key];
};

export const saveToStorage = (key, value) => {
  chrome.storage.local.set({ [key]: value });
};
