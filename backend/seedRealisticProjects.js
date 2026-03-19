const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./models/Project');

const projects = [
  {
    name: "Daund-Patas Highway Concreting",
    department: "Road",
    budget: 45.5,
    status: "under_process",
    description: "High-grade CC road construction connecting Daund to Patas Industrial Hub. Expected to reduce travel time by 20 minutes.",
    expectedCompletionDate: "2025-12-30",
    lat: 18.4715,
    lng: 74.5910,
    imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "Khurawadi Water Storage Reservoir",
    department: "Water",
    budget: 12.8,
    status: "complete",
    description: "Multi-million liter capacity water tank to provide 24/7 drinking water to 5 nearby villages including Khurawadi.",
    expectedCompletionDate: "2024-03-15",
    lat: 18.4550,
    lng: 74.5750,
    imageUrl: "https://images.unsplash.com/photo-1541944743827-e04bb645d993?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "Daund Multi-Specialty Hospital Expansion",
    department: "Health",
    budget: 28.3,
    status: "under_process",
    description: "Adding 100 beds and a dedicated Cardiology wing to the existing hospital infrastructure.",
    expectedCompletionDate: "2026-06-20",
    lat: 18.4650,
    lng: 74.5850,
    imageUrl: "https://images.unsplash.com/photo-1586773860418-d319a39ec55e?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "Zilla Parishad Digital School Hub",
    department: "Education",
    budget: 5.2,
    status: "complete",
    description: "Equipping 10 rural schools with interactive displays, high-speed internet, and tablet-based learning systems.",
    expectedCompletionDate: "2025-01-10",
    lat: 18.4750,
    lng: 74.6000,
    imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "New Police Headquarters & Command Center",
    department: "Police",
    budget: 15.0,
    status: "incomplete",
    description: "State-of-the-art surveillance and response center for regional monitoring and traffic management.",
    expectedCompletionDate: "2027-02-14",
    lat: 18.4600,
    lng: 74.5800,
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop"
  }
];

const seedRealisticProjects = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Clear existing projects to avoid duplicates if needed, 
    // or just insert new ones. I'll clear them to make the map strictly realistic.
    await Project.deleteMany({});
    console.log("Existing projects cleared.");

    await Project.insertMany(projects);
    console.log("Realistic projects seeded successfully!");

    process.exit();
  } catch (error) {
    console.error("Error seeding projects:", error);
    process.exit(1);
  }
};

seedRealisticProjects();
