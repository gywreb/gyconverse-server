const express = require("express");
require("dotenv").config();
require("colors");
const socketio = require("socket.io");
const cors = require("cors");
const ConnectMongo = require("./database/dbConnect");
const app = express();
const server = require("http").createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

ConnectMongo.getConnection();

const port = process.env.PORT || 5000;

// socket test
const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

server.listen(port, () =>
  console.log(`Server is running on port: ${port}`.yellow)
);
