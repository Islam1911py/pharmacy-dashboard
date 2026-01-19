import { PrismaClient, DosageForm } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user and employee record
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pharmacy.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@pharmacy.com',
      phone: '+1234567890',
      passwordHash: adminPassword,
      role: 'admin',
      isActive: true,
      employee: {
        create: {
          employeeCode: 'ADMIN001',
          department: 'Management',
        },
      },
    },
    include: {
      employee: true,
    },
  });

  // If admin already exists but has no employee record, create one
  if (admin && !admin.employee) {
    await prisma.employee.create({
      data: {
        userId: admin.id,
        employeeCode: 'ADMIN001',
        department: 'Management',
      },
    });
  }

  console.log('✅ Admin user created:', admin.email);

  // Create additional users for testing
  const testUsers = [
    {
      email: 'manager@pharmacy.com',
      name: 'Manager User',
      phone: '+1234567891',
      password: 'manager123',
      role: 'manager' as const,
      employeeCode: 'MGR001',
      department: 'Management',
    },
    {
      email: 'supervisor@pharmacy.com',
      name: 'Supervisor User',
      phone: '+1234567892',
      password: 'supervisor123',
      role: 'supervisor' as const,
      employeeCode: 'SUP001',
      department: 'Operations',
    },
    {
      email: 'employee@pharmacy.com',
      name: 'Employee User',
      phone: '+1234567893',
      password: 'employee123',
      role: 'employee' as const,
      employeeCode: 'EMP001',
      department: 'Sales',
    },
  ];

  for (const testUser of testUsers) {
    const hashedPassword = await hashPassword(testUser.password);
    const user = await prisma.user.upsert({
      where: { email: testUser.email },
      update: {},
      create: {
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        passwordHash: hashedPassword,
        role: testUser.role,
        isActive: true,
        employee: {
          create: {
            employeeCode: testUser.employeeCode,
            department: testUser.department,
          },
        },
      },
      include: {
        employee: true,
      },
    });

    // If user already exists but has no employee record, create one
    if (user && !user.employee) {
      await prisma.employee.create({
        data: {
          userId: user.id,
          employeeCode: testUser.employeeCode,
          department: testUser.department,
        },
      });
    }

    console.log(`✅ ${testUser.role} user created:`, user.email);
  }

  // Create sample categories
  const categories = [
    'Pain Relief',
    'Antibiotics',
    'Vitamins',
    'Skin Care',
    'Digestive Health',
    'Respiratory',
  ];

  // Create sample products
  const sampleProducts: Array<{
    name: string;
    category: string;
    description: string;
    activeIngredient: string;
    dosageForm: DosageForm;
    price: number;
    stockQuantity: number;
    lowStockThreshold: number;
  }> = [
    {
      name: 'Paracetamol 500mg',
      category: 'Pain Relief',
      description: 'Pain reliever and fever reducer',
      activeIngredient: 'Paracetamol',
      dosageForm: DosageForm.tablet,
      price: 5.99,
      stockQuantity: 100,
      lowStockThreshold: 20,
    },
    {
      name: 'Ibuprofen 400mg',
      category: 'Pain Relief',
      description: 'Anti-inflammatory pain reliever',
      activeIngredient: 'Ibuprofen',
      dosageForm: DosageForm.tablet,
      price: 7.99,
      stockQuantity: 80,
      lowStockThreshold: 15,
    },
    {
      name: 'Amoxicillin 500mg',
      category: 'Antibiotics',
      description: 'Broad-spectrum antibiotic',
      activeIngredient: 'Amoxicillin',
      dosageForm: DosageForm.capsule,
      price: 12.99,
      stockQuantity: 50,
      lowStockThreshold: 10,
    },
    {
      name: 'Vitamin C 1000mg',
      category: 'Vitamins',
      description: 'Immune system support',
      activeIngredient: 'Ascorbic Acid',
      dosageForm: DosageForm.tablet,
      price: 8.99,
      stockQuantity: 200,
      lowStockThreshold: 30,
    },
    {
      name: 'Vitamin D3 1000IU',
      category: 'Vitamins',
      description: 'Bone health support',
      activeIngredient: 'Cholecalciferol',
      dosageForm: DosageForm.capsule,
      price: 9.99,
      stockQuantity: 150,
      lowStockThreshold: 25,
    },
    {
      name: 'Moisturizing Cream',
      category: 'Skin Care',
      description: 'Hydrating skin cream',
      activeIngredient: 'Glycerin',
      dosageForm: DosageForm.cream,
      price: 15.99,
      stockQuantity: 60,
      lowStockThreshold: 10,
    },
    {
      name: 'Antacid Tablets',
      category: 'Digestive Health',
      description: 'Relief from heartburn',
      activeIngredient: 'Calcium Carbonate',
      dosageForm: DosageForm.tablet,
      price: 6.99,
      stockQuantity: 90,
      lowStockThreshold: 20,
    },
    {
      name: 'Cough Syrup',
      category: 'Respiratory',
      description: 'Cough relief syrup',
      activeIngredient: 'Dextromethorphan',
      dosageForm: DosageForm.syrup,
      price: 8.99,
      stockQuantity: 70,
      lowStockThreshold: 15,
    },
  ];

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { id: crypto.randomUUID() },
      update: {},
      create: {
        ...product,
        id: crypto.randomUUID(),
      },
    });
  }

  console.log(`✅ Created ${sampleProducts.length} sample products`);

  // Create sample customers
  const sampleCustomers = [
    {
      name: 'John Doe',
      phone: '+1234567891',
      address: '123 Main Street, City',
    },
    {
      name: 'Jane Smith',
      phone: '+1234567892',
      address: '456 Oak Avenue, Town',
    },
    {
      name: 'Robert Johnson',
      phone: '+1234567893',
      address: '789 Pine Road, Village',
    },
  ];

  for (const customer of sampleCustomers) {
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: {},
      create: customer,
    });
  }

  console.log(`✅ Created ${sampleCustomers.length} sample customers`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
