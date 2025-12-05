require('dotenv').config();
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');


(async () => {
try {
await connectDB();
const email = 'admin@lagosschool.com';
const exists = await User.findOne({ email });
if (exists) {
console.log('Admin already exists:', exists.email);
process.exit(0);
}
const admin = await User.create({
name: 'System Admin',
email,
username: 'admin',
role: 'admin',
password: 'Admin@123' // change after first login
});
console.log('Admin created:', admin.email);
process.exit(0);
} catch (e) {
console.error(e);
process.exit(1);
}
})();