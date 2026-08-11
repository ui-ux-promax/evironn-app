import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { ProfileView, type ProfileOrder } from '@/components/shared/profile/profile-view';
import { getWishlistItems } from '@/lib/wishlist';
import { wishlistCookieName } from '@/lib/wishlist-cookie';
import type { ProductCardData } from '@/lib/product-summary';
import type { ProfileValues } from '@/services/dto/auth.dto';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Профиль' };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const store = await cookies();
  const wishlistToken = store.get(wishlistCookieName)?.value;

  const [user, wishlistProducts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        birthdate: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            orderNumber: true,
            status: true,
            createdAt: true,
            itemsTotal: true,
            discountAmount: true,
            shippingAmount: true,
            totalAmount: true,
            paymentMethod: true,
            shippingMethod: true,
            city: true,
            addressLine: true,
            payment: { select: { status: true } },
            items: {
              orderBy: { id: 'asc' },
              select: {
                productName: true,
                imageUrl: true,
                colorwayName: true,
                size: true,
                unitPrice: true,
                quantity: true,
                lineTotal: true,
                productVariant: {
                  select: {
                    size: true,
                    price: true,
                    colorway: {
                      select: {
                        name: true,
                        product: { select: { name: true, brand: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        addresses: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, label: true, city: true, street: true, comment: true, isDefault: true },
        },
      },
    }),
    getWishlistItems(session, wishlistToken),
  ]);

  if (!user) redirect('/login');

  const initial: ProfileValues = {
    name: user.name ?? '',
    phone: user.phone ?? '',
    birthdate: user.birthdate ? user.birthdate.toISOString().slice(0, 10) : '',
  };

  const orders: ProfileOrder[] = user.orders.map((order) => ({
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    itemsTotal: order.itemsTotal,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    shippingMethod: order.shippingMethod,
    city: order.city,
    addressLine: order.addressLine,
    paymentStatus: order.payment?.status ?? null,
    items: order.items.map((item) => ({
      productName: item.productName,
      imageUrl: item.imageUrl,
      productNameFromVariant: item.productVariant.colorway.product.name,
      brand: item.productVariant.colorway.product.brand,
      colorwayName: item.colorwayName || item.productVariant.colorway.name,
      size: item.size || item.productVariant.size,
      qty: item.quantity,
      price: item.unitPrice || item.productVariant.price,
      lineTotal: item.lineTotal,
    })),
  }));

  return (
    <ProfileView
      user={{
        email: user.email,
        name: user.name ?? '',
        phone: user.phone ?? '',
        birthdate: initial.birthdate ?? '',
        createdAt: user.createdAt.toISOString(),
      }}
      initial={initial}
      isAdmin={user.role === 'ADMIN'}
      orders={orders}
      wishlist={wishlistProducts}
      addresses={user.addresses.map((a) => ({
        id: a.id,
        label: a.label,
        city: a.city,
        street: a.street,
        comment: a.comment,
        isDefault: a.isDefault,
      }))}
    />
  );
}
