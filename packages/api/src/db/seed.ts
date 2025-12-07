import { db, accounts, users } from './index.js';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create default account
    const [account] = await db.insert(accounts).values({
      name: 'Demo Heating Ltd',
      plan: 'pro',
      isActive: true,
    }).returning();

    console.log('✅ Created account:', account.name);

    // Create admin user
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@phm.local';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin123!@#';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const [adminUser] = await db.insert(users).values({
      accountId: account.id,
      email: adminEmail,
      name: 'Admin User',
      passwordHash,
      role: 'admin',
      isActive: true,
    }).returning();

    console.log('✅ Created admin user:', adminUser.email);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('');
    console.log('⚠️  CHANGE THE DEFAULT PASSWORD IMMEDIATELY!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  console.log('✅ Seeding completed successfully');
  process.exit(0);
}

seed();
