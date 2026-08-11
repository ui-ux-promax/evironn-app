/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductMediaStage } from '@/components/shared/product/product-media-stage';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) =>
    React.createElement('img', props),
}));

const images = [{ url: '/assets/products/03-ivory-lounge-idle.webp', alt: 'Noma Woven Lounge' }];
const turntable = {
  videoUrl: '/assets/products/03-ivory-lounge-turntable.mp4',
  posterUrl: '/assets/products/03-ivory-lounge-turntable-alpha-poster.png',
  fallbackUrl: '/assets/products/03-ivory-lounge-cutout.png',
  alt: 'Noma Woven Lounge 360',
};

let reducedMotion = false;
let mediaQueryListeners: Array<(event: MediaQueryListEvent) => void> = [];

beforeEach(() => {
  reducedMotion = false;
  mediaQueryListeners = [];
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        mediaQueryListeners.push(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        mediaQueryListeners = mediaQueryListeners.filter((candidate) => candidate !== listener);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ProductMediaStage', () => {
  it('renders a static-first turntable that only plays after an explicit click', async () => {
    render(<ProductMediaStage images={images} turntable={turntable} />);

    const video = screen.getByTestId('turntable-video');
    expect(video).toHaveAttribute('src', turntable.videoUrl);
    expect(video).toHaveAttribute('poster', turntable.posterUrl);
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(screen.getByTestId('turntable-poster')).toBeVisible();
    expect(screen.getByTestId('turntable-fallback')).toBeVisible();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    const playButton = screen.getByRole('button', { name: 'Запустить обзор 360°' });
    fireEvent.click(playButton);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();

    fireEvent.play(video);
    expect(screen.getByRole('button', { name: 'Пауза обзора 360°' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Пауза обзора 360°' }));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
  });

  it('keeps reduced-motion media static until explicit opt-in and disables looping', async () => {
    reducedMotion = true;
    render(<ProductMediaStage images={images} turntable={turntable} />);

    const video = screen.getByTestId('turntable-video');
    await waitFor(() => expect(video).not.toHaveAttribute('loop'));
    expect(screen.getByTestId('turntable-poster')).toBeVisible();
    expect(screen.getByTestId('turntable-fallback')).toBeVisible();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Запустить обзор 360°' }));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it('announces a polite static fallback when the turntable video fails', () => {
    render(<ProductMediaStage images={images} turntable={turntable} />);

    fireEvent.error(screen.getByTestId('turntable-video'));

    expect(screen.queryByTestId('turntable-video')).toBeNull();
    expect(screen.getByTestId('turntable-fallback')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('360° недоступен, показано статичное изображение');
  });

  it('renders an image gallery without turntable controls', () => {
    const gallery = [...images, { url: '/assets/products/03-ivory-lounge-side.webp', alt: 'Noma Woven Lounge side' }];
    render(<ProductMediaStage images={gallery} turntable={null} />);

    expect(screen.queryByTestId('turntable-video')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Запустить обзор 360°' })).toBeNull();
    expect(screen.getByRole('img', { name: 'Noma Woven Lounge' })).toHaveAttribute('src', images[0].url);
    expect(screen.getByRole('button', { name: 'Фото 2' })).toBeVisible();
  });

  it('renders a neutral state when no media is available', () => {
    render(<ProductMediaStage images={[]} turntable={null} />);

    expect(screen.getByText('Изображение недоступно')).toBeVisible();
  });
});
