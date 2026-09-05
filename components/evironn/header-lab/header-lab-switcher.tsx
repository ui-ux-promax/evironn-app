'use client';

import Link from 'next/link';

export type HeaderVariantMeta = {
  id: string;
  title: string;
  pitch: string;
};

export const HEADER_VARIANTS: readonly HeaderVariantMeta[] = [
  { id: '1', title: 'Стеклянная капсула', pitch: 'Плавающая капсула + карточка-меню под ней' },
  { id: '2', title: 'Editorial', pitch: 'Текстовый переключатель + тёплая штора с фото комнат' },
  { id: '3', title: 'Нижний лист', pitch: 'Bottom sheet с фото-карточками комнат' },
  { id: '4', title: 'Тёмная кулиса', pitch: 'Чернильные кнопки + тёмное меню на весь экран' },
  { id: '5', title: 'Стеклянный рельс', pitch: 'Сегментированный рельс + якорная карточка' },
  { id: '6', title: 'Капсула + нижний лист', pitch: 'Шапка варианта 1 + меню варианта 3' },
];

export function HeaderLabSwitcher({ active }: { active: string }) {
  const current = HEADER_VARIANTS.find((variant) => variant.id === active) ?? HEADER_VARIANTS[0];

  return (
    <div className="hdr-lab-switcher">
      <p className="hdr-lab-switcher__meta">
        <strong>
          {current.id}. {current.title}
        </strong>
        <span>{current.pitch}</span>
      </p>
      <div className="hdr-lab-switcher__row" role="group" aria-label="Вариант шапки">
        {HEADER_VARIANTS.map((variant) => (
          <Link
            key={variant.id}
            href={`/header-lab?v=${variant.id}`}
            scroll={false}
            aria-current={variant.id === current.id ? 'true' : undefined}
            title={variant.title}
          >
            {variant.id}
          </Link>
        ))}
      </div>
    </div>
  );
}
