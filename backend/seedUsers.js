require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Wipe past logins
    await User.deleteMany({});
    console.log('Cleared all past users from the database.');

    // Passwords
    const salt = await bcrypt.genSalt(10);
    const citizenPassword = await bcrypt.hash('user123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);

    // Create a citizen
    await User.create({
      name: 'Test Citizen',
      mobile: '1234567890',
      password: citizenPassword,
      role: 'citizen',
      taluka: 'Daund'
    });
    console.log('Created new Citizen user -> Mobile: 1234567890 | Password: user123');

    // Create an admin
    await User.create({
      name: 'MLA Admin Hub',
      mobile: '9876543210',
      password: adminPassword,
      role: 'super_admin'
    });
    console.log('Created new Admin user -> Mobile: 9876543210 | Password: admin123');

    console.log('Database seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
