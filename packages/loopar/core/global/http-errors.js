const httpErrors = {
  // Files Errors
  "ERR_LOAD_URL": {
    "message": "Failed to load the requested URL. This can be caused by a variety of reasons, such as a poor internet connection, an incorrect URL, or a problem with the web server.",
    "code": "404",
  },
  "ERR_FILE_NOT_FOUND": {
    "message": "The requested file could not be found.",
    "code": "404"
  },
  "ERR_FILE_NOT_READABLE": {
    "message": "The requested file is not readable.",
    "code": "ERR_FILE_NOT_READABLE",
  },
  "ERR_FILE_NOT_WRITABLE": {
    "message": "The requested file is not writable.",
    "code": "ERR_FILE_NOT_WRITABLE"
  },
  "ERR_FILE_NOT_EXECUTABLE": {
    "message": "The requested file is not executable.",
    "code": "ERR_FILE_NOT_EXECUTABLE"
  },
  "ERR_FILE_NOT_SUPPORTED": {
    "message": "The requested file type is not supported.",
    "code": "ERR_FILE_NOT_SUPPORTED"
  },
  "ERR_FILE_TOO_LARGE": {
    "message": "The requested file is too large.",
    "code": "ERR_FILE_TOO_LARGE"
  },

  // Database errors
  "ER_NO_SUCH_TABLE": {
    "message": "The specified table does not exist in the database.",
    "code": "ER_NO_SUCH_TABLE"
  },
  "ER_NO_SUCH_COLUMN": {
    "message": "The specified column does not exist in the table.",
    "code": "ER_NO_SUCH_COLUMN"
  },
  "ER_NO_SUCH_USER": {
    "message": "The specified user does not exist in the database.",
    "code": "ER_NO_SUCH_USER"
  },
  "ER_NO_SUCH_DATABASE": {
    "message": "The specified database does not exist.",
    "code": "ER_NO_SUCH_DATABASE"
  },
  "ER_NO_SUCH_PROCEDURE": {
    "message": "The specified stored procedure does not exist.",
    "code": "ER_NO_SUCH_PROCEDURE"
  },
  "ER_NO_SUCH_FUNCTION": {
    "message": "The specified function does not exist.",
    "code": "ER_NO_SUCH_FUNCTION"
  },
  "ER_NO_SUCH_TRIGGER": {
    "message": "The specified trigger does not exist.",
    "code": "ER_NO_SUCH_TRIGGER"
  },
  "ER_NO_SUCH_VIEW": {
    "message": "The specified view does not exist.",
    "code": "ER_NO_SUCH_VIEW"
  },
  "ER_NO_SUCH_INDEX": {
    "message": "The specified index does not exist.",
    "code": "ER_NO_SUCH_INDEX"
  },
  "ER_NO_SUCH_KEY": {
    "message": "The specified key does not exist.",
    "code": "ER_NO_SUCH_KEY"
  },
  "ER_NO_SUCH_PARTITION": {
    "message": "The specified partition does not exist.",
    "code": "ER_NO_SUCH_PARTITION"
  },
  "ER_NO_SUCH_FILE": {
    "message": "The specified file does not exist.",
    "code": "ER_NO_SUCH_FILE"
  },
  "ER_NO_SUCH_TABLESPACE": {
    "message": "The specified tablespace does not exist.",
    "code": "ER_NO_SUCH_TABLESPACE"
  },
  "ER_NO_SUCH_COLLATION": {
    "message": "The specified collation does not exist.",
    "code": "ER_NO_SUCH_COLLATION"
  },
  "ER_NO_SUCH_USER_VARIABLE": {
    "message": "The specified user variable does not exist.",
    "code": "ER_NO_SUCH_USER_VARIABLE"
  },
  "ER_NO_SUCH_HOST": {
    "message": "The specified host does not exist.",
    "code": "ER_NO_SUCH_HOST"
  },
  "ER_NO_SUCH_THREAD": {
    "message": "The specified thread does not exist.",
    "code": "ER_NO_SUCH_THREAD"
  },
  "ER_NO_SUCH_DB": {
    "message": "The specified database does not exist.",
    "code": "ER_NO_SUCH_DB"
  },
  "ER_NO_SUCH_TABLE": {
    "message": "The specified table does not exist.",
    "code": "ER_NO_SUCH_TABLE"
  },
  // Informational responses
  "100 Continue": {
    "message": "The client should continue with the request.",
    "code": "100"
  },
  "101 Switching Protocols": {
    "message": "The server is switching protocols.",
    "code": "101"
  },
  "102 Processing": {
    "message": "The server is processing the request, but no response is available yet.",
    "code": "102"
  },
  // Successful responses
  "200 OK": {
    "message": "The request was successful.",
    "code": "200"
  },
  "201 Created": {
    "message": "The request was successful and a new resource was created.",
    "code": "201"
  },
  "202 Accepted": {
    "message": "The request was accepted for processing, but the processing has not been completed.",
    "code": "202"
  },
  "203 Non-Authoritative Information": {
    "message": "The response is a non-authoritative information.",
    "code": "203"
  },
  "204 No Content": {
    "message": "The request was successful, but there is no content to return.",
    "code": "204"
  },
  "205 Reset Content": {
    "message": "The request was successful, but the client should reset the document view.",
    "code": "205"
  },
  "206 Partial Content": {
    "message": "The request was successful, but the response is a partial content.",
    "code": "206"
  },
  "207 Multi-Status": {
    "message": "The response is a Multi-Status.",
    "code": "207"
  },
  "208 Already Reported": {
    "message": "The response is a Multi-Status.",
    "code": "208"
  },
  "226 IM Used": {
    "message": "The server has fulfilled a request for the resource, and the response is a representation of the resource itself.",
    "code": "226"
  },
  // Redirection messages
  "300 Multiple Choices": {
    "message": "The requested resource has multiple possible representations.",
    "code": "300"
  },
  "301 Moved Permanently": {
    "message": "The requested resource has been permanently moved to a new location.",
    "code": "301"
  },
  "302 Found": {
    "message": "The requested resource has been temporarily moved to a new location.",
    "code": "302"
  },
  "303 See Other": {
    "message": "The response to the request can be found at another location.",
    "code": "303"
  },
  "304 Not Modified": {
    "message": "The requested resource has not been modified since the last time it was requested.",
    "code": "304"
  },
  "305 Use Proxy": {
    "message": "The requested resource must be accessed through a proxy.",
    "code": "305"
  },
  "306 Unused": {
    "message": "This code is no longer used.",
    "code": "306"
  },
  "307 Temporary Redirect": {
    "message": "The requested resource has been temporarily moved to a new location.",
    "code": "307"
  },
  "308 Permanent Redirect": {
    "message": "The requested resource has been permanently moved to a new location.",
    "code": "308"
  },
  // Client error responses
  "400 Bad Request": {
    "message": "The request is malformed.",
    "code": "400"
  },
  "401 Unauthorized": {
    "message": "The request requires authentication.",
    "code": "401"
  },
  "402 Payment Required": {
    "message": "The request requires payment.",
    "code": "402"
  },
  "403 Forbidden": {
    "message": "The server understood the request, but is refusing it.",
    "code": "403"
  },
  "404 Not Found": {
    "message": "The requested resource could not be found.",
    "code": "404"
  },
  "405 Method Not Allowed": {
    "message": "The request method is not supported for the requested resource.",
    "code": "405"
  },
  "406 Not Acceptable": {
    "message": "The request is not acceptable.",
    "code": "406"
  },
  "407 Proxy Authentication Required": {
    "message": "The client must authenticate with a proxy.",
    "code": "407"
  },
  "408 Request Timeout": {
    "message": "The request timed out.",
    "code": "408"
  },
  "409 Conflict": {
    "message": "The request could not be completed because of a conflict.",
    "code": "409"
  },
  "410 Gone": {
    "message": "The requested resource is no longer available.",
    "code": "410"
  },
  "411 Length Required": {
    "message": "The request requires a content length.",
    "code": "411"
  },
  "412 Precondition Failed": {
    "message": "A precondition for the request was not met.",
    "code": "412"
  },
  "413 Payload Too Large": {
    "message": "The request is too large.",
    "code": "413"
  },
  "414 URI Too Long": {
    "message": "The URI is too long.",
    "code": "414"
  },
  "415 Unsupported Media Type": {
    "message": "The request has an unsupported media type.",
    "code": "415"
  },
  "416 Range Not Satisfiable": {
    "message": "The requested range is not satisfiable.",
    "code": "416"
  },
  "417 Expectation Failed": {
    "message": "The expectation of the request failed.",
    "code": "417"
  },
  "418 I'm a teapot": {
    "message": "I'm a teapot.",
    "code": "418"
  },
  "421 Misdirected Request": {
    "message": "The request was directed at a server that is not able to produce a response.",
    "code": "421"
  },
  "422 Unprocessable Entity": {
    "message": "The request was well-formed but was unable to be followed due to semantic errors.",
    "code": "422"
  },
  "423 Locked": {
    "message": "The resource that is being accessed is locked.",
    "code": "423"
  },
  "424 Failed Dependency": {
    "message": "The request failed due to a failure of a previous request.",
    "code": "424"
  },
  "425 Too Early": {
    "message": "The request is too early.",
    "code": "425"
  },
  "426 Upgrade Required": {
    "message": "The client should switch to a different protocol.",
    "code": "426"
  },
  "428 Precondition Required": {
    "message": "The request is missing a required parameter.",
    "code": "428"
  },
  "429 Too Many Requests": {
    "message": "Too many requests.",
    "code": "429"
  },
  "431 Request Header Fields Too Large": {
    "message": "The request header is too large.",
    "code": "431"
  },
  "451 Unavailable For Legal Reasons": {
    "message": "The request is unavailable for legal reasons.",
    "code": "451"
  },
  // Server error responses
  "500 Internal Server Error": {
    "message": "An internal server error occurred.",
    "code": "500"
  },
  "501 Not Implemented": {
    "message": "The request is not implemented.",
    "code": "501"
  },
  "502 Bad Gateway": {
    "message": "The gateway received an invalid response.",
    "code": "502"
  },
  "503 Service Unavailable": {
    "message": "The service is unavailable.",
    "code": "503"
  },
  "504 Gateway Timeout": {
    "message": "The gateway timed out.",
    "code": "504"
  },
  "505 HTTP Version Not Supported": {
    "message": "The HTTP version is not supported.",
    "code": "505"
  },
  "506 Variant Also Negotiates": {
    "message": "The server has an internal configuration error.",
    "code": "506"
  },
  "507 Insufficient Storage": {
    "message": "The server has insufficient storage.",
    "code": "507"
  },
  "508 Loop Detected": {
    "message": "The server has detected an infinite loop.",
    "code": "508"
  },
  "510 Not Extended": {
    "message": "Further extensions to the request are required.",
    "code": "510"
  },
  "511 Network Authentication Required": {
    "message": "The client needs to authenticate to gain network access.",
    "code": "511"
  }
};

/**
 * Normalizes any error into the standard wire shape:
 *   { status, code, title, message }
 *
 * - status: numeric HTTP status (always a Number)
 * - code:   original error code (HTTP number or symbolic string like "ERR_FILE_NOT_FOUND")
 * - title:  short human label for the error class
 * - message: the actionable description shown to the user
 *
 * Always returns a fresh object — never mutates the catalog.
 */
export function getHttpError(err) {
  const input = (err && typeof err === "object") ? err : { code: err };
  const rawCode = input.code ?? 500;

  const catalogEntry =
    Object.values(httpErrors).find(e => e.code == rawCode) ||
    httpErrors[rawCode] ||
    httpErrors["500 Internal Server Error"];

  const numericCode = Number(rawCode);
  const status = Number.isFinite(numericCode) ? numericCode : 500;
  const code = rawCode;
  const title = input.title || `${catalogEntry.code} Error`;
  const message = input.message || catalogEntry.message;

  return { status, code, title, message };
}