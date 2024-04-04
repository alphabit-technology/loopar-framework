const httpErrors = {
  // Files Errors
  "ERR_LOAD_URL": {
    "description": "Failed to load the requested URL. This can be caused by a variety of reasons, such as a poor internet connection, an incorrect URL, or a problem with the web server.",
    "code": "404",
  },
  "ERR_FILE_NOT_FOUND": {
    "description": "The requested file could not be found.",
    "code": "404"
  },
  "ERR_FILE_NOT_READABLE": {
    "description": "The requested file is not readable.",
    "code": "ERR_FILE_NOT_READABLE",
  },
  "ERR_FILE_NOT_WRITABLE": {
    "description": "The requested file is not writable.",
    "code": "ERR_FILE_NOT_WRITABLE"
  },
  "ERR_FILE_NOT_EXECUTABLE": {
    "description": "The requested file is not executable.",
    "code": "ERR_FILE_NOT_EXECUTABLE"
  },
  "ERR_FILE_NOT_SUPPORTED": {
    "description": "The requested file type is not supported.",
    "code": "ERR_FILE_NOT_SUPPORTED"
  },
  "ERR_FILE_TOO_LARGE": {
    "description": "The requested file is too large.",
    "code": "ERR_FILE_TOO_LARGE"
  },

  // Database errors
  "ER_NO_SUCH_TABLE": {
    "description": "The specified table does not exist in the database.",
    "code": "ER_NO_SUCH_TABLE"
  },
  "ER_NO_SUCH_COLUMN": {
    "description": "The specified column does not exist in the table.",
    "code": "ER_NO_SUCH_COLUMN"
  },
  "ER_NO_SUCH_USER": {
    "description": "The specified user does not exist in the database.",
    "code": "ER_NO_SUCH_USER"
  },
  "ER_NO_SUCH_DATABASE": {
    "description": "The specified database does not exist.",
    "code": "ER_NO_SUCH_DATABASE"
  },
  "ER_NO_SUCH_PROCEDURE": {
    "description": "The specified stored procedure does not exist.",
    "code": "ER_NO_SUCH_PROCEDURE"
  },
  "ER_NO_SUCH_FUNCTION": {
    "description": "The specified function does not exist.",
    "code": "ER_NO_SUCH_FUNCTION"
  },
  "ER_NO_SUCH_TRIGGER": {
    "description": "The specified trigger does not exist.",
    "code": "ER_NO_SUCH_TRIGGER"
  },
  "ER_NO_SUCH_VIEW": {
    "description": "The specified view does not exist.",
    "code": "ER_NO_SUCH_VIEW"
  },
  "ER_NO_SUCH_INDEX": {
    "description": "The specified index does not exist.",
    "code": "ER_NO_SUCH_INDEX"
  },
  "ER_NO_SUCH_KEY": {
    "description": "The specified key does not exist.",
    "code": "ER_NO_SUCH_KEY"
  },
  "ER_NO_SUCH_PARTITION": {
    "description": "The specified partition does not exist.",
    "code": "ER_NO_SUCH_PARTITION"
  },
  "ER_NO_SUCH_FILE": {
    "description": "The specified file does not exist.",
    "code": "ER_NO_SUCH_FILE"
  },
  "ER_NO_SUCH_TABLESPACE": {
    "description": "The specified tablespace does not exist.",
    "code": "ER_NO_SUCH_TABLESPACE"
  },
  "ER_NO_SUCH_COLLATION": {
    "description": "The specified collation does not exist.",
    "code": "ER_NO_SUCH_COLLATION"
  },
  "ER_NO_SUCH_USER_VARIABLE": {
    "description": "The specified user variable does not exist.",
    "code": "ER_NO_SUCH_USER_VARIABLE"
  },
  "ER_NO_SUCH_HOST": {
    "description": "The specified host does not exist.",
    "code": "ER_NO_SUCH_HOST"
  },
  "ER_NO_SUCH_THREAD": {
    "description": "The specified thread does not exist.",
    "code": "ER_NO_SUCH_THREAD"
  },
  "ER_NO_SUCH_DB": {
    "description": "The specified database does not exist.",
    "code": "ER_NO_SUCH_DB"
  },
  "ER_NO_SUCH_TABLE": {
    "description": "The specified table does not exist.",
    "code": "ER_NO_SUCH_TABLE"
  },
  // Informational responses
  "100 Continue": {
    "description": "The client should continue with the request.",
    "code": "100"
  },
  "101 Switching Protocols": {
    "description": "The server is switching protocols.",
    "code": "101"
  },
  "102 Processing": {
    "description": "The server is processing the request, but no response is available yet.",
    "code": "102"
  },
  // Successful responses
  "200 OK": {
    "description": "The request was successful.",
    "code": "200"
  },
  "201 Created": {
    "description": "The request was successful and a new resource was created.",
    "code": "201"
  },
  "202 Accepted": {
    "description": "The request was accepted for processing, but the processing has not been completed.",
    "code": "202"
  },
  "203 Non-Authoritative Information": {
    "description": "The response is a non-authoritative information.",
    "code": "203"
  },
  "204 No Content": {
    "description": "The request was successful, but there is no content to return.",
    "code": "204"
  },
  "205 Reset Content": {
    "description": "The request was successful, but the client should reset the document view.",
    "code": "205"
  },
  "206 Partial Content": {
    "description": "The request was successful, but the response is a partial content.",
    "code": "206"
  },
  "207 Multi-Status": {
    "description": "The response is a Multi-Status.",
    "code": "207"
  },
  "208 Already Reported": {
    "description": "The response is a Multi-Status.",
    "code": "208"
  },
  "226 IM Used": {
    "description": "The server has fulfilled a request for the resource, and the response is a representation of the resource itself.",
    "code": "226"
  },
  // Redirection messages
  "300 Multiple Choices": {
    "description": "The requested resource has multiple possible representations.",
    "code": "300"
  },
  "301 Moved Permanently": {
    "description": "The requested resource has been permanently moved to a new location.",
    "code": "301"
  },
  "302 Found": {
    "description": "The requested resource has been temporarily moved to a new location.",
    "code": "302"
  },
  "303 See Other": {
    "description": "The response to the request can be found at another location.",
    "code": "303"
  },
  "304 Not Modified": {
    "description": "The requested resource has not been modified since the last time it was requested.",
    "code": "304"
  },
  "305 Use Proxy": {
    "description": "The requested resource must be accessed through a proxy.",
    "code": "305"
  },
  "306 Unused": {
    "description": "This code is no longer used.",
    "code": "306"
  },
  "307 Temporary Redirect": {
    "description": "The requested resource has been temporarily moved to a new location.",
    "code": "307"
  },
  "308 Permanent Redirect": {
    "description": "The requested resource has been permanently moved to a new location.",
    "code": "308"
  },
  // Client error responses
  "400 Bad Request": {
    "description": "The request is malformed.",
    "code": "400"
  },
  "401 Unauthorized": {
    "description": "The request requires authentication.",
    "code": "401"
  },
  "402 Payment Required": {
    "description": "The request requires payment.",
    "code": "402"
  },
  "403 Forbidden": {
    "description": "The server understood the request, but is refusing it.",
    "code": "403"
  },
  "404 Not Found": {
    "description": "The requested resource could not be found.",
    "code": "404"
  },
  "405 Method Not Allowed": {
    "description": "The request method is not supported for the requested resource.",
    "code": "405"
  },
  "406 Not Acceptable": {
    "description": "The request is not acceptable.",
    "code": "406"
  },
  "407 Proxy Authentication Required": {
    "description": "The client must authenticate with a proxy.",
    "code": "407"
  },
  "408 Request Timeout": {
    "description": "The request timed out.",
    "code": "408"
  },
  "409 Conflict": {
    "description": "The request could not be completed because of a conflict.",
    "code": "409"
  },
  "410 Gone": {
    "description": "The requested resource is no longer available.",
    "code": "410"
  },
  "411 Length Required": {
    "description": "The request requires a content length.",
    "code": "411"
  },
  "412 Precondition Failed": {
    "description": "A precondition for the request was not met.",
    "code": "412"
  },
  "413 Payload Too Large": {
    "description": "The request is too large.",
    "code": "413"
  },
  "414 URI Too Long": {
    "description": "The URI is too long.",
    "code": "414"
  },
  "415 Unsupported Media Type": {
    "description": "The request has an unsupported media type.",
    "code": "415"
  },
  "416 Range Not Satisfiable": {
    "description": "The requested range is not satisfiable.",
    "code": "416"
  },
  "417 Expectation Failed": {
    "description": "The expectation of the request failed.",
    "code": "417"
  },
  "418 I'm a teapot": {
    "description": "I'm a teapot.",
    "code": "418"
  },
  "421 Misdirected Request": {
    "description": "The request was directed at a server that is not able to produce a response.",
    "code": "421"
  },
  "422 Unprocessable Entity": {
    "description": "The request was well-formed but was unable to be followed due to semantic errors.",
    "code": "422"
  },
  "423 Locked": {
    "description": "The resource that is being accessed is locked.",
    "code": "423"
  },
  "424 Failed Dependency": {
    "description": "The request failed due to a failure of a previous request.",
    "code": "424"
  },
  "425 Too Early": {
    "description": "The request is too early.",
    "code": "425"
  },
  "426 Upgrade Required": {
    "description": "The client should switch to a different protocol.",
    "code": "426"
  },
  "428 Precondition Required": {
    "description": "The request is missing a required parameter.",
    "code": "428"
  },
  "429 Too Many Requests": {
    "description": "Too many requests.",
    "code": "429"
  },
  "431 Request Header Fields Too Large": {
    "description": "The request header is too large.",
    "code": "431"
  },
  "451 Unavailable For Legal Reasons": {
    "description": "The request is unavailable for legal reasons.",
    "code": "451"
  },
  // Server error responses
  "500 Internal Server Error": {
    "description": "An internal server error occurred.",
    "code": "500"
  },
  "501 Not Implemented": {
    "description": "The request is not implemented.",
    "code": "501"
  },
  "502 Bad Gateway": {
    "description": "The gateway received an invalid response.",
    "code": "502"
  },
  "503 Service Unavailable": {
    "description": "The service is unavailable.",
    "code": "503"
  },
  "504 Gateway Timeout": {
    "description": "The gateway timed out.",
    "code": "504"
  },
  "505 HTTP Version Not Supported": {
    "description": "The HTTP version is not supported.",
    "code": "505"
  },
  "506 Variant Also Negotiates": {
    "description": "The server has an internal configuration error.",
    "code": "506"
  },
  "507 Insufficient Storage": {
    "description": "The server has insufficient storage.",
    "code": "507"
  },
  "508 Loop Detected": {
    "description": "The server has detected an infinite loop.",
    "code": "508"
  },
  "510 Not Extended": {
    "description": "Further extensions to the request are required.",
    "code": "510"
  },
  "511 Network Authentication Required": {
    "description": "The client needs to authenticate to gain network access.",
    "code": "511"
  }
};

export function getHttpError(err) {
  err = typeof err === "object" ? err : { code: err };
  const code = err.code || "500";
  const httpError =  Object.values(httpErrors).find(error => error.code == code) || httpErrors[code] || httpErrors["500 Internal Server Error"];
  httpError.description = err.message || httpError.description;
  httpError.title = httpError.code;

  //console.log(["HTTTP Errot", err])
  return httpError;
  //return httpErrors[code] || httpErrors["500 Internal Server Error"];
}