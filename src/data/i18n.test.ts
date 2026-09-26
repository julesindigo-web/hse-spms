import { describe, it, expect } from 'vitest';
import { t, STRINGS } from './i18n';
import type { Lang } from '../types';

describe('t', () => {
  it('mengembalikan terjemahan per bahasa', () => {
    const langs: Lang[] = ['id-ID', 'zh-CN', 'en-US'];
    for (const l of langs) expect(t('login', l)).toBe(STRINGS.login[l]);
  });
  it('kunci tak dikenal kembali apa adanya', () => {
    expect(t('kunci-aneh', 'id-ID')).toBe('kunci-aneh');
  });
  it('fallback id-ID bila bahasa hilang', () => {
    expect(t('login', 'xx' as Lang)).toBe(STRINGS.login['id-ID']);
  });
});
