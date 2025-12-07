import { db } from './index.js';
import { accounts, users, customers, leads, products, quotes, quoteLines } from './schema.js';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { seedBoilers } from './seedBoilers.js';

dotenv.config({ path: '../../.env' });

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Seed boiler specifications
    await seedBoilers();

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

    // Create demo customers
    console.log('Creating demo customers...');
    const demoCustomers = await db
      .insert(customers)
      .values([
        {
          accountId: account.id,
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          phone: '01234 567890',
          addressLine1: '123 High Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          propertyType: 'detached',
          constructionYear: 1995,
          notes: 'Interested in new combi boiler',
          tags: ['high-priority', 'referral'],
        },
        {
          accountId: account.id,
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@example.com',
          phone: '01234 567891',
          addressLine1: '456 Oak Avenue',
          city: 'Manchester',
          postcode: 'M1 1AA',
          propertyType: 'semi',
          constructionYear: 2005,
          notes: 'Looking for heat pump installation',
          tags: ['new-build'],
        },
        {
          accountId: account.id,
          firstName: 'Michael',
          lastName: 'Brown',
          email: 'michael.brown@example.com',
          phone: '01234 567892',
          addressLine1: '789 Park Road',
          city: 'Birmingham',
          postcode: 'B1 1AA',
          propertyType: 'terraced',
          constructionYear: 1985,
          notes: 'Existing boiler needs replacement',
        },
      ])
      .returning();

    console.log(`✅ Created ${demoCustomers.length} demo customers`);

    // Create demo leads
    console.log('Creating demo leads...');
    const demoLeads = await db
      .insert(leads)
      .values([
        {
          accountId: account.id,
          customerId: demoCustomers[0].id,
          source: 'website',
          campaign: 'Spring 2025 Promotion',
          status: 'qualified',
          priority: 'high',
          estimatedValue: '4500.00',
          assignedTo: adminUser.id,
          notes: 'Very interested in Worcester Bosch combi',
        },
        {
          accountId: account.id,
          customerId: demoCustomers[1].id,
          source: 'referral',
          status: 'contacted',
          priority: 'medium',
          estimatedValue: '12000.00',
          assignedTo: adminUser.id,
          notes: 'Referred by previous customer',
        },
      ])
      .returning();

    console.log(`✅ Created ${demoLeads.length} demo leads`);

    // Create demo products
    console.log('Creating demo products...');
    const demoProducts = await db
      .insert(products)
      .values([
        {
          accountId: account.id,
          sku: 'WB-GS2000-25C',
          name: 'Worcester Bosch Greenstar 2000 25kW Combi',
          manufacturer: 'Worcester Bosch',
          category: 'boiler',
          subcategory: 'combi',
          description: 'High-efficiency condensing combi boiler',
          specifications: {
            outputKw: 25,
            flowRate: '10.2 L/min',
            efficiency: '94%',
            warranty: '10 years',
          },
          costPrice: '850.00',
          sellPrice: '1200.00',
          laborHours: '8.00',
          warrantyYears: 10,
          stockLevel: 5,
          minStockLevel: 2,
        },
        {
          accountId: account.id,
          sku: 'VAL-ETEC-832',
          name: 'Vaillant ecoTEC Plus 832 32kW Combi',
          manufacturer: 'Vaillant',
          category: 'boiler',
          subcategory: 'combi',
          description: 'Premium efficiency combi boiler',
          specifications: {
            outputKw: 32,
            flowRate: '13.1 L/min',
            efficiency: '94%',
            warranty: '10 years',
          },
          costPrice: '950.00',
          sellPrice: '1350.00',
          laborHours: '8.00',
          warrantyYears: 10,
          stockLevel: 3,
          minStockLevel: 1,
        },
        {
          accountId: account.id,
          sku: 'FILTER-MB3',
          name: 'MagnaBoost Filter',
          manufacturer: 'Adey',
          category: 'filter',
          description: 'Magnetic system filter',
          costPrice: '45.00',
          sellPrice: '85.00',
          laborHours: '1.00',
          stockLevel: 20,
          minStockLevel: 5,
        },
        {
          accountId: account.id,
          sku: 'CONTROL-HIVE',
          name: 'Hive Active Heating Thermostat',
          manufacturer: 'British Gas',
          category: 'control',
          description: 'Smart heating control with app',
          costPrice: '120.00',
          sellPrice: '200.00',
          laborHours: '2.00',
          stockLevel: 10,
          minStockLevel: 3,
        },
      ])
      .returning();

    console.log(`✅ Created ${demoProducts.length} demo products`);

    // Create demo quote
    console.log('Creating demo quote...');
    const [demoQuote] = await db
      .insert(quotes)
      .values({
        accountId: account.id,
        customerId: demoCustomers[0].id,
        leadId: demoLeads[0].id,
        quoteNumber: 'QUO-2025-001',
        title: 'New Combi Boiler Installation',
        status: 'sent',
        validUntil: new Date('2025-12-31'),
        subtotal: '1485.00',
        taxRate: '20.00',
        taxAmount: '297.00',
        total: '1782.00',
        depositAmount: '500.00',
        notes: 'Includes removal of old boiler and installation',
        termsAndConditions: 'Payment terms: 50% deposit, balance on completion.',
        createdBy: adminUser.id,
      })
      .returning();

    console.log('✅ Created demo quote');

    // Create quote lines
    console.log('Creating quote lines...');
    await db.insert(quoteLines).values([
      {
        quoteId: demoQuote.id,
        productId: demoProducts[0].id,
        sortOrder: 1,
        description: 'Worcester Bosch Greenstar 2000 25kW Combi Boiler',
        quantity: 1,
        unitPrice: '1200.00',
        discount: '0.00',
        lineTotal: '1200.00',
      },
      {
        quoteId: demoQuote.id,
        productId: demoProducts[2].id,
        sortOrder: 2,
        description: 'MagnaBoost Magnetic System Filter',
        quantity: 1,
        unitPrice: '85.00',
        discount: '0.00',
        lineTotal: '85.00',
      },
      {
        quoteId: demoQuote.id,
        productId: demoProducts[3].id,
        sortOrder: 3,
        description: 'Hive Active Heating Thermostat',
        quantity: 1,
        unitPrice: '200.00',
        discount: '0.00',
        lineTotal: '200.00',
      },
    ]);

    console.log('✅ Created quote lines');

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
