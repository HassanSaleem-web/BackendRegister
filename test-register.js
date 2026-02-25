const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testRegister = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        const email = 'test-register@example.com';
        const password = 'password123';

        // Cleanup first
        await User.deleteOne({ email });

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword);

        const user = new User({
            name: 'Test Register',
            email,
            password: hashedPassword,
            company: 'Test Co'
        });

        await user.save();
        console.log('✅ User registered:', user);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        mongoose.connection.close();
    }
};

testRegister();
