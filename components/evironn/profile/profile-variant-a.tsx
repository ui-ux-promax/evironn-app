'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FiCheck,
  FiHeart,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiPackage,
  FiPlus,
  FiShoppingBag,
  FiTrash2,
  FiTruck,
  FiUser,
} from 'react-icons/fi';
import { CatalogCard } from '@/components/evironn/catalog/catalog-card';
import { Field, FormError, SubmitButton } from '@/components/evironn/forms/form-primitives';
import { formatPrice } from '@/lib/format';
import type { ProfilePageDto, ProfileOrderDto, ProfileSection } from '@/services/dto/profile-page.dto';
import type { ProfileValues } from '@/services/dto/auth.dto';
import { useProfileVariantA, type PasswordValues, type ProfileAddressValues } from './use-profile-variant-a';

const PROFILE_SECTIONS: Array<{ id: ProfileSection; label: string }> = [
  { id: 'overview', label: 'Обзор' },
  { id: 'orders', label: 'Заказы' },
  { id: 'favorites', label: 'Избранное' },
  { id: 'profile', label: 'Профиль' },
  { id: 'addresses', label: 'Адреса' },
];

const ICONS: Record<ProfileSection, typeof FiUser> = {
  overview: FiUser,
  orders: FiPackage,
  favorites: FiHeart,
  profile: FiUser,
  addresses: FiMapPin,
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Оформлен',
  PROCESSING: 'Собираем',
  SHIPPED: 'В пути',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
};

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date(value));
}

export function ProfileVariantA({ dto }: { dto: ProfilePageDto }) {
  const profile = useProfileVariantA(dto);
  const title =
    profile.section === 'overview'
      ? `Здравствуйте, ${profile.data.user.name.trim().split(/\s+/)[0] || 'гость'}`
      : PROFILE_SECTIONS.find((item) => item.id === profile.section)?.label;

  return (
    <main className="prf prf--a" id="main-content">
      <header className="prf__head">
        <p className="prf__crumbs">
          <Link href="/">Главная</Link>
          <span>/</span>Личный кабинет
        </p>
        <div className="prf__identity">
          <span className="prf__avatar" aria-hidden="true">
            {profile.data.user.initials}
          </span>
          <div>
            <p className="prf__eyebrow">Личный кабинет</p>
            <h1>{title}</h1>
            <p>{profile.data.user.email}</p>
          </div>
          <button className="prf__logout" type="button" onClick={() => void profile.actions.logout()}>
            <FiLogOut />
            Выйти
          </button>
        </div>
      </header>

      <div className="prf__shell">
        <ProfileNav
          section={profile.section}
          onGo={profile.actions.go}
          orders={profile.data.stats.orders}
          favorites={profile.data.stats.favorites}
        />
        <section className="prf__content" aria-live="polite">
          {profile.error && <FormError message={profile.error} />}
          {profile.section === 'overview' && <Overview profile={profile} />}
          {profile.section === 'orders' && <Orders orders={profile.data.orders} />}
          {profile.section === 'favorites' && <Favorites profile={profile} />}
          {profile.section === 'profile' && <Account profile={profile} />}
          {profile.section === 'addresses' && <Addresses profile={profile} />}
        </section>
      </div>
    </main>
  );
}

function ProfileNav({
  section,
  onGo,
  orders,
  favorites,
}: {
  section: ProfileSection;
  onGo: (section: ProfileSection) => void;
  orders: number;
  favorites: number;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState({ left: 7, width: 0 });

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const active = activeRef.current;
      if (!active) return;
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
      active.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [section]);

  return (
    <nav className="prf__nav" aria-label="Разделы кабинета">
      <span
        className="prf__nav-indicator"
        aria-hidden="true"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {PROFILE_SECTIONS.map((item) => {
        const Icon = ICONS[item.id];
        const count = item.id === 'orders' ? orders : item.id === 'favorites' ? favorites : undefined;
        return (
          <button
            ref={item.id === section ? activeRef : undefined}
            className={item.id === section ? 'is-current' : ''}
            type="button"
            key={item.id}
            aria-current={item.id === section ? 'page' : undefined}
            onClick={() => onGo(item.id)}
          >
            <Icon />
            <span>{item.label}</span>
            {count !== undefined && <em>{count}</em>}
          </button>
        );
      })}
    </nav>
  );
}

