import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon, BrandMark, type IconName } from './icons';

const NAMES: IconName[] = [
  'home', 'clipboard', 'calendar', 'alert', 'radar', 'database', 'report', 'gear',
  'camera', 'pin', 'check', 'shield', 'radio', 'printer', 'download', 'user',
  'users', 'key', 'link', 'lock', 'wrench', 'search', 'refresh', 'mark'
];

describe('Icon', () => {
  it('me-render seluruh 24 ikon + ukuran custom', () => {
    expect(NAMES.length).toBe(24);
    for (const name of NAMES) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelector('svg.ic')).not.toBeNull();
      unmount();
    }
    const { container } = render(<Icon name="check" size={30} className="x" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('30');
    expect(svg?.classList.contains('x')).toBe(true);
  });
});

describe('BrandMark', () => {
  it('default 34 dan custom', () => {
    const a = render(<BrandMark />);
    expect(a.container.querySelector('.brandmark')).not.toBeNull();
    a.unmount();
    const b = render(<BrandMark size={20} />);
    expect(b.container.querySelector('svg')?.getAttribute('width')).toBe('20');
  });
});
