const socketio = require("socket.io");

class SocketIO {
  static io = null;
  static onlineUsers = [];

  static async init(server) {
    SocketIO.io = socketio(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
  }
  static joinSocket(chatUser, socket) {
    let onlineUsersId = SocketIO.onlineUsers.map((user) => user._id);
    if (!onlineUsersId.includes(chatUser._id)) {
      SocketIO.onlineUsers.push({ ...chatUser, socketId: socket.id });
    }
  }

  static addSingleRoom() {}
}

module.exports = SocketIO;
