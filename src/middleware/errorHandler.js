const { StatusCodes } = require('http-status-codes');


exports.notFound = (req, res, next) => {
res.status(StatusCodes.NOT_FOUND).json({ message: 'Route not found' });
};


exports.errorHandler = (err, req, res, next) => {
console.error(err);
const status = err.status || StatusCodes.BAD_REQUEST;
res.status(status).json({ message: err.message || 'Something went wrong' });
};