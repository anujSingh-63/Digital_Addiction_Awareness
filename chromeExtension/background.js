let currentTab = null;
let startTime = Date.now();
let tabStartTime = Date.now();

// Extract domain from URL
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname || urlObj.href;
  } catch {
    return url;
  }
}

// Send website tracking data to backend
function trackWebsite(url) {
  const domain = getDomain(url);
  
  fetch("http://localhost:5002/api/website-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      website: domain,
      url: url,
      timeSpent: 10  // Sending in 10 second intervals
    }),
  }).then(res => {
    // Website tracked
  }).catch(err => {
    // Error tracking website
  });
}

// Track when tab becomes active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    currentTab = tab;
    tabStartTime = Date.now();
    
    trackWebsite(tab.url);
  } catch (err) {
    // Error getting active tab
  }
});

// Track when tab content changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    currentTab = tab;
    trackWebsite(tab.url);
  }
});

// Send tracking data every 10 seconds
setInterval(() => {
  if (currentTab && currentTab.url) {
    trackWebsite(currentTab.url);
  }
}, 10000);
