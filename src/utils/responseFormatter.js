// Format success response
const formatSuccess = (message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (Array.isArray(data)) {
    response.count = data.length;
  }
  
  return {
    statusCode,
    body: response
  };
};

// Format error response
const formatError = (message, type = 'server_error', statusCode = 500) => {
  return {
    statusCode,
    body: {
      success: false,
      message,
      type
    }
  };
};

module.exports = {
  formatSuccess,
  formatError
};