function Overview({ profile }: { profile: ReturnType<typeof useProfileVariantA> }) {
  const latest = profile.data.orders.find((order) => !['DELIVERED', 'CANCELLED'].includes(order.status));
  const fallback = latest ?? profile.data.orders[0];
  const loyalty = profile.data.loyalty ?? { balance: 4460, nextLevel: 8000 };
  const remaining = Math.max(0, loyalty.nextLevel - loyalty.balance);
  const progress = Math.min(100, Math.round((loyalty.balance / loyalty.nextLevel) * 100));
  return (
    <>
      <section className="prf__loyalty">
        <div>
          <p className="prf__eyebrow">Evironn круг</p>
          <h2>Тёплый дом</h2>
          <p>До уровня «Свой круг» осталось {remaining.toLocaleString('ru-RU')} бонусов.</p>
        </div>
        <strong>
          {loyalty.balance.toLocaleString('ru-RU')}
          <small>бонусов</small>
        </strong>
        <span>
          <i style={{ width: `${progress}%` }} />
        </span>
      </section>
      {fallback && (
        <section className="prf__active-order">
          <div className="prf__section-head">
            <div>
              <p className="prf__eyebrow">{latest ? 'Активный заказ' : 'Последний заказ'}</p>
              <h2>{fallback.orderNumber}</h2>
            </div>
            <span className={`prf__status is-${fallback.status.toLowerCase()}`}>
              {STATUS_LABELS[fallback.status] ?? fallback.status}
            </span>
          </div>
          <p>
            {dateLabel(fallback.createdAt)} · {formatPrice(fallback.totalAmount)}
          </p>
          {latest ? (
            <>
              <ProfileTracking order={fallback} />
              <Link className="prf__text-link" href={`/orders/${fallback.orderNumber}`}>
                К заказу
              </Link>
            </>
          ) : (
            <p>{fallback.items.map((item) => `${item.name} · ${item.quantity} шт.`).join(', ')}</p>
          )}
        </section>
      )}
      <section className="prf__quick" aria-label="Быстрые ссылки">
        <button type="button" onClick={() => profile.actions.go('orders')}>
          <FiPackage />
          <b>{profile.data.stats.orders}</b>
          <span>заказов</span>
        </button>
        <button type="button" onClick={() => profile.actions.go('favorites')}>
          <FiHeart />
          <b>{profile.data.stats.favorites}</b>
          <span>избранных</span>
        </button>
        <button type="button">
          <FiShoppingBag />
          <b>{loyalty.balance.toLocaleString('ru-RU')}</b>
          <span>бонусов</span>
        </button>
      </section>
    </>
  );
}

function ProfileTracking({ order }: { order: ProfileOrderDto }) {
  const steps = [
    ['PENDING', 'Оформлен'],
    ['PROCESSING', 'Собираем'],
    ['SHIPPED', 'В пути'],
    ['DELIVERED', 'Доставлен'],
  ] as const;
  const current = steps.findIndex(([status]) => status === order.status);

  return (
    <ol className="ord-track ord-track--light ord-track--row" aria-label="Статус заказа">
      {steps.map(([status, label], index) => (
        <li
          className={index < current ? 'is-done' : index === current ? 'is-current' : ''}
          aria-current={index === current ? 'step' : undefined}
          key={status}
        >
          <span className="ord-track__dot">{index < current ? <FiCheck /> : index + 1}</span>
          <b>{label}</b>
          <span className="ord-track__note">{index <= current ? 'Статус подтверждён' : 'Ожидается'}</span>
        </li>
      ))}
      <li className="ord-track__eta">
        <span className="ord-track__dot">
          <FiTruck />
        </span>
        <b>{order.deliveryDate ? dateLabel(order.deliveryDate) : 'Доставка'}</b>
        <span className="ord-track__note">{order.deliveryWindow ?? 'Окно уточняется'}</span>
      </li>
    </ol>
  );
}

function Orders({ orders }: { orders: ProfileOrderDto[] }) {
  const [open, setOpen] = useState<string | null>(orders[0]?.id ?? null);
  return (
    <>
      <SectionHeading title="Заказы" copy="История покупок и сохранённые снимки заказа." />
      <div className="prf__orders">
        {orders.map((order) => (
          <article className="prf__order" key={order.id}>
            <button
              className="prf__order-top"
              type="button"
              onClick={() => setOpen(open === order.id ? null : order.id)}
            >
              <span>
                <b>{order.orderNumber}</b>
                <small>{dateLabel(order.createdAt)}</small>
              </span>
              <span className={`prf__status is-${order.status.toLowerCase()}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
              <strong>{formatPrice(order.totalAmount)}</strong>
            </button>
            {open === order.id && (
              <div className="prf__order-detail">
                <div>
                  {order.items.map((item) => (
                    <p key={item.id}>
                      {item.name}
                      <span>{item.quantity} шт.</span>
                    </p>
                  ))}
                </div>
                <dl>
                  <div>
                    <dt>Доставка</dt>
                    <dd>
                      {order.city}, {order.addressLine}
                    </dd>
                  </div>
                  <div>
                    <dt>Состав</dt>
                    <dd>{order.itemsTotal ? formatPrice(order.itemsTotal) : '—'}</dd>
                  </div>
                  <div>
                    <dt>Дата</dt>
                    <dd>{dateLabel(order.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            )}
          </article>
        ))}
      </div>
      {orders.length === 0 && <Empty icon={<FiPackage />} text="Заказов пока нет" />}
    </>
  );
}

function Favorites({ profile }: { profile: ReturnType<typeof useProfileVariantA> }) {
  return (
    <>
      <SectionHeading title="Избранное" copy="Предметы, к которым хочется вернуться." />
      <div className="prf__favorites">
        {profile.data.favorites.map((product, index) => (
          <div className="prf__favorite" key={product.id}>
            <CatalogCard
              product={product}
              wishlisted
              eager={index < 4}
              onWishlistToggle={profile.actions.toggleFavorite}
            />
            <div>
              <button
                type="button"
                disabled={!product.primarySkuId || product.soldOut || profile.pending}
                onClick={() => void profile.actions.addFavoriteToCart(product.primarySkuId, product.soldOut)}
              >
                В корзину
              </button>
              <button
                aria-label={`Убрать ${product.name} из избранного`}
                type="button"
                onClick={() => void profile.actions.toggleFavorite(product.id)}
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
      {profile.data.favorites.length === 0 && (
        <Empty icon={<FiHeart />} text="Избранное пока пусто" link="Открыть каталог" href="/catalog" />
      )}
    </>
  );
}

function Account({ profile }: { profile: ReturnType<typeof useProfileVariantA> }) {
  const [form, setForm] = useState<ProfileValues>({
    name: profile.data.user.name,
    phone: profile.data.user.phone,
    birthdate: profile.data.user.birthdate.slice(0, 10),
  });
  const [password, setPassword] = useState<PasswordValues>({
    currentPassword: '',
    newPassword: '',
    repeatPassword: '',
  });
  const update = (key: keyof ProfileValues, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const updatePasswordField = (key: keyof PasswordValues, value: string) =>
    setPassword((current) => ({ ...current, [key]: value }));

  return (
    <>
      <SectionHeading title="Профиль" copy="Контакты и безопасность учётной записи." />
      <div className="prf__form-grid">
        <Field label="Имя и фамилия" value={form.name ?? ''} onChange={(value) => update('name', value)} />
        <Field label="Телефон" value={form.phone ?? ''} type="tel" onChange={(value) => update('phone', value)} />
        <ReadOnlyField label="E-mail" value={profile.data.user.email} type="email" />
        <Field
          label="Дата рождения"
          value={form.birthdate ?? ''}
          type="date"
          onChange={(value) => update('birthdate', value)}
        />
      </div>
      <button
        className="prf__primary"
        type="button"
        disabled={profile.pending}
        onClick={() => void profile.actions.saveProfile(form)}
      >
        Сохранить изменения
      </button>
      <section className="prf__subsection">
        <div>
          <p className="prf__eyebrow">Безопасность</p>
          <h2>Новый пароль</h2>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void profile.actions.savePassword(password);
          }}
        >
          <Field
            label="Текущий пароль"
            value={password.currentPassword}
            type="password"
            onChange={(value) => updatePasswordField('currentPassword', value)}
          />
          <Field
            label="Новый пароль"
            value={password.newPassword}
            type="password"
            onChange={(value) => updatePasswordField('newPassword', value)}
          />
          <Field
            label="Повторите пароль"
            value={password.repeatPassword}
            type="password"
            onChange={(value) => updatePasswordField('repeatPassword', value)}
          />
          <SubmitButton
            status={profile.pending ? 'sending' : 'idle'}
            disabled={false}
            label="Изменить пароль"
            sendingLabel="Сохраняем…"
          />
        </form>
      </section>
    </>
  );
}

function Addresses({ profile }: { profile: ReturnType<typeof useProfileVariantA> }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProfileAddressValues>({ label: '', city: '', street: '', comment: '' });
  const update = (key: keyof ProfileAddressValues, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <SectionHeading
        title="Адреса"
        copy="Сохраняйте места, куда заказываете чаще всего."
        action={
          <button type="button" onClick={() => setShowForm((value) => !value)}>
            <FiPlus />
            Добавить
          </button>
        }
      />
      {showForm && (
        <form
          className="prf__subsection"
          onSubmit={(event) => {
            event.preventDefault();
            void profile.actions.addAddress(form).then((ok) => {
              if (ok) {
                setForm({ label: '', city: '', street: '', comment: '' });
                setShowForm(false);
              }
            });
          }}
        >
          <p className="prf__eyebrow">Новый адрес</p>
          <Field label="Название" value={form.label} onChange={(value) => update('label', value)} />
          <Field label="Город" value={form.city} onChange={(value) => update('city', value)} />
          <Field label="Улица и дом" value={form.street} onChange={(value) => update('street', value)} />
          <Field label="Комментарий" value={form.comment} onChange={(value) => update('comment', value)} />
          <div className="prf__actions">
            <button type="submit" disabled={profile.pending}>
              Сохранить адрес
            </button>
          </div>
        </form>
      )}
      <div className="prf__address-list">
        {profile.data.addresses.map((address) => (
          <article key={address.id}>
            <FiHome />
            <div>
              <h2>
                {address.label}
                {address.isDefault && <span>По умолчанию</span>}
              </h2>
              <p>
                {address.city}, {address.street}
              </p>
              <small>{address.comment || 'Адрес сохранён для доставки'}</small>
            </div>
            <div className="prf__actions">
              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => void profile.actions.setDefaultAddress(address.id)}
                  aria-label={`Сделать адрес ${address.label} основным`}
                >
                  Основной
                </button>
              )}
              <button
                type="button"
                aria-label={`Удалить ${address.label}`}
                onClick={() => void profile.actions.deleteAddress(address.id)}
              >
                <FiTrash2 />
              </button>
            </div>
          </article>
        ))}
      </div>
      {profile.data.addresses.length === 0 && <Empty icon={<FiMapPin />} text="Нет сохранённых адресов" />}
    </>
  );
}

function ReadOnlyField({ label, value, type }: { label: string; value: string; type?: string }) {
  return (
    <p className="chk-field chk-field--light">
      <label htmlFor="profile-email">{label}</label>
      <span className="chk-field__control">
        <input id="profile-email" type={type} value={value} readOnly aria-readonly="true" />
      </span>
    </p>
  );
}

function SectionHeading({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return (
    <header className="prf__section-head">
      <div>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </header>
  );
}

function Empty({ icon, text, link, href }: { icon: React.ReactNode; text: string; link?: string; href?: string }) {
  return (
    <div className="prf__empty">
      {icon}
      <p>{text}</p>
      {link && href && <a href={href}>{link}</a>}
    </div>
  );
}
