// Add action to context menu
chrome.contextMenus.create({
    id: "play-action",
    title: "Lesa upp valinn texta",
    contexts: ["selection"],
  },
);

// Handler for centext menu
const onClick = (info, tab) => {
  if (info.menuItemId == "play-action") {
    chrome.tabs.sendMessage(tab.id, {
      receiver: "content_script",
      command: "play",
    });
  }
}
chrome.contextMenus.onClicked.addListener(onClick);

