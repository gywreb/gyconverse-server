const express = require("express");
require("dotenv").config();
require("colors");
const socketio = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const ConnectMongo = require("./database/dbConnect");
const errorHandler = require("./middlewares/errorHandler");
const app = express();
const server = require("http").createServer(app);
const auth = require("./routes/auth");
const user = require("./routes/user");

ConnectMongo.getConnection();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/gyconverse/api/auth", auth);
app.use("/gyconverse/api/user", user);
app.use(errorHandler);

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
