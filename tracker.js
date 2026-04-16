const activeWin = require("active-win");
// const fetch = require("node-fetch");

let lastApp = null;
let startTime = Date.now();
let appHistory = [];


setInterval(async () => {
    const win = await activeWin();

    if (!win) return;

    const currentApp = win.owner.name;
    const currentTitle = win.title || "N/A";
    
    if (lastApp && lastApp !== currentApp) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;

        appHistory.push({
            app: lastApp,
            timeSpent,
            timestamp: new Date().toLocaleTimeString()
        });

        try {
            const response = await fetch("http://localhost:5002/api/system-app-data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    appName: lastApp,
                    timeSpent,
                    title: currentTitle
                })
            });
        } catch (err) {
            // Error sending data
        }

        startTime = Date.now();
    }

    lastApp = currentApp;

}, 10000);

// export default activeWin;