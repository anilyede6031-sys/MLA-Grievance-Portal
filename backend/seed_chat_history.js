const mongoose = require('mongoose');
const User = require('./models/User');
const AIChat = require('./models/AIChat');

async function seedHistory() {
  const MONGODB_URI = 'mongodb+srv://anilyede6031:Asdf12345678@cluster0.p7ptq.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const citizen = await User.findOne({ mobile: '9552906380' }); // User 'Rahul MLA'
    if (!citizen) {
      console.log('User not found. Please run seedUsers.js first.');
      process.exit(1);
    }

    const messages = [];
    const topics = [
      { q: "रस्त्याची अवस्था खराब आहे", a: "आमच्यापर्यंत तुमची तक्रार पोहोचली आहे. लवकरच दुरुस्ती सुरू होईल." },
      { q: "पाणी कधी येईल?", a: "पाणीपुरवठा विभागात काम सुरू आहे, २ तासांत वीज येईल." },
      { q: "तुमचे नाव काय?", a: "मी 'दौंड डिजिटल सहाय्यक' आहे." },
      { q: "GRV-MN4E92XR-D412 स्टेटस काय आहे?", a: "तुमची तक्रार सध्या 'Pending' आहे." },
      { q: "धन्यवाद", a: "तुमचे स्वागत आहे!" }
    ];

    // Generate 100 pseudo-unique turns
    for (let i = 0; i < 100; i++) {
        const topic = topics[i % topics.length];
        messages.push({ role: 'user', text: `${topic.q} (Test ${i+1})` });
        messages.push({ role: 'bot', text: `${topic.a} (ID: ${Math.random().toString(36).substr(2, 5)})` });
    }

    await AIChat.findOneAndUpdate(
      { userId: citizen._id },
      { messages, lastInteraction: new Date() },
      { upsert: true, new: true }
    );

    console.log(`Successfully seeded 100 chat turns for user ${citizen.name}`);
    process.exit(0);

  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedHistory();
