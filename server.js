const express = require("express");
const app = express();
require("dotenv").config();
require("colors");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const swaggerDoc = require("./swagger.json");
const swaggerUI = require("swagger-ui-express");
const ConnectMongo = require("./database/dbConnect");
const errorHandler = require("./middlewares/errorHandler");
const auth = require("./routes/auth");
const user = require("./routes/user");
const room = require("./routes/room");
const file = require("./routes/file");
const message = require("./routes/message");
const SocketIO = require("./socket/Socket");
const Events = require("./socket/Events");
const server = require("http").createServer(app);

ConnectMongo.getConnection();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDoc));

const API_PREFIX = "/gyconverse/api";

app.use(`${API_PREFIX}/auth`, auth);
app.use(`${API_PREFIX}/user`, user);
app.use(`${API_PREFIX}/room`, room);
app.use(`${API_PREFIX}/message`, message);
app.use(`${API_PREFIX}/file`, file);
app.use(errorHandler);

const port = process.env.PORT || 5000;

// socket section
SocketIO.init(server);

SocketIO.io.on(Events.connection, (socket) => {
  // debug
  socket.currentRoom = "";

  console.log(`${socket.id} is connected!`);
  // =====
  // when user login success
  socket.on(Events.login, (chatUser) => {
    SocketIO.joinSocket(chatUser, socket);
    SocketIO.io.emit(Events.getOnlineUsers, SocketIO.onlineUsers);
    // debug ===
    console.log(`${socket.id} is logged in`.green);
    // console.log(SocketIO.onlineUsers);
    // =====
  });
  socket.on(Events.joinRoom, (roomId) => {
    socket.currentRoom = roomId;
    socket.join(roomId);
  });
  socket.on(Events.leaveRoom, () => {
    if (socket.currentRoom.length) {
      socket.leave(socket.currentRoom);
      socket.currentRoom = "";
    }
  });
  // disconnect
  socket.on(Events.disconnect, () => {
    SocketIO.onlineUsers = SocketIO.onlineUsers.filter(
      (user) => user.socketId !== socket.id
    );
    console.log(`${socket.id} is disconnect`.red);
    SocketIO.io.emit(Events.getOnlineUsers, SocketIO.onlineUsers);
    SocketIO.io.emit(Events.getInVidCallUsers, SocketIO.inVidCallUsers);
    SocketIO.io.emit(Events.getInCallingUsers, SocketIO.inCallingUsers);
  });
  // client send message to socket = broadcast receive & get realtime rooms info
  socket.on(Events.singleRoomChat, (message) => {
    SocketIO.singleRooms.map((room) => {
      if (room._id === message.room) {
        room.lastMessage = message.content;
      }
    });
    socket.broadcast
      .to(socket.currentRoom)
      .emit(Events.receiveSingleChat, message);
    SocketIO.io.emit(Events.singleRoomsInfo, SocketIO.singleRooms);
  });
  // sendFriendRequest
  socket.on(Events.sendFriendRequest, (request) => {
    let targetSocket = SocketIO.onlineUsers.find(
      (user) => user._id === request.receiveId
    );
    if (targetSocket)
      socket
        .to(targetSocket.socketId)
        .emit(Events.receiveFriendRequest, request);
  });
  // acceptFriendRequest
  socket.on(Events.acceptFriendRequest, (request) => {
    let targetSocket = SocketIO.onlineUsers.find(
      (user) => user._id === request.receiveId
    );
    if (targetSocket) {
      socket
        .to(targetSocket.socketId)
        .emit(Events.alertAcceptFriendRequest, request);
    }
    SocketIO.io.emit(Events.getOnlineUsers, SocketIO.onlineUsers);
  });
  //send single chat invite
  socket.on(Events.sendChatInvite, (invite) => {
    let targetSocket = SocketIO.onlineUsers.find(
      (user) => user._id === invite.receiveId
    );
    if (targetSocket) {
      socket.to(targetSocket.socketId).emit(Events.receiveChatInvite, invite);
    }
    SocketIO.addSingleRoom(invite.newRoom);
    SocketIO.io.emit(Events.getOnlineUsers, SocketIO.onlineUsers);
  });
  // send & recevie video call
  socket.on(Events.sendCall, (signal) => {
    let targetSocket = SocketIO.onlineUsers.find(
      (user) => user._id === signal.to._id
    );
    SocketIO.addInCallingUser(signal.to);
    SocketIO.addInCallingUser(signal.from);
    if (targetSocket) {
      socket.to(targetSocket.socketId).emit(Events.receiveCall, signal);
    }
    SocketIO.io.emit(Events.getInCallingUsers, SocketIO.inCallingUsers);
  });

  // cancel call from initiator
  socket.on(Events.cancelCall, (signal) => {
    SocketIO.inCallingUsers = SocketIO.inCallingUsers.filter(
      (user) => user._id !== signal.to._id
    );
    SocketIO.inCallingUsers = SocketIO.inCallingUsers.filter(
      (user) => user._id !== signal.from._id
    );
    let targetSocket = SocketIO.onlineUsers.find(
      (user) => user._id === signal.to._id
    );
    if (targetSocket) {
      socket.to(targetSocket.socketId).emit(Events.cancelCallReceive, signal);
    }
    SocketIO.io.emit(Events.getInCallingUsers, SocketIO.inCallingUsers);
  });

  // accept & denied video call
  socket.on(Events.answerCall, (signal) => {
    let targetSocket = SocketIO.onlineUsers.find(
      (user) => user._id === signal.toUser._id
    );
    SocketIO.addInVidCallUser(signal.toUser);
    SocketIO.addInVidCallUser(signal.ansUser);
    SocketIO.inCallingUsers = SocketIO.inCallingUsers.filter(
      (user) => user._id !== signal.toUser._id
    );
    SocketIO.inCallingUsers = SocketIO.inCallingUsers.filter(
      (user) => user._id !== signal.ansUser._id
    );
    if (targetSocket) {
      socket.to(targetSocket.socketId).emit(Events.acceptCall, signal);
    }
    SocketIO.io.emit(Events.getInVidCallUsers, SocketIO.inVidCallUsers);
    SocketIO.io.emit(Events.getInCallingUsers, SocketIO.inCallingUsers);
  });

  socket.on(Events.denyCall, (signal) => {
    SocketIO.inCallingUsers = SocketIO.inCallingUsers.filter(
      (user) => user._id !== signal.to._id
    );
    SocketIO.inCallingUsers = SocketIO.inCallingUsers.filter(
      (user) => user._id !== signal.from._id
    );
    let targetSocket = SocketIO.onlineUsers.find(
      (user) => user._id === signal.from._id
    );
    if (targetSocket) {
      socket.to(targetSocket.socketId).emit(Events.denyCallReceive, signal);
    }
    SocketIO.io.emit(Events.getInCallingUsers, SocketIO.inCallingUsers);
  });

  //leaveCall
  socket.on(Events.leaveCall, (signal) => {
    SocketIO.inVidCallUsers = SocketIO.inVidCallUsers.filter(
      (user) => user._id !== signal.from._id
    );
    SocketIO.inVidCallUsers = SocketIO.inVidCallUsers.filter(
      (user) => user._id !== signal.to._id
    );
    let targetSocket = SocketIO.onlineUsers.find(
      (user) => user._id === signal.to._id
    );
    if (targetSocket) {
      socket.to(targetSocket.socketId).emit(Events.leaveCallReceive, signal);
    }
    SocketIO.io.emit(Events.getInVidCallUsers, SocketIO.inVidCallUsers);
    SocketIO.io.emit(Events.getInCallingUsers, SocketIO.inCallingUsers);
  });
});

server.listen(port, () =>
  console.log(`Server is running on port: ${port}`.yellow)
);
