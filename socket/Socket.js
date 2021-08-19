const socketio = require("socket.io");

class SocketIO {
  static io = null;
  static onlineUsers = [];
  static singleRooms = [];
  static inCallingUsers = [];
  static inVidCallUsers = [];

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
    let singleRoomsId = SocketIO.singleRooms.map((room) => room._id);
    if (!onlineUsersId.includes(chatUser._id)) {
      SocketIO.onlineUsers.push({ ...chatUser, socketId: socket.id });
      chatUser.rooms.map((room) => {
        if (!singleRoomsId.includes(room._id)) {
          SocketIO.singleRooms.push(room);
        }
      });
    }
  }

  static addSingleRoom(room) {
    SocketIO.singleRooms.push(room);
  }

  static addInCallingUser(user) {
    let inCallingUserId = SocketIO.inCallingUsers.map((user) => user._id);
    if (!inCallingUserId.includes(user._id)) {
      SocketIO.inCallingUsers.push(user);
    }
  }

  static addInVidCallUser(user) {
    let inVidUserId = SocketIO.inVidCallUsers.map((user) => user._id);
    if (!inVidUserId.includes(user._id)) {
      SocketIO.inVidCallUsers.push(user);
    }
  }
}

module.exports = SocketIO;
