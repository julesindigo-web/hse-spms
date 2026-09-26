import type { Lang } from '../types';

export const STRINGS: Record<string, Record<Lang, string>> = {
  app_title: { 'id-ID': 'HSE Safety Patrol', 'zh-CN': 'HSE 安全巡检', 'en-US': 'HSE Safety Patrol' },
  company: { 'id-ID': 'PT Sifang Mining Indonesia', 'zh-CN': '四方矿业印尼公司', 'en-US': 'PT Sifang Mining Indonesia' },
  login: { 'id-ID': 'Masuk', 'zh-CN': '登录', 'en-US': 'Login' },
  logout: { 'id-ID': 'Keluar', 'zh-CN': '退出', 'en-US': 'Logout' },
  email: { 'id-ID': 'Email', 'zh-CN': '邮箱', 'en-US': 'Email' },
  password: { 'id-ID': 'Kata sandi', 'zh-CN': '密码', 'en-US': 'Password' },
  start_inspection: { 'id-ID': 'Mulai Inspeksi', 'zh-CN': '开始检查', 'en-US': 'Start Inspection' },
  findings: { 'id-ID': 'Temuan', 'zh-CN': '问题', 'en-US': 'Findings' },
  dashboard: { 'id-ID': 'Dasbor', 'zh-CN': '看板', 'en-US': 'Dashboard' },
  master_data: { 'id-ID': 'Data Master', 'zh-CN': '主数据', 'en-US': 'Master Data' },
  reports: { 'id-ID': 'Laporan', 'zh-CN': '报告', 'en-US': 'Reports' },
  admin: { 'id-ID': 'Admin', 'zh-CN': '管理', 'en-US': 'Admin' },
  radio_reminder: { 'id-ID': 'Sudah menghubungi supervisor via radio? Aplikasi adalah jalur SEKUNDER — radio/verbal langsung adalah jalur UTAMA untuk STOP WORK.', 'zh-CN': '已通过对讲机联系主管了吗？App 仅为次要通道。', 'en-US': 'Have you radioed the supervisor? App is SECONDARY — direct radio/verbal is PRIMARY for STOP WORK.' },
  submit: { 'id-ID': 'Kirim', 'zh-CN': '提交', 'en-US': 'Submit' },
  sync_pending: { 'id-ID': 'Menunggu sinkron', 'zh-CN': '待同步', 'en-US': 'Pending sync' },
  nav_home: { 'id-ID': 'Home', 'zh-CN': '首页', 'en-US': 'Home' },
  nav_inspect: { 'id-ID': 'Inspeksi', 'zh-CN': '检查', 'en-US': 'Inspection' },
  nav_activity: { 'id-ID': 'Harian', 'zh-CN': '日报', 'en-US': 'Daily' },
  nav_monitoring: { 'id-ID': 'Monitoring', 'zh-CN': '监控', 'en-US': 'Monitoring' },
  nav_master: { 'id-ID': 'Master', 'zh-CN': '主数据', 'en-US': 'Master' }
};

export function t(key: string, lang: Lang): string {
  const e = STRINGS[key];
  if (!e) return key;
  return e[lang] ?? e['id-ID'];
}
