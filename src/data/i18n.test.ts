import { describe, it, expect } from 'vitest';
import { t, humanize, STRINGS } from './i18n';
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
  it('interpolasi {var} bila vars diberikan', () => {
    expect(t('login', 'id-ID', { x: 1 })).toBe('Masuk');
    expect(t('kunci-aneh', 'id-ID', { n: 3 })).toBe('kunci-aneh');
  });
});

describe('humanize', () => {
  it('pemisah menjadi Kapital Setiap Kata', () => {
    expect(humanize('TRAFFIC_MANAGEMENT')).toBe('Traffic Management');
    expect(humanize('user.manage')).toBe('User Manage');
    expect(humanize('PIT_STOP-A')).toBe('Pit Stop A');
    expect(humanize('CRITICAL')).toBe('Critical');
    expect(humanize('post_rain')).toBe('Post Rain');
  });
  it('akronim domain dipertahankan', () => {
    expect(humanize('HSE_ADMIN')).toBe('HSE Admin');
    expect(humanize('ASSIGN_PIC')).toBe('Assign PIC');
    expect(humanize('GPS_STATUS')).toBe('GPS Status');
    expect(humanize('TARP_RED')).toBe('TARP Red');
    expect(humanize('FINDING_NC')).toBe('Finding NC');
  });
  it('kode berangka dan kosong utuh', () => {
    expect(humanize('CC-005')).toBe('CC-005');
    expect(humanize('TM-003')).toBe('TM-003');
    expect(humanize('')).toBe('');
    expect(humanize('-LOADING-')).toBe('Loading');
  });
});
