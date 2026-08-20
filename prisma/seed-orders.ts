import { prisma } from '../lib/prisma-client';
import type { OrderStatus } from '@prisma/client';

const TEST_EMAIL_DOMAIN = '@test.ritm.invalid';

type OrderFixture = {
  daysAgo: number;
  status: OrderStatus;
  quantity: number;
  userIndex: number;
  skuIndex: number;
  coupon?: boolean;
};

const fixtures: OrderFixture[] = [
  { daysAgo: 1, status: 'PROCESSING', quantity: 1, userIndex: 0, skuIndex: 0, coupon: true },
  { daysAgo: 2, status: 'DELIVERED', quantity: 2, userIndex: 1, skuIndex: 1 },
  { daysAgo: 3, status: 'SHIPPED', quantity: 1, userIndex: 2, skuIndex: 2 },
  { daysAgo: 5, status: 'DELIVERED', quantity: 1, userIndex: 3, skuIndex: 3, coupon: true },
  { daysAgo: 7, status: 'PENDING', quantity: 1, userIndex: 4, skuIndex: 4 },
  { daysAgo: 9, status: 'DELIVERED', quantity: 2, userIndex: 5, skuIndex: 0 },
  { daysAgo: 12, status: 'CANCELLED', quantity: 1, userIndex: 0, skuIndex: 1 },
  { daysAgo: 15, status: 'SHIPPED', quantity: 1, userIndex: 1, skuIndex: 2, coupon: true },
  { daysAgo: 18, status: 'DELIVERED', quantity: 1, userIndex: 2, skuIndex: 3 },
  { daysAgo: 22, status: 'PROCESSING', quantity: 2, userIndex: 3, skuIndex: 4 },
  { daysAgo: 27, status: 'CANCELLED', quantity: 1, userIndex: 4, skuIndex: 0 },
  { daysAgo: 31, status: 'DELIVERED', quantity: 1, userIndex: 5, skuIndex: 1 },
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
  const skus = await prisma.sku.findMany({
    where: { active: true, stock: { gt: 0 } },
    take: 5,
    orderBy: { articleNumber: 'asc' },
    include: {
      product: true,
      media: { where: { kind: 'IMAGE' }, orderBy: { sortOrder: 'asc' }, take: 1 },
      selections: { include: { optionGroup: true, optionValue: true } },
    },
  });
  if (skus.length < 5) throw new Error('At least 5 active furniture SKUs with stock are required for order fixtures.');

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
    const selectedSku = skus[fixture.skuIndex];
    const [name, phone] = customers[fixture.userIndex];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - fixture.daysAgo);
    createdAt.setHours(11 + (index % 7), 15 + ((index * 9) % 40), 0, 0);

    const itemsTotal = selectedSku.price * fixture.quantity;
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
        shippingMethod: index % 2 === 0 ? 'Курьер' : 'Пункт выдачи',
        city: index % 2 === 0 ? 'Новосибирск' : 'Москва',
        addressLine: index % 2 === 0 ? `ул. Ленина, ${20 + index}` : `ул. Тверская, ${10 + index}`,
        itemsTotal,
        discountAmount,
        shippingAmount,
        totalAmount,
        couponCode: fixture.coupon ? 'WELCOME10' : null,
        paymentMethod: 'bank_card',
        createdAt,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        skuId: selectedSku.id,
        skuArticleNumber: selectedSku.articleNumber,
        skuCombinationKey: selectedSku.combinationKey,
        productName: selectedSku.product.name,
        productSlug: selectedSku.product.slug,
        configuration: selectedSku.selections.map((selection) => ({
          groupSlug: selection.optionGroup.slug,
          groupName: selection.optionGroup.name,
          valueSlug: selection.optionValue.slug,
          valueName: selection.optionValue.name,
        })),
        imageUrl: selectedSku.media[0]?.url ?? null,
        unitPrice: selectedSku.price,
        oldUnitPrice: selectedSku.oldPrice,
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

  console.log(`Created ${fixtures.length} furniture order fixtures for dashboard.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
