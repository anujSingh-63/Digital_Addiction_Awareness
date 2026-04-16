let ioInstance = null;

const activeWin = require("active-win");

const initSocket = (server) => {
  const { Server } = require("socket.io");

  ioInstance = new Server(server, {
    cors: {
      origin: "*", // allow frontend
    },
  });

  ioInstance.on("connection", (socket) => {
    // 🔹 Join user-specific room
    socket.on("joinUserRoom", (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // 🔹 Track system apps (active-win)
    const interval = setInterval(async () => {
      try {
        const win = await activeWin();

        if (win) {
          socket.emit("system-activity", {
            app: win.owner.name,
            title: win.title,
            timeSpent:1,
          });
        }
      } catch (err) {
        // active-win error handling
      }
    }, 2000);

    // 🔹 Disconnect
    socket.on("disconnect", () => {
      clearInterval(interval);
    });
  });
  

  return ioInstance;
}

// 🔥 Emit website data (from Chrome extension)
const emitWebsiteData = (userId, data) => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }

  if (userId) {
    ioInstance.to(`user_${userId}`).emit("website-data", data);
  } else {
    ioInstance.emit("website-data", data); // fallback (all users)
  }
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};




module.exports = { initSocket, getIO, emitWebsiteData };
