const activeWin = require("active-win");
// const fetch = require("node-fetch");

let lastApp = null;
let startTime = Date.now();
let appHistory = [];

console.log("===========================================");
console.log("📱 SYSTEM ACTIVITY TRACKING STARTED");
console.log("===========================================\n");

setInterval(async () => {
    const win = await activeWin();

    if (!win) return;

    const currentApp = win.owner.name;
    const currentTitle = win.title || "N/A";
    
    console.log(`\n👀 Current Active Window:`);
    console.log(`   App: ${currentApp}`);
    console.log(`   Title: ${currentTitle}`);

    if (lastApp && lastApp !== currentApp) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;

        console.log(`\n✅ APP SWITCHED - Sending Data:`);
        console.log(`   📍 Application: ${lastApp}`);
        console.log(`   ⏱️  Time Spent: ${minutes}m ${seconds}s (${timeSpent}s total)`);

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

            const result = await response.json();
            console.log(`   ✔️  Server Response: ${JSON.stringify(result)}`);
            console.log(`   📤 Endpoint: http://localhost:5002/api/system-app-data`);
        } catch (err) {
            console.error(`   ❌ Error sending data: ${err.message}`);
        }

        startTime = Date.now();
        console.log(`   🔄 Reset time counter`);
        
        // Show history
        console.log(`\n📊 Recent Activity History (last 5):`);
        appHistory.slice(-5).forEach((item, idx) => {
            console.log(`   ${idx + 1}. ${item.app} - ${Math.floor(item.timeSpent / 60)}m ${item.timeSpent % 60}s [${item.timestamp}]`);
        });
        console.log(`-------------------------------------------`);
    }

    lastApp = currentApp;

}, 10000);

// export default activeWin;