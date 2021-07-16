const mongoose = require("mongoose");

class ConnectMongo {
  static getConnection() {
    if (!mongoose.connection.readyState) {
      mongoose
        .connect(process.env.MONGODB_URL, {
          useCreateIndex: true,
          useFindAndModify: false,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
        .then(() => console.log(`DB is connected`.blue))
        .catch((err) => console.log(`${err}`.red));
    }
  }
}

module.exports = ConnectMongo;
