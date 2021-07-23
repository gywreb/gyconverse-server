const ConnectMongoDB = require("../database/dbConnect");
const ErrorResponse = require("../models/ErrorResponse");

const errorHandler = (err, req, res, next) => {
  let errors = { ...err };
  // file error
  if (err.message && err.name === "Error")
    errors = new ErrorResponse(500, err.message);
  // mongoose validator happen
  else if (err.name === "ValidationError") {
    errors = new ErrorResponse(400, {});
    for (let error in err.errors) {
      errors.message[error] = err.errors[error].message;
    }
    // delete file in bucket if validation failed
    if (req.file) ConnectMongoDB.gfs.delete(req.file.id);
  }

  // mongodb duplicate key
  else if (err.code === 11000) {
    errors = new ErrorResponse(400, {});
    for (let error_id in err.keyValue) {
      errors.message[error_id] = `${error_id} is already existed!`;
    }
    if (req.file) ConnectMongoDB.gfs.delete(req.file.id);
  }

  // resource not found error
  else if (err.name === "CastError")
    errors = new ErrorResponse(404, "resource not found!");
  // token expired
  else if (err.name === "TokenExpiredError")
    errors = new ErrorResponse(401, err.message);

  // error debug
  console.log(err);
  console.log(err.name, err.message);

  res.status(errors.code || 500).json({
    success: false,
    code: errors.code || 500,
    message: errors.message || "Server error!",
  });

  next();
};

module.exports = errorHandler;
