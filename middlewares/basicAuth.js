const ErrorResponse = require("../models/ErrorResponse");

const basicAuth = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Basic")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(new ErrorResponse(401, "invalid token"));
  const decode = new Buffer.from(token, "base64").toString();
  if (
    !(
      decode ===
      `${process.env.BASICAUTH_USER}:${process.env.BASICAUTH_PASSWORD}`
    )
  ) {
    return next(new ErrorResponse(401, "invalid token"));
  }
  next();
};

module.exports = basicAuth;
