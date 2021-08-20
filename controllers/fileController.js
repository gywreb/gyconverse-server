const asyncMiddleware = require("../middlewares/asyncMiddleware");
const ConnectMongo = require("../database/dbConnect");
const { ErrorResponse } = require("../models/ErrorResponse");

exports.getFile = asyncMiddleware(async (req, res, next) => {
  const { filename } = req.params;
  const file = ConnectMongo.gfs.find({ filename }).toArray((err, files) => {
    if (!files || !files.length)
      return next(new ErrorResponse(404, "no file found"));
    ConnectMongo.gfs.openDownloadStreamByName(filename).pipe(res);
  });
});
