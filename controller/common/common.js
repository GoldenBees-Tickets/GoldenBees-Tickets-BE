function resErrors(res, status, message) {
    res.status(status).json({
        message
      });
  }

function resData(res, status, message, data) {
    res.status(status).json({
        message,
        data
      });
}

module.exports = {resErrors, resData}