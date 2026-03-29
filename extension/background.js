let activeTabId = null;
let startTime = null;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await trackPrevious();
  startTracking(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === "complete") {
    trackPrevious();
    startTracking(tabId);
  }
});

function startTracking(tabId) {
  activeTabId = tabId;
  startTime = Date.now();
}

async function trackPrevious() {
  if (!activeTabId || !startTime) return;

  const duration = (Date.now() - startTime) / 1000; // seconds

  try {
    const tab = await chrome.tabs.get(activeTabId);
    const url = new URL(tab.url);

    const category = categorize(url.hostname);

    await fetch("http://localhost:5002/extension/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        category,
        minutes: duration / 60
      })
    });

  } catch (err) {
    console.log("Tracking error:", err);
  }

  startTime = null;
  activeTabId = null;
}

function categorize(domain) {
  if (domain.includes("youtube") || domain.includes("netflix"))
    return "Entertainment";

  if (domain.includes("instagram") || domain.includes("facebook"))
    return "Social Media";

  if (domain.includes("leetcode") || domain.includes("geeksforgeeks"))
    return "Study";

  return "Other";
}