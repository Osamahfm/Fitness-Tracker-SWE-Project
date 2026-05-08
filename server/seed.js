import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { updateDb } from './database.js';

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

async function seed() {
  await updateDb((db) => {
    const seedUsers = [
      { name: 'Admin One', email: 'admin1@fitflow.com', role: 'admin', password: 'password123' },
      { name: 'Admin Two', email: 'admin2@fitflow.com', role: 'admin', password: 'password123' },
      { name: 'Trainer One', email: 'trainer1@fitflow.com', role: 'trainer', password: 'password123' },
      { name: 'Trainer Two', email: 'trainer2@fitflow.com', role: 'trainer', password: 'password123' },
      { name: 'Trainer Three', email: 'trainer3@fitflow.com', role: 'trainer', password: 'password123' },
    ];

    for (const u of seedUsers) {
      if (!db.users.some(existing => existing.email === u.email)) {
        const passwordData = hashPassword(u.password);
        db.users.push({
          id: randomBytes(12).toString('hex'),
          name: u.name,
          email: u.email,
          role: u.role,
          goal: "Body Recompose",
          weight: 75,
          passwordSalt: passwordData.salt,
          passwordHash: passwordData.hash,
          validated: true,
          createdAt: new Date().toISOString()
        });
        console.log(`Added ${u.role}: ${u.email}`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }
    return db;
  });
  console.log("Database seeded successfully.");
}

seed().catch(console.error);