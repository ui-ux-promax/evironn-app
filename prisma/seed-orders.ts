import { prisma } from '../lib/prisma-client';
import type { OrderStatus } from '@prisma/client';

const TEST_EMAIL_DOMAIN = '@test.ritm.invalid';

type OrderFixture = {
  daysAgo: number;
  status: OrderStatus;
  quantity: number;
  userIndex: number;
  variantIndex: number;
  coupon?: boolean;
};

const fixtures: OrderFixture[] = [
  { daysAgo: 1, status: 'PROCESSING', quantity: 1, userIndex: 0, variantIndex: 0, coupon: true },
  { daysAgo: 2, status: 'DELIVERED', quantity: 2, userIndex: 1, variantIndex: 1 },
  { daysAgo: 3, status: 'SHIPPED', quantity: 1, userIndex: 2, variantIndex: 2 },
  { daysAgo: 5, status: 'DELIVERED', quantity: 1, userIndex: 3, variantIndex: 3, coupon: true },
  { daysAgo: 7, status: 'PENDING', quantity: 1, userIndex: 4, variantIndex: 4 },
  { daysAgo: 9, status: 'DELIVERED', quantity: 2, userIndex: 5, variantIndex: 0 },
  { daysAgo: 12, status: 'CANCELLED', quantity: 1, userIndex: 0, variantIndex: 1 },
  { daysAgo: 15, status: 'SHIPPED', quantity: 1, userIndex: 1, variantIndex: 2, coupon: true },
  { daysAgo: 18, status: 'DELIVERED', quantity: 1, userIndex: 2, variantIndex: 3 },
  { daysAgo: 22, status: 'PROCESSING', quantity: 2, userIndex: 3, variantIndex: 4 },
  { daysAgo: 27, status: 'CANCELLED', quantity: 1, userIndex: 4, variantIndex: 0 },
  { daysAgo: 31, status: 'DELIVERED', quantity: 1, userIndex: 5, variantIndex: 1 },
  { daysAgo: 35, status: 'DELIVERED', quantity: 2, userIndex: 0, variantIndex: 2, coupon: true },
  { daysAgo: 39, status: 'SHIPPED', quantity: 1, userIndex: 1, variantIndex: 3 },
  { daysAgo: 44, status: 'PENDING', quantity: 1, userIndex: 2, variantIndex: 4 },
  { daysAgo: 49, status: 'DELIVERED', quantity: 1, userIndex: 3, variantIndex: 0 },
  { daysAgo: 54, status: 'CANCELLED', quantity: 1, userIndex: 4, variantIndex: 1 },
  { daysAgo: 58, status: 'DELIVERED', quantity: 2, userIndex: 5, variantIndex: 2, coupon: true },
];

const customers = [
  ['Алина Морозова', '+7 913 112-38-52'],
  ['Максим Орлов', '+7 923 441-70-18'],
  ['София Белова', '+7 983 204-56-91'],
  ['Даниил Кузнецов', '+7 903 675-10-42'],
  ['Ева Соколова', '+7 913 789-33-74'],
  ['Артём Васильев', '+7 923 156-09-88'],
] as const;

function paymentStatus(status: OrderStatus) {
  if (status === 'CANCELLED') return 'canceled';
  if (status === 'PENDING' || status === 'PROCESSING') return 'pending';
  return 'succeeded';
}

async function main() {
  const variants = await prisma.productVariant.findMany({
    where: { active: true, stock: { gt: 0 } },
    take: 5,
    orderBy: { sku: 'asc' },
    include: {
      colorway: {
        include: {
          product: true,
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
    },
  });
  if (variants.length < 5) throw new Error('Для тестовых заказов нужно минимум 5 активных вариантов в наличии.');

  await prisma.order.deleteMany({ where: { contactEmail: { endsWith: TEST_EMAIL_DOMAIN } } });

  const userIds = await Promise.all(
    customers.map(async ([name, phone], index) => {
      const email = `dashboard-demo-${index + 1}${TEST_EMAIL_DOMAIN}`;
      const user = await prisma.user.upsert({
        where: { email },
        update: { name, phone, role: 'CUSTOMER', isPortfolioFixture: true },
        create: { email, name, phone, role: 'CUSTOMER', isPortfolioFixture: true },
      });
      return user.id;
    }),
  );

  for (const [index, fixture] of fixtures.entries()) {
    const variant = variants[fixture.variantIndex];
    const [name, phone] = customers[fixture.userIndex];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - fixture.daysAgo);
    createdAt.setHours(11 + (index % 7), 15 + ((index * 9) % 40), 0, 0);

    const itemsTotal = variant.price * fixture.quantity;
    const discountAmount = fixture.coupon ? Math.round(itemsTotal * 0.1) : 0;
    const shippingAmount = itemsTotal - discountAmount >= 7000 ? 0 : 490;
    const totalAmount = itemsTotal - discountAmount + shippingAmount;
    const status = fixture.status;

    const order = await prisma.order.create({
      data: {
        userId: userIds[fixture.userIndex],
        status,
        contactName: name,
        contactPhone: phone,
        contactEmail: `dashboard-demo-${fixture.userIndex + 1}${TEST_EMAIL_DOMAIN}`,
        shippingMethod: index % 2 === 0 ? 'Доставка курьером' : 'Пункт выдачи',
        city: index % 2 === 0 ? 'Новосибирск' : 'Москва',
        addressLine: index % 2 === 0 ? `ул. Ленина, ${20 + index}` : `ул. Тверская, ${10 + index}`,
        itemsTotal,
        discountAmount,
        shippingAmount,
        totalAmount,
        couponCode: fixture.coupon ? 'RITM10' : null,
        paymentMethod: 'bank_card',
        createdAt,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productVariantId: variant.id,
        sku: variant.sku,
        productName: variant.colorway.product.name,
        colorwayName: variant.colorway.name,
        size: variant.size,
        imageUrl: variant.colorway.images[0]?.url ?? null,
        unitPrice: variant.price,
        quantity: fixture.quantity,
        lineTotal: itemsTotal,
      },
    });

    const statusPayment = paymentStatus(status);
    await prisma.payment.create({
      data: {
        id: `test-dashboard-payment-${index + 1}`,
        orderId: order.id,
        status: statusPayment,
        amount: totalAmount,
        paidAt: statusPayment === 'succeeded' ? createdAt : null,
        createdAt,
      },
    });
  }

  console.log(`Создано ${fixtures.length} тестовых заказов для dashboard.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
