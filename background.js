// Add action to context menu
chrome.contextMenus.create({
    id: "play-action",
    title: "Splia",
    contexts: ["selection"],
  },
);

// Handler for centext menu
const onClick = (info, tab) => {
  if (info.menuItemId == "play-action") {
    chrome.tabs.sendMessage(tab.id, {action: "play"});
  }
}
chrome.contextMenus.onClicked.addListener(onClick);

