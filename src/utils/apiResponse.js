class apiResponse {
  constructor(statuscode, tourism, message = "success") {
    this.statuscode = statuscode;
    this.tourism = tourism;
    this.message = message;
  }
}

export { apiResponse };
