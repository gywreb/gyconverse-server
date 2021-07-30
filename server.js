const express = require("express");
require("dotenv").config();
require("colors");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const ConnectMongo = require("./database/dbConnect");
const errorHandler = require("./middlewares/errorHandler");
const app = express();
const server = require("http").createServer(app);
const auth = require("./routes/auth");
const user = require("./routes/user");
const room = require("./routes/room");
const message = require("./routes/message");
const SocketIO = require("./socket/socket");
const Events = require("./socket/Events");

ConnectMongo.getConnection();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/gyconverse/api/auth", auth);
app.use("/gyconverse/api/user", user);
app.use("/gyconverse/api/room", room);
app.use("/gyconverse/api/message", message);
app.use(errorHandler);

const port = process.env.PORT || 5000;

// socket section
SocketIO.init(server);

SocketIO.io.on(Events.connection, (socket) => {
  // debug
  socket.singleRooms = [];
  socket.currentRoom = "";
  console.log(`${socket.id} is connected!`);
  // =====
  // when user login success
  socket.on(Events.login, (chatUser) => {
    socket.singleRooms = chatUser.rooms;
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
    socket.leave(socket.currentRoom);
    socket.currentRoom = "";
  });
  // disconnect
  socket.on(Events.disconnect, () => {
    SocketIO.onlineUsers = SocketIO.onlineUsers.filter(
      (user) => user.socketId !== socket.id
    );
    console.log(`${socket.id} is disconnect`.red);
    // console.log(SocketIO.onlineUsers);
    SocketIO.io.emit(Events.getOnlineUsers, SocketIO.onlineUsers);
  });
  // client send message to socket = broadcast receive & get realtime rooms info
  socket.on(Events.singleRoomChat, (message) => {
    socket.singleRooms.map((room) => {
      if (room._id === message.room) {
        room.lastMessage = message.content;
      }
    });
    socket.broadcast
      .to(socket.currentRoom)
      .emit(Events.receiveSingleChat, message);
    SocketIO.io.emit(Events.singleRoomsInfo, socket.singleRooms);
  });
});

server.listen(port, () =>
  console.log(`Server is running on port: ${port}`.yellow)
);
