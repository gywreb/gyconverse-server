class ErrorResponse {
  constructor(code, error) {
    this.success = false;
    this.code = code;
    this.message = error;
  }
}

module.exports = ErrorResponse;
