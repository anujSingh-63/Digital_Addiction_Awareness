let currentTab = null;
let startTime = Date.now();
let tabStartTime = Date.now();

console.log("🌐 Website Tracking Extension started");

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
    console.log("✅ Website tracked:", domain);
  }).catch(err => {
    console.error("❌ Error tracking website:", err);
  });
}

// Track when tab becomes active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    currentTab = tab;
    tabStartTime = Date.now();
    
    console.log("📍 Active Tab:", tab.url);
    trackWebsite(tab.url);
  } catch (err) {
    console.error("Error getting active tab:", err);
  }
});

// Track when tab content changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    currentTab = tab;
    console.log("📍 Tab Updated:", tab.url);
    trackWebsite(tab.url);
  }
});

// Send tracking data every 10 seconds
setInterval(() => {
  if (currentTab && currentTab.url) {
    trackWebsite(currentTab.url);
  }
}, 10000);
