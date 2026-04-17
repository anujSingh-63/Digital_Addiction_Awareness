const fs = require('fs');

const filePath = 'app.js';
let content = fs.readFileSync(filePath, 'utf8');

const gitEndpoint = `
// API endpoint to get git commit info (committed message tracking)
app.get("/api/git-info", (req, res) => {
  try {
    const { execSync } = require("child_process");
    const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
    const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();
    const commitAuthor = execSync("git log -1 --pretty=%an").toString().trim();
    const commitDate = execSync("git log -1 --pretty=%ad --date=short").toString().trim();
    const commitTime = execSync("git log -1 --pretty=%ar").toString().trim();
    
    res.json({
      hash: commitHash,
      message: commitMessage,
      author: commitAuthor,
      date: commitDate,
      relativeTime: commitTime
    });
  } catch (err) {
    res.json({
      hash: "unknown",
      message: "Version tracking unavailable",
      author: "System",
      date: new Date().toISOString().split('T')[0],
      relativeTime: "unknown"
    });
  }
});
`;

// Insert before server.listen
content = content.replace('server.listen(PORT', gitEndpoint + '\nserver.listen(PORT');
fs.writeFileSync(filePath, content);
console.log('Git tracker endpoint added to app.js');
