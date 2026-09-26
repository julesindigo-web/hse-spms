import { describe, it, expect } from 'vitest';
import { CHECKLIST_MASTER, MODULES, MASTER_REVISION, MASTER_HASH } from './checklists';
import { CRITICAL_CONTROLS, TARP_RULES, PARAMETER_BASELINES, STOP_WORK_TRIGGERS, AREAS } from './master';

describe('checklist master', () => {
  it('total 316 item unik lintas 13 modul', () => {
    expect(CHECKLIST_MASTER.length).toBe(316);
    expect(MODULES.length).toBe(13);
    const ids = CHECKLIST_MASTER.map(c => c.id);
    expect(new Set(ids).size).toBe(316);
  });
  it('distribusi modul warisan + baru', () => {
    const count = (m: string) => CHECKLIST_MASTER.filter(c => c.module === m).length;
    expect(count('PIT_STOP_TEMP_WORKSHOP')).toBe(50);
    expect(count('LOADING_POINT')).toBe(25);
    expect(count('DISPOSAL_DUMPING')).toBe(25);
    expect(count('ETO')).toBe(20);
    expect(count('EFO')).toBe(20);
    expect(count('MINE_SLOPE')).toBe(35);
    expect(count('TRAFFIC_MANAGEMENT')).toBe(55);
    expect(count('PERSONNEL_PPE')).toBe(36);
    expect(count('BEHAVIORAL_SAFETY')).toBe(18);
    expect(count('WATER_MANAGEMENT')).toBe(10);
    expect(count('CONFINED_SPACE')).toBe(7);
    expect(count('BULK_FUEL_STORAGE')).toBe(10);
    expect(count('LIGHTNING_WEATHER')).toBe(5);
  });
  it('setiap item valid: label 3 bahasa, revisi, critical link konsisten', () => {
    for (const c of CHECKLIST_MASTER) {
      expect(c.label['id-ID'].length).toBeGreaterThan(0);
      expect(c.label['zh-CN'].length).toBeGreaterThan(0);
      expect(c.label['en-US'].length).toBeGreaterThan(0);
      expect(c.revision).toBe('v2.0');
      if (c.is_critical_linked) expect(c.critical_control_id).toBeTruthy();
      if (c.critical_control_id) expect(CRITICAL_CONTROLS.some(k => k.id === c.critical_control_id)).toBe(true);
    }
    expect(MASTER_REVISION).toBeTruthy();
    expect(MASTER_HASH).toBeTruthy();
  });
});

describe('master domain', () => {
  it('11 critical controls + 3 TARP + 6 baseline + 11 trigger + 13 area', () => {
    expect(CRITICAL_CONTROLS.length).toBe(11);
    expect(TARP_RULES.length).toBe(3);
    expect(PARAMETER_BASELINES.length).toBe(6);
    expect(STOP_WORK_TRIGGERS.length).toBe(11);
    expect(AREAS.length).toBe(13);
  });
  it('related_tarp_id merujuk TARP yang ada', () => {
    const ids = new Set(TARP_RULES.map(t => t.id));
    for (const c of CRITICAL_CONTROLS) {
      expect(c.name['id-ID'].length).toBeGreaterThan(0);
      if (c.related_tarp_id) expect(ids.has(c.related_tarp_id)).toBe(true);
      expect(c.automatic_stop_examples.length).toBeGreaterThan(0);
    }
  });
});
