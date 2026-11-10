/**
 * Unexpected server errors (500) keep their details in the server log; the browser only gets a generic
 * message, so database errors and file paths never leave the server.
 */
module.exports = function hideServerErrors(req, res, next) {
  const json = res.json.bind(res)
  res.json = (body) => {
    if (res.statusCode === 500 && body && typeof body === 'object' && 'message' in body) {
      console.error(`[${req.method} ${req.originalUrl}]`, body.message)
      return json({ message: 'حدث خطأ في الخادم، حاول مرة أخرى' })
    }
    return json(body)
  }
  next()
}
