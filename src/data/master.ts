// Critical Controls 11 + TARP + Parameters + Areas (§11,§12,§13)
import type { CriticalControl, TarpRule, ParameterStandard, Area } from '../types';

export const CRITICAL_CONTROLS: CriticalControl[] = [
  { id: 'CC-001', name: { 'id-ID': 'Stabilitas Lereng', 'zh-CN': '边坡稳定', 'en-US': 'Slope Stability' }, related_tarp_id: 'TARP-GEO', automatic_stop_examples: [{ 'id-ID': 'Longsoran aktif / rekahan kritis melebar', 'zh-CN': '活动滑坡', 'en-US': 'Active ground failure' }] },
  { id: 'CC-002', name: { 'id-ID': 'Keamanan Tepi Timbunan (Dump Edge)', 'zh-CN': '排土场边缘安全', 'en-US': 'Dump Edge Safety' }, related_tarp_id: 'TARP-GEO', automatic_stop_examples: [{ 'id-ID': 'Dump edge tanpa berm / retak', 'zh-CN': '边缘无挡堤/开裂', 'en-US': 'Unsafe dump edge' }] },
  { id: 'CC-003', name: { 'id-ID': 'Interaksi Alat Berat', 'zh-CN': '重型设备交互', 'en-US': 'Heavy Equipment Interaction' }, automatic_stop_examples: [{ 'id-ID': 'Interaksi tak terkendali di loading point', 'zh-CN': '失控交互', 'en-US': 'Uncontrolled interaction' }] },
  { id: 'CC-004', name: { 'id-ID': 'Pengereman / Kendali Kendaraan', 'zh-CN': '车辆制动/控制', 'en-US': 'Vehicle Braking / Control' }, automatic_stop_examples: [{ 'id-ID': 'Rem/steering gagal', 'zh-CN': '制动/转向失效', 'en-US': 'Brake/steering failure' }] },
  { id: 'CC-005', name: { 'id-ID': 'Manajemen Lalu Lintas', 'zh-CN': '交通管理', 'en-US': 'Traffic Management' }, automatic_stop_examples: [{ 'id-ID': 'Traffic tak terkendali / rambu kritis hilang', 'zh-CN': '交通失控', 'en-US': 'Uncontrolled traffic' }] },
  { id: 'CC-006', name: { 'id-ID': 'LOTO / Isolasi Energi', 'zh-CN': '上锁挂牌/能量隔离', 'en-US': 'LOTO / Energy Isolation' }, automatic_stop_examples: [{ 'id-ID': 'Maintenance tanpa isolasi memadai', 'zh-CN': '无隔离维修', 'en-US': 'Maintenance without isolation' }] },
  { id: 'CC-007', name: { 'id-ID': 'Kebakaran / BBM', 'zh-CN': '火灾/燃油', 'en-US': 'Fire / Fuel' }, automatic_stop_examples: [{ 'id-ID': 'Kebakaran / tumpahan BBM mayor', 'zh-CN': '重大火灾/泄漏', 'en-US': 'Major fire/spill' }] },
  { id: 'CC-008', name: { 'id-ID': 'Pengelolaan Air / Integritas Kolam', 'zh-CN': '水管理/池体完整', 'en-US': 'Water Management / Pond Integrity' }, related_tarp_id: 'TARP-HYDRO', automatic_stop_examples: [{ 'id-ID': 'Tanggul jebol', 'zh-CN': '堤坝溃决', 'en-US': 'Embankment breach' }, { 'id-ID': 'Overflow tak terkendali', 'zh-CN': '失控溢流', 'en-US': 'Uncontrolled overflow' }, { 'id-ID': 'Pompa dewatering gagal total', 'zh-CN': '排水泵全部失效', 'en-US': 'Total dewatering failure' }] },
  { id: 'CC-009', name: { 'id-ID': 'Masuk Ruang Terbatas', 'zh-CN': '受限空间进入', 'en-US': 'Confined Space Entry' }, automatic_stop_examples: [{ 'id-ID': 'Atmosfer tidak aman', 'zh-CN': '大气不安全', 'en-US': 'Unsafe atmosphere' }, { 'id-ID': 'Attendant tidak ada', 'zh-CN': '无监护人', 'en-US': 'No attendant' }, { 'id-ID': 'Masuk tanpa permit', 'zh-CN': '无许可进入', 'en-US': 'Entry without permit' }] },
  { id: 'CC-010', name: { 'id-ID': 'Integritas Tangki BBM', 'zh-CN': '油罐完整性', 'en-US': 'Fuel/Tank Integrity' }, automatic_stop_examples: [{ 'id-ID': 'Kebocoran tangki aktif', 'zh-CN': '储罐活动泄漏', 'en-US': 'Active tank leak' }, { 'id-ID': 'Overfill', 'zh-CN': '溢油', 'en-US': 'Overfill' }, { 'id-ID': 'Bunding gagal', 'zh-CN': '围堰失效', 'en-US': 'Bunding failure' }] },
  { id: 'CC-011', name: { 'id-ID': 'Petir / Cuaca Ekstrem', 'zh-CN': '雷电/极端天气', 'en-US': 'Lightning / Extreme Weather' }, related_tarp_id: 'TARP-WEATHER', automatic_stop_examples: [{ 'id-ID': 'Petir dalam radius trigger site', 'zh-CN': '触发半径内雷电', 'en-US': 'Lightning within site trigger radius' }, { 'id-ID': 'Aktivitas alat logam terbuka berlanjut', 'zh-CN': '露天金属作业继续', 'en-US': 'Open metal activity continues' }] }
];

export const TARP_RULES: TarpRule[] = [
  { id: 'TARP-GEO', name: { 'id-ID': 'TARP Geoteknik Lereng', 'zh-CN': '岩土 TARP', 'en-US': 'Geotech TARP' }, green: 'Normal — displacement < ambang Waspada site', yellow: 'Watch — displacement mendekati ambang', orange: 'Restrict — batasi aktivitas/personel', red: 'Stop — hentikan aktivitas di zona', source: 'Kajian geoteknik site (wajib, bukan angka generik)' },
  { id: 'TARP-HYDRO', name: { 'id-ID': 'TARP Hidrologi / Kolam', 'zh-CN': '水文 TARP', 'en-US': 'Hydro TARP' }, green: 'Normal', yellow: 'Watch — curah hujan/sump naik', orange: 'Restrict — siaga pompa + batasi', red: 'Stop — overflow/jebol', source: 'Kajian hidrologi site' },
  { id: 'TARP-WEATHER', name: { 'id-ID': 'TARP Petir / Cuaca', 'zh-CN': '雷电 TARP', 'en-US': 'Weather TARP' }, green: 'Normal', yellow: 'Watch — awan gelap/petir jauh', orange: 'Restrict — siapkan shelter', red: 'Stop — petir dalam radius trigger', source: 'SOP Cuaca Ekstrem site' }
];

export const PARAMETER_BASELINES: ParameterStandard[] = [
  { id: 'P-JALAN-2A', name: 'Jalan 2 arah', baseline: '≥ 3,5 × lebar kendaraan terbesar', source: 'Kepmen 1827 / Kepdirjen 185', revision: 'v2.0' },
  { id: 'P-JALAN-1A', name: 'Jalan 1 arah', baseline: '≥ 2 × lebar kendaraan terbesar', source: 'Kepmen 1827 / Kepdirjen 185', revision: 'v2.0' },
  { id: 'P-BERM', name: 'Safety berm jalan', baseline: '≥ 0,75 × diameter roda terbesar', source: 'Kepmen 1827 / Kepdirjen 185', revision: 'v2.0' },
  { id: 'P-CROSSFALL', name: 'Cross fall', baseline: '≥ 2%', source: 'Kepmen 1827 / Kepdirjen 185', revision: 'v2.0' },
  { id: 'P-GRADE', name: 'Grade', baseline: '≤ 12% kecuali site lebih ketat', source: 'Kepmen 1827 / Kepdirjen 185', revision: 'v2.0' },
  { id: 'P-GUARD', name: 'Floor opening guard (workshop)', baseline: '≥ 90 cm', source: 'Kepmen 1827 / Kepdirjen 185', revision: 'v2.0' }
];

export const STOP_WORK_TRIGGERS = [
  'Slope instability kritis / ground failure aktif',
  'Kegagalan rem/steering kendaraan',
  'Interaksi alat berat tak terkendali',
  'Personel dalam line of fire kritis',
  'Dump edge tidak aman',
  'Kebakaran/tumpahan BBM mayor',
  'Maintenance tanpa isolasi energi yang memadai',
  'Operator tanpa otorisasi pada alat kritis',
  'Tanggul kolam pengendapan jebol / overflow tak terkendali',
  'Confined space entry tanpa permit/atmosfer tidak aman',
  'Petir dalam radius trigger site pada area terbuka/alat logam'
];

export const AREAS: Area[] = [
  { id: 'PIT_STOP', name: { 'id-ID': 'Pit Stop / Workshop Sementara', 'zh-CN': '临时维修区', 'en-US': 'Pit Stop / Temp Workshop' }, sub_areas: [{ id: 'PIT_STOP-A', area_id: 'PIT_STOP', name: { 'id-ID': 'Bengkel A', 'zh-CN': '维修A', 'en-US': 'Workshop A' } }] },
  { id: 'LOADING', name: { 'id-ID': 'Mine Area — Loading Point', 'zh-CN': '装载点', 'en-US': 'Loading Point' }, sub_areas: [] },
  { id: 'DISPOSAL', name: { 'id-ID': 'Disposal / Dumping Point', 'zh-CN': '排土场', 'en-US': 'Disposal/Dumping' }, sub_areas: [] },
  { id: 'ETO', name: { 'id-ID': 'ETO', 'zh-CN': 'ETO', 'en-US': 'ETO' }, sub_areas: [] },
  { id: 'EFO', name: { 'id-ID': 'EFO', 'zh-CN': 'EFO', 'en-US': 'EFO' }, sub_areas: [] },
  { id: 'SLOPE', name: { 'id-ID': 'Lereng Tambang', 'zh-CN': '边坡', 'en-US': 'Mine Slope' }, sub_areas: [] },
  { id: 'HAUL_ROAD', name: { 'id-ID': 'Haul Road / Traffic', 'zh-CN': '运输道路', 'en-US': 'Haul Road / Traffic' }, sub_areas: [] },
  { id: 'PPE', name: { 'id-ID': 'Personel / APD', 'zh-CN': '人员/PPE', 'en-US': 'Personnel / PPE' }, sub_areas: [] },
  { id: 'BEHAVIOR', name: { 'id-ID': 'Behavioral Safety', 'zh-CN': '行为安全', 'en-US': 'Behavioral Safety' }, sub_areas: [] },
  { id: 'WATER', name: { 'id-ID': 'Water Management / Settling Pond', 'zh-CN': '水管理', 'en-US': 'Water Management' }, sub_areas: [] },
  { id: 'CONFINED', name: { 'id-ID': 'Confined Space', 'zh-CN': '受限空间', 'en-US': 'Confined Space' }, sub_areas: [] },
  { id: 'FUEL', name: { 'id-ID': 'Bulk Fuel Storage', 'zh-CN': '集中储油', 'en-US': 'Bulk Fuel Storage' }, sub_areas: [] },
  { id: 'WEATHER', name: { 'id-ID': 'Petir & Cuaca Ekstrem', 'zh-CN': '雷电天气', 'en-US': 'Lightning & Weather' }, sub_areas: [] }
];
