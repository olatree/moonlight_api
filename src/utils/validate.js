const validator = require('validator');


exports.validateLogin = (body) => {
const identifier = (body.identifier || body.email || body.username || '').trim();
const password = (body.password || '').trim();
if (!identifier || !password) throw new Error('Identifier and password are required');
// Optional: email format check if identifier contains @
if (identifier.includes('@') && !validator.isEmail(identifier)) {
throw new Error('Invalid email');
}
return { identifier, password };
};