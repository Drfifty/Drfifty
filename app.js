(() => {
  "use strict";

  const $app = document.getElementById("app");
  const $toast = document.getElementById("toast-region");
  const STORAGE = {
    requests: "rifd-demo-requests-v1",
    overrides: "rifd-demo-overrides-v1",
    role: "rifd-demo-role-v1",
    notices: "rifd-demo-notices-v1",
    queue: "rifd-demo-queue-v1",
    decisions: "rifd-demo-decisions-v1",
    agenda: "rifd-demo-agenda-v1",
    documents: "rifd-demo-documents-v1",
    availability: "rifd-demo-availability-v1",
    staff: "rifd-demo-staff-v1",
    staffRequests: "rifd-demo-staff-requests-v1",
    plannerTasks: "rifd-demo-planner-tasks-v1",
    weekPlan: "rifd-demo-week-plan-v1",
    plannerPrefs: "rifd-demo-planner-prefs-v1",
    prefs: "rifd-demo-prefs-v1",
  };

  const ROLES = {
    director: { label: "مدير المستشفى", person: "د. أحمد سالم", initials: "أح", short: "المدير" },
    "deputy-med": { label: "النائب الأول · الشؤون الطبية", person: "د. ليلى منصور", initials: "لم", short: "النائب الأول" },
    "deputy-admin": { label: "النائب الثاني · إدارية ومالية", person: "أ. كريم فؤاد", initials: "كف", short: "النائب الثاني" },
    doctor: { label: "الطبيب المصرح · التوقيعات", person: "د. مريم عادل", initials: "مع", short: "الطبيب المصرح" },
    secretary: { label: "السكرتير التنفيذي", person: "أ. ندى محمود", initials: "نم", short: "السكرتير" },
    department: { label: "رئيس قسم", person: "د. ليلى منصور", initials: "لم", short: "رئيس قسم" },
    employee: { label: "موظف", person: "أ. محمد علي", initials: "مح", short: "موظف" },
    waiting: { label: "شاشة صالة الانتظار", person: "شاشة العرض", initials: "ر", short: "العرض" },
  };

  const ROLE_IDS = ["director", "deputy-med", "deputy-admin", "doctor", "secretary", "department", "employee", "waiting"];
  const LEADER_IDS = ["director", "deputy-med", "deputy-admin"];
  const PRESENCE_ROLE_IDS = [...LEADER_IDS, "doctor"];
  const CURRENT_STAFF_BY_ROLE = { secretary: "EMP-006", department: "EMP-005", employee: "EMP-001" };
  const QUADRANTS = [
    { id: "q1", label: "هام وعاجل", action: "افعل الآن", hint: "تدخل فوري وأولوية قصوى", className: "q1", mark: "١", pill: "pill-red" },
    { id: "q2", label: "هام وغير عاجل", action: "خطّط وجدول", hint: "عمل استراتيجي مجدول", className: "q2", mark: "٢", pill: "pill-green" },
    { id: "q3", label: "غير هام وعاجل", action: "فوّض", hint: "إحالة للجهة المختصة", className: "q3", mark: "٣", pill: "pill-amber" },
    { id: "q4", label: "غير هام وغير عاجل", action: "فلتر", hint: "مراجعة أو دمج أو استبعاد", className: "q4", mark: "٤", pill: "pill-gray" },
  ];

  const SEED_REQUESTS = [
    { id: "RF-184", title: "تعطل جهاز أكسجين احتياطي في العناية المركزة", department: "العناية المركزة", requester: "د. ليلى منصور", time: "١٠:١٤ ص", date: "اليوم", quadrant: "q1", status: "جديد", assignee: "director", confidential: false, body: "تم رصد عطل في جهاز الأكسجين الاحتياطي. توجد وحدة بديلة واحدة متاحة، ونحتاج إلى تنسيق الصيانة العاجلة لضمان استمرارية الخدمة.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 12 },
    { id: "RF-183", title: "إشعار بزيارة تفتيش مفاجئة من الوزارة", department: "مكتب الجودة", requester: "أ. سارة حسن", time: "٩:٥٢ ص", date: "اليوم", quadrant: "q1", status: "قيد المعالجة", assignee: "director", confidential: false, body: "ورد إشعار هاتفي بوصول فريق التفتيش خلال الفترة الصباحية. الملفات الأساسية جاهزة ويجري استكمال التنسيق مع الأقسام.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 34 },
    { id: "RF-182", title: "انقطاع التيار في وحدة العمليات الثانية", department: "العمليات", requester: "د. سامح نجيب", time: "٩:٣٠ ص", date: "اليوم", quadrant: "q1", status: "قيد المعالجة", assignee: "director", confidential: true, body: "بلاغ عاجل بشأن انقطاع التيار في وحدة العمليات الثانية. توجد تفاصيل سرية مرتبطة بسلامة حالة داخل الوحدة؛ يرجى مناقشتها حضورياً.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 57 },
    { id: "RF-181", title: "اعتماد ميزانية تحديث أجهزة المراقبة", department: "الإدارة المالية", requester: "أ. حازم مصطفى", time: "٩:١٥ ص", date: "اليوم", quadrant: "q2", status: "بانتظار القرار", assignee: "deputy-admin", confidential: false, body: "مقترح اعتماد ميزانية مرحلية لتحديث أجهزة المراقبة في ثلاثة أقسام. مرفق بالمذكرة جدول التكاليف والأولوية التشغيلية.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 72 },
    { id: "RF-180", title: "خطة تحسين مسار التحويلات بين الأقسام", department: "الشؤون الطبية", requester: "د. مازن رياض", time: "٨:٥٨ ص", date: "اليوم", quadrant: "q2", status: "قيد المعالجة", assignee: "deputy-med", confidential: false, body: "خطة أولية لتقليل زمن التحويلات بين الأقسام الطبية، تتضمن مؤشرات أداء ومقترح تجربة لمدة شهر.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 91 },
    { id: "RF-179", title: "تقييم الاحتياج التدريبي للتمريض", department: "التمريض", requester: "أ. منى سمير", time: "٨:٤٠ ص", date: "اليوم", quadrant: "q2", status: "جديد", assignee: "deputy-med", confidential: false, body: "يرجى مراجعة الاحتياج التدريبي للتمريض للربع القادم وجدولة البرامج المقترحة بالتنسيق مع التعليم المستمر.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 110 },
    { id: "RF-178", title: "صيانة دورية لوحدة التكييف في المبنى الشرقي", department: "الخدمات الهندسية", requester: "م. عمرو لطفي", time: "٨:٢٥ ص", date: "اليوم", quadrant: "q3", status: "مُحال للنائب", assignee: "deputy-admin", confidential: false, body: "وحدة التكييف تعمل بكفاءة منخفضة. لا يوجد تأثير مباشر على الخدمة حالياً، ونقترح إدراجها في جدول الصيانة هذا الأسبوع.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 125 },
    { id: "RF-177", title: "اعتماد إجازة سنوية لموظف بالقسم", department: "الموارد البشرية", requester: "أ. فادي نبيل", time: "٨:٠٣ ص", date: "اليوم", quadrant: "q3", status: "مُحال للنائب", assignee: "deputy-admin", confidential: false, body: "طلب اعتماد إجازة سنوية روتينية بعد استكمال موافقة رئيس القسم وتغطية جدول العمل.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 147 },
    { id: "RF-176", title: "توقيع شهادة طبية روتينية", department: "العيادات الخارجية", requester: "أ. مها عادل", time: "٧:٤٥ ص", date: "اليوم", quadrant: "q3", status: "بانتظار التوقيع", assignee: "doctor", confidential: false, body: "شهادة طبية روتينية مكتملة البيانات وتنتظر مراجعة الطبيب المصرح والتوقيع.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 163 },
    { id: "RF-175", title: "طلب مكرر بخصوص مستلزمات مكتبية", department: "شؤون العاملين", requester: "أ. وائل جابر", time: "أمس", date: "أمس", quadrant: "q4", status: "مراجعة", assignee: "secretary", confidential: false, body: "يبدو أن هذا الطلب مكرر مع معاملة RF-170. يرجى الدمج قبل الإحالة.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 60 * 25 },
    { id: "RF-174", title: "طلب غير مستوفٍ للبيانات الأساسية", department: "المخازن", requester: "أ. خالد رجب", time: "أمس", date: "أمس", quadrant: "q4", status: "بانتظار الاستكمال", assignee: "secretary", confidential: false, body: "ينقص المعاملة تحديد الكمية ومبرر الاحتياج. تُعاد لمقدم الطلب للاستكمال قبل أي توجيه.", authorRole: "department", createdAt: Date.now() - 1000 * 60 * 60 * 27 },
  ];

  const SEED_NOTICES = [
    { id: "N-1", type: "broadcast", title: "تذكير: ارفع طلبك عبر النظام أولاً", message: "لتسريع المتابعة، يرجى تسجيل الطلبات التشغيلية في التطبيق قبل التوجه إلى المكتب. للحالات الحرجة استخدم قناة الطوارئ المعتمدة.", target: "all", department: "", time: "٩:٠٠ ص", createdAt: Date.now() - 1000 * 60 * 80 },
    { id: "N-2", type: "notice", title: "اجتماع لجنة التشغيل", message: "تبدأ جلسة لجنة التشغيل في قاعة الاجتماعات الساعة ١٢:٣٠ ظهراً.", target: "all", department: "", time: "٨:٣٥ ص", createdAt: Date.now() - 1000 * 60 * 105 },
  ];
  const SEED_QUEUE = [
    { number: "و-١٢", name: "أ. محمد علي", department: "الصيانة", time: "١٠:٢٥ ص", priority: true },
    { number: "و-١٣", name: "د. هبة عادل", department: "الشؤون الطبية", time: "١٠:٤٠ ص", priority: false },
    { number: "و-١٤", name: "أ. سامي ناصر", department: "الموارد البشرية", time: "١١:٠٠ ص", priority: false },
  ];
  const SEED_DECISIONS = [
    { id: "ق-٢٤١", title: "توحيد نموذج طلبات الصيانة الدورية", summary: "اعتماد نموذج موحد وتحديد مستوى الاستجابة بحسب تأثير العطل على الخدمة.", category: "تشغيل", date: "٢ أكتوبر ٢٠٢٦", owner: "مدير المستشفى" },
    { id: "ق-٢٤٠", title: "تنظيم تغطية المناوبات خلال عطلة نهاية الأسبوع", summary: "تُرفع جداول التغطية قبل موعدها بأسبوع وتراجعها الشؤون الطبية.", category: "شؤون طبية", date: "١ أكتوبر ٢٠٢٦", owner: "النائب الأول" },
    { id: "ق-٢٣٩", title: "إجراءات اعتماد التوريدات المكتبية", summary: "تُجمع الاحتياجات في طلب شهري واحد لتقليل المعاملات المتكررة.", category: "إدارية ومالية", date: "٢٩ سبتمبر ٢٠٢٦", owner: "النائب الثاني" },
  ];
  const SEED_AGENDA = [
    { time: "١١:٠٠ ص", title: "مراجعة خطة تحسين العمليات", detail: "مع النائب الأول · قاعة الاجتماعات", focus: false },
    { time: "١٢:٣٠ م", title: "لجنة التشغيل الأسبوعية", detail: "قاعة الاجتماعات الرئيسية", focus: false },
    { time: "٠١:٣٠ م", title: "وقت تركيز محمي", detail: "مراجعة ملفات الميزانية والتطوير", focus: true },
  ];
  const SEED_DOCUMENTS = [
    { id: "DOC-04", name: "تعميم تحديث جداول المناوبات.pdf", department: "الشؤون الطبية", status: "بانتظار التوقيع" },
    { id: "DOC-03", name: "محضر لجنة التشغيل.pdf", department: "مكتب المدير", status: "موقّع تجريبياً" },
  ];
  const SEED_STAFF = [
    { id: "EMP-001", name: "أ. محمد علي", position: "فني صيانة", department: "الخدمات الهندسية", initials: "مح" },
    { id: "EMP-002", name: "أ. منى سمير", position: "مشرفة تمريض", department: "التمريض", initials: "مس" },
    { id: "EMP-003", name: "أ. سارة حسن", position: "مسؤولة الجودة", department: "مكتب الجودة", initials: "سه" },
    { id: "EMP-004", name: "أ. وائل جابر", position: "أخصائي موارد بشرية", department: "الموارد البشرية", initials: "وج" },
    { id: "EMP-005", name: "د. ليلى منصور", position: "رئيس قسم", department: "العناية المركزة", initials: "لم" },
    { id: "EMP-006", name: "أ. ندى محمود", position: "السكرتير التنفيذي", department: "مكتب المدير", initials: "نم" },
  ];
  const SEED_AVAILABILITY = {
    director: { status: "available", place: "مكتب المدير", returnAt: null, note: "متاح للمتابعة" },
    "deputy-med": { status: "away", place: "جولة في قسم العمليات", returnAt: new Date(Date.now() + 35 * 60000).toISOString(), note: "متاح عبر التطبيق" },
    "deputy-admin": { status: "available", place: "مكتب الشؤون الإدارية", returnAt: null, note: "" },
    doctor: { status: "offsite", place: "العيادات الخارجية", returnAt: new Date(Date.now() + 55 * 60000).toISOString(), note: "" },
    "EMP-001": { status: "available", place: "ورشة الصيانة", returnAt: null, note: "" },
    "EMP-002": { status: "away", place: "المخزن الرئيسي", returnAt: new Date(Date.now() + 25 * 60000).toISOString(), note: "" },
    "EMP-003": { status: "offsite", place: "مبنى العيادات", returnAt: new Date(Date.now() + 70 * 60000).toISOString(), note: "" },
    "EMP-004": { status: "remote", place: "عن بُعد · خارج المستشفى", returnAt: new Date(Date.now() + 3 * 60 * 60000).toISOString(), note: "متاح عبر التطبيق" },
    "EMP-005": { status: "available", place: "العناية المركزة", returnAt: null, note: "" },
    "EMP-006": { status: "available", place: "مكتب السكرتارية", returnAt: null, note: "" },
  };

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const pref = read(STORAGE.prefs, {});
  const state = {
    role: ROLE_IDS.includes(read(STORAGE.role, "director")) ? read(STORAGE.role, "director") : "director",
    view: "dashboard",
    modal: null,
    menuOpen: false,
    requestSearch: "",
    requestFilter: "all",
    decisionSearch: "",
    overrides: read(STORAGE.overrides, []),
    requests: read(STORAGE.requests, null) || clone(SEED_REQUESTS),
    notices: read(STORAGE.notices, null) || clone(SEED_NOTICES),
    queue: read(STORAGE.queue, null) || clone(SEED_QUEUE),
    currentTicket: read("rifd-demo-current-ticket-v1", "و-١١"),
    decisions: read(STORAGE.decisions, null) || clone(SEED_DECISIONS),
    agenda: read(STORAGE.agenda, null) || clone(SEED_AGENDA),
    documents: read(STORAGE.documents, null) || clone(SEED_DOCUMENTS),
    availability: read(STORAGE.availability, null) || clone(SEED_AVAILABILITY),
    staff: read(STORAGE.staff, null) || clone(SEED_STAFF),
    staffRequests: read(STORAGE.staffRequests, []),
    plannerTasks: read(STORAGE.plannerTasks, []),
    weekPlan: read(STORAGE.weekPlan, null),
    plannerPrefs: read(STORAGE.plannerPrefs, null) || { workdayHours: 6, bufferUnits: 2, startTime: "09:00" },
    busyUntil: read("rifd-demo-busy-until-v1", null),
    busyReason: read("rifd-demo-busy-reason-v1", ""),
    soundAlerts: !!pref.soundAlerts,
    department: pref.department || "العناية المركزة",
    staffId: pref.staffId || "EMP-001",
    savedRole: null,
  };
  if (!state.staff.some((person) => person.id === state.staffId)) state.staffId = state.staff[0]?.id || "EMP-001";
  if (state.role === "department") state.view = "employee";
  if (state.role === "employee") state.view = "my-presence";
  if (state.role === "waiting") state.view = "waiting";

  const ICONS = {
    brand: '<path d="M12 3v18M3 12h18" stroke-width="2.5" stroke-linecap="round"/>',
    dashboard: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="11" width="7" height="10" rx="2"/><rect x="3" y="14" width="8" height="7" rx="2"/>',
    grid: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    inbox: '<path d="M4 4h16v16H4z"/><path d="M4 13h4l2 3h4l2-3h4"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    archive: '<path d="M4 4h16v4H4zM6 8v12h12V8M10 12h4"/>',
    report: '<path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 13h8M8 17h8"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
    spark: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3ZM19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14ZM5 2l1.1 2.9L9 6 6.1 7.1 5 10 3.9 7.1 1 6l2.9-1.1L5 2Z"/>',
    arrow: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="m18 6-12 12M6 6l12 12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3.1a2 2 0 0 1-.6 1.7L7.1 10.4a16 16 0 0 0 6 6l1.9-1.9a2 2 0 0 1 1.7-.6l3.1.5a2 2 0 0 1 2.2 2.5z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    bellRing: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M2 8a10 10 0 0 1 2-5M22 8a10 10 0 0 0-2-5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    sound: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    laptop: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M2 21h20M8 17l-1 4M16 17l1 4"/>',
  };
  const icon = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.file}</svg>`;
  const esc = (value = "") => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const qInfo = (id) => QUADRANTS.find((q) => q.id === id) || QUADRANTS[1];
  const roleName = (id) => ROLES[id]?.label || "غير محدد";
  const roleShort = (id) => ROLES[id]?.short || "غير محدد";
  const statusClass = (status) => {
    if (["جديد", "عاجل"].includes(status)) return "status-new";
    if (["قيد المعالجة", "مُحال للنائب", "موعد مقابلة"].includes(status)) return "status-progress";
    if (["بانتظار القرار", "بانتظار التوقيع", "بانتظار الاستكمال", "بانتظار القسم"].includes(status)) return "status-waiting";
    return "status-done";
  };
  const timeNow = () => new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  const dateLong = () => new Intl.DateTimeFormat("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date());
  const toArabicNumber = (value) => new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value);
  const nowTimeStamp = () => new Date().toISOString();
  const localDateTimeValue = (offsetMinutes = 60) => {
    const d = new Date(Date.now() + offsetMinutes * 60000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const formatDateTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(d);
  };
  const normalizeArabic = (value) => String(value || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const keywords = (value) => {
    const stop = new Set(["الذي", "التي", "على", "الى", "في", "من", "عن", "هذا", "هذه", "طلب", "يرجى", "نرجو", "بشأن", "قسم", "قسمنا", "اليوم", "مطلوب", "مراجعه", "اعتماد", "الرجاء", "مع", "لدى", "بعد", "قبل", "لـ", "تم", "يوجد", "وجود", "بسبب"]);
    return [...new Set(normalizeArabic(value).split(" ").filter((word) => word.length >= 4 && !stop.has(word)))].slice(0, 9);
  };
  const visibleRequests = () => {
    if (state.role === "director" || state.role === "secretary") return state.requests;
    if (state.role === "department") return state.requests.filter((r) => r.authorRole === "department" && r.department === state.department);
    return state.requests.filter((r) => r.assignee === state.role);
  };
  const save = () => {
    try {
      localStorage.setItem(STORAGE.requests, JSON.stringify(state.requests));
      localStorage.setItem(STORAGE.overrides, JSON.stringify(state.overrides));
      localStorage.setItem(STORAGE.role, JSON.stringify(state.role));
      localStorage.setItem(STORAGE.notices, JSON.stringify(state.notices));
      localStorage.setItem(STORAGE.queue, JSON.stringify(state.queue));
      localStorage.setItem("rifd-demo-current-ticket-v1", JSON.stringify(state.currentTicket));
      localStorage.setItem(STORAGE.decisions, JSON.stringify(state.decisions));
      localStorage.setItem(STORAGE.agenda, JSON.stringify(state.agenda));
      localStorage.setItem(STORAGE.documents, JSON.stringify(state.documents));
      localStorage.setItem(STORAGE.availability, JSON.stringify(state.availability));
      localStorage.setItem(STORAGE.staff, JSON.stringify(state.staff));
      localStorage.setItem(STORAGE.staffRequests, JSON.stringify(state.staffRequests));
      localStorage.setItem(STORAGE.plannerTasks, JSON.stringify(state.plannerTasks));
      localStorage.setItem(STORAGE.weekPlan, JSON.stringify(state.weekPlan));
      localStorage.setItem(STORAGE.plannerPrefs, JSON.stringify(state.plannerPrefs));
      localStorage.setItem("rifd-demo-busy-until-v1", JSON.stringify(state.busyUntil));
      localStorage.setItem("rifd-demo-busy-reason-v1", JSON.stringify(state.busyReason));
      localStorage.setItem(STORAGE.prefs, JSON.stringify({ soundAlerts: state.soundAlerts, department: state.department, staffId: state.staffId }));
    } catch (_) { showToast("تعذر حفظ البيانات محلياً. تحقق من مساحة التخزين في المتصفح.", true); }
  };

  function showToast(message, error = false) {
    const el = document.createElement("div");
    el.className = `toast${error ? " error" : ""}`;
    el.textContent = message;
    $toast.appendChild(el);
    window.setTimeout(() => el.remove(), 3700);
  }

  function playUrgentTone() {
    if (!state.soundAlerts) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      [0, 0.2].forEach((delay, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = index ? 920 : 760;
        gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + delay + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.13);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + 0.14);
      });
      window.setTimeout(() => context.close(), 700);
    } catch (_) { /* صوت اختياري فقط */ }
  }

  function classifyRequest(data) {
    const allText = `${data.title || ""} ${data.details || ""}`;
    const keys = keywords(allText);
    const normalized = normalizeArabic(allText);
    const overrides = [...state.overrides].reverse();
    for (const item of overrides) {
      if (item.department !== data.department) continue;
      const previousKeys = Array.isArray(item.keywords) ? item.keywords : [];
      const overlap = keys.filter((word) => previousKeys.includes(word)).length;
      if (overlap > 0) return { quadrant: item.to, learned: true };
    }

    const urgent = data.urgency === "urgent" || /(وفاه|وفاة|اكسجين|حريق|انقطاع تيار|انقطاع الكهرباء|كهرباء|اشتباه اعلامي|تصعيد اعلامي|تفتيش مفاجئ|توقف نظام|خطر علي|خطر على)/.test(normalized);
    const unimportant = data.importance === "low" || /(اجازه روتينيه|اجازة روتينية|اجازات|اجازة|ورقيات|طلب مكرر|مكرر|غير مستوف|غير مكتمل|استثناء مخالف)/.test(normalized);
    const important = data.importance === "high" || /(ميزانيه|ميزانية|تطوير|خطه|خطة|تقييم|مؤشرات|اداء|أداء|خطة|استراتيجي|سلامه المرضي|سلامة المرضى)/.test(normalized);
    const signature = /(توقيع|توقيعات|شهاده طبيه|شهادة طبية|روشته|روشتة|تقرير طبي روتيني)/.test(normalized);
    const routineUrgent = /(صيانه|صيانة|اجازه|إجازة|توريد|مستلزمات|توقيع|مستندات)/.test(normalized);

    if (urgent) return { quadrant: unimportant ? "q3" : "q1", learned: false };
    if (unimportant && !important) return { quadrant: routineUrgent ? "q3" : "q4", learned: false };
    if (routineUrgent && !important) return { quadrant: "q3", learned: false };
    if (signature) return { quadrant: "q3", learned: false };
    if (important || data.importance === "high") return { quadrant: "q2", learned: false };
    return { quadrant: "q2", learned: false };
  }

  function suggestedAssignee(data, quadrant) {
    const text = normalizeArabic(`${data.title || ""} ${data.details || ""} ${data.department || ""}`);
    if (quadrant === "q1") return "director";
    if (/(توقيع|شهاده طبيه|شهادة طبية|روشته|روشتة)/.test(text)) return "doctor";
    if (/(طبيب|اطباء|أطباء|شيفت|مناوبه|مناوبة|تمريض|عمليات|تحويلات|مرضى|مرضى|رعايه|رعاية)/.test(text)) return "deputy-med";
    if (/(صيانه|صيانة|مباني|مبان|اجازه|إجازة|توريد|مستلزمات|مالي|ميزانيه|ميزانية|المخازن|هندسيه|هندسية)/.test(text)) return "deputy-admin";
    if (quadrant === "q3") return "deputy-admin";
    return "director";
  }

  function pushNotice(notice) {
    state.notices.unshift({ id: `N-${Date.now()}`, time: timeNow(), createdAt: Date.now(), ...notice });
    save();
  }

  function setView(view) {
    if (state.role === "employee" && !["my-presence", "staff-inbox"].includes(view)) view = "my-presence";
    if (state.role === "department" && !["employee", "my-requests", "my-presence", "staff-inbox"].includes(view)) view = "my-presence";
    state.view = view;
    state.menuOpen = false;
    state.modal = null;
    render();
  }

  const VIEW_INFO = {
    dashboard: ["لوحة المتابعة", "صورة تنفيذية سريعة لما يحتاج انتباهك اليوم."],
    matrix: ["مصفوفة الأولويات", "فرز واضح للطلبات بحسب الأهمية والاستعجال."],
    requests: ["سجل الطلبات", "متابعة الطلبات والتوجيهات والحالات من مكان واحد."],
    communications: ["التواصل والاستدعاء", "إدارة حالة الانشغال والنداءات والتعاميم المحلية."],
    secretary: ["إدارة المكتب", "طابور الزيارة، الأجندة، وأوراق التوقيع."],
    decisions: ["سجل القرارات", "أرشيف قابل للبحث للقرارات والتوجيهات السابقة."],
    daily: ["الموجز اليومي", "ملخص ما أُنجز وما يحتاج متابعة قبل نهاية اليوم."],
    planner: ["خطة الوقت", "قسّم يوم العمل إلى وحدات واضحة واترك مساحة للطوارئ."],
    presence: ["تواجد الموظفين", "اعرف من هو موجود قبل مغادرة مكتبك، واطلب المعلومة من داخل التطبيق."],
    "my-presence": ["تواجدي والطلبات الواردة", "حدّث مكان عملك المتوقع ومدة غيابك واستقبل طلبات الإدارة."],
    "staff-inbox": ["طلبات الإدارة لي", "تابع طلبات المعلومات والمستندات الواردة إليك."],
    employee: ["إرسال طلب", "ارفع احتياج قسمك وتابع رقم المعاملة."],
    "my-requests": ["طلباتي والردود", "حالة الطلبات والتنبيهات التي تخص قسمك."],
  };

  function navigationFor(role) {
    if (role === "department") return [
      { id: "employee", label: "إرسال طلب للقسم", icon: "send" },
      { id: "my-requests", label: "طلباتي والردود", icon: "inbox", count: state.requests.filter((r) => r.authorRole === "department" && r.department === state.department && ["جديد", "قيد المعالجة", "موعد مقابلة"].includes(r.status)).length || null },
      { id: "my-presence", label: "تواجدي والطلبات الواردة", icon: "clock" },
      { id: "staff-inbox", label: "طلبات الإدارة لي", icon: "message", count: incomingStaffRequests().filter((r) => r.status !== "مكتمل").length || null },
    ];
    if (role === "employee") return [
      { id: "my-presence", label: "تواجدي والطلبات الواردة", icon: "clock" },
      { id: "staff-inbox", label: "طلبات الإدارة لي", icon: "message", count: incomingStaffRequests().filter((r) => r.status !== "مكتمل").length || null },
    ];
    if (role === "secretary") return [
      { id: "dashboard", label: "لوحة المتابعة", icon: "dashboard" },
      { id: "presence", label: "تواجد الموظفين", icon: "users", count: incomingStaffRequests().length || null },
      { id: "planner", label: "خطة الوقت", icon: "clock" },
      { id: "secretary", label: "إدارة المكتب والطابور", icon: "calendar" },
      { id: "requests", label: "سجل الطلبات", icon: "inbox" },
      { id: "decisions", label: "سجل القرارات", icon: "archive" },
      { id: "daily", label: "الموجز اليومي", icon: "report" },
    ];
    if (role === "doctor") return [
      { id: "dashboard", label: "لوحة المتابعة", icon: "dashboard" },
      { id: "requests", label: "المعاملات الموجّهة إليّ", icon: "inbox" },
      { id: "planner", label: "خطة الوقت", icon: "clock" },
      { id: "presence", label: "تواجد الموظفين", icon: "users", count: incomingStaffRequests().length || null },
      { id: "daily", label: "الموجز اليومي", icon: "report" },
    ];
    if (role === "deputy-med" || role === "deputy-admin") return [
      { id: "dashboard", label: "لوحة المتابعة", icon: "dashboard" },
      { id: "matrix", label: "مصفوفة مهامي", icon: "grid" },
      { id: "requests", label: "المعاملات الموجّهة إليّ", icon: "inbox" },
      { id: "presence", label: "تواجد الموظفين", icon: "users", count: incomingStaffRequests().length || null },
      { id: "planner", label: "خطة الوقت", icon: "clock" },
      { id: "communications", label: "التواصل", icon: "message" },
      { id: "daily", label: "الموجز اليومي", icon: "report" },
    ];
    return [
      { id: "dashboard", label: "لوحة المتابعة", icon: "dashboard" },
      { id: "matrix", label: "مصفوفة الأولويات", icon: "grid" },
      { id: "requests", label: "سجل الطلبات", icon: "inbox", count: state.requests.filter((r) => r.status === "جديد").length || null },
      { id: "presence", label: "تواجد الموظفين", icon: "users", count: incomingStaffRequests().length || null },
      { id: "planner", label: "خطة الوقت", icon: "clock" },
      { id: "communications", label: "التواصل والاستدعاء", icon: "message" },
      { id: "secretary", label: "إدارة المكتب", icon: "calendar" },
      { id: "decisions", label: "سجل القرارات", icon: "archive" },
      { id: "daily", label: "الموجز اليومي", icon: "report" },
    ];
  }

  function renderSidebar() {
    const nav = navigationFor(state.role);
    const urgentCount = visibleRequests().filter((r) => r.quadrant === "q1" && r.status !== "مكتمل").length;
    return `
      <aside class="sidebar${state.menuOpen ? " is-open" : ""}" aria-label="التنقل الرئيسي">
        <div class="brand">
          <div class="brand-mark">${icon("brand")}</div>
          <div class="brand-copy"><strong>رِفد</strong><span>إدارة العمل التنفيذي</span></div>
        </div>
        <div class="sidebar-label">مساحة العمل</div>
        <nav class="nav-list">
          ${nav.map((item) => `<button class="nav-item${state.view === item.id ? " active" : ""}" data-view="${item.id}" type="button">${icon(item.icon, "nav-icon")}<span>${esc(item.label)}</span>${item.count ? `<span class="nav-count">${toArabicNumber(item.count)}</span>` : ""}</button>`).join("")}
        </nav>
        ${state.role !== "department" && state.role !== "employee" ? `<div class="sidebar-label" style="margin-top:25px">وصول سريع</div><nav class="nav-list"><button class="nav-item" data-action="open-summon" type="button">${icon("phone", "nav-icon")}<span>نداء مباشر</span></button><button class="nav-item" data-action="open-new-request" type="button">${icon("plus", "nav-icon")}<span>إضافة معاملة</span></button></nav>` : ""}
        <div class="sidebar-spacer"></div>
        <div class="sidebar-card"><div class="sidebar-card-title"><span class="pulse-dot"></span> شبكة المستشفى المحلية</div><p>التطبيق يعمل في وضع العرض المحلي. البيانات التجريبية محفوظة على هذا المتصفح.</p></div>
        <div class="sidebar-foot"><span>نسخة توضيحية</span><strong>${urgentCount ? `${toArabicNumber(urgentCount)} عاجل` : "النظام جاهز"}</strong></div>
      </aside>
      <button class="menu-backdrop${state.menuOpen ? " is-open" : ""}" aria-label="إغلاق القائمة" data-action="close-menu" type="button"></button>`;
  }

  function renderHeader() {
    const meta = VIEW_INFO[state.view] || VIEW_INFO.dashboard;
    const role = ROLES[state.role] || ROLES.director;
    const busy = isBusy();
    const identity = state.role === "employee" ? currentPerson() : role;
    return `<header class="topbar">
      <div class="topbar-start">
        <button class="mobile-menu" data-action="menu-toggle" aria-label="فتح القائمة" type="button">${icon("menu")}</button>
        <div class="topbar-title"><strong>${esc(meta[0])}</strong><span>مستشفى النور التخصصي · مساحة العمل التنفيذية</span></div>
      </div>
      <div class="topbar-end">
        <span class="local-indicator" title="واجهة محلية تجريبية"><span class="pulse-dot"></span>محلي</span>
        <span class="topbar-divider"></span>
        <label class="role-select-wrap"><span>عرض الدور</span><select id="role-select" aria-label="تغيير الدور التجريبي">${ROLE_IDS.filter((id) => id !== "waiting").map((id) => `<option value="${id}"${id === state.role ? " selected" : ""}>${esc(ROLES[id].label)}</option>`).join("")}</select></label>
        <button class="icon-button" data-action="open-communications" aria-label="الإشعارات" title="الإشعارات">${icon("bell")}${state.notices.length ? '<span class="notice-dot"></span>' : ""}</button>
        <span class="avatar" aria-hidden="true">${esc(identity?.initials || role.initials)}</span>
        <div class="user-name"><strong>${esc(identity?.name || role.person)}</strong><span>${busy && state.role === "director" ? "غير متفرغ" : esc(role.short)}</span></div>
      </div>
    </header>`;
  }

  function personById(kind, id) {
    if (kind === "leader") {
      const role = ROLES[id];
      return role ? { id, name: role.person, position: role.short, department: role.label, initials: role.initials, kind: "leader" } : null;
    }
    return state.staff.find((person) => person.id === id) || null;
  }

  function currentPerson() {
    if (PRESENCE_ROLE_IDS.includes(state.role)) return personById("leader", state.role);
    const id = state.role === "employee" ? state.staffId : CURRENT_STAFF_BY_ROLE[state.role];
    return personById("staff", id) || personById("staff", "EMP-001");
  }

  function presenceFor(id) {
    let presence = state.availability[id] || { status: "available", place: "غير محدد", returnAt: null, note: "" };
    if (id === "director" && isBusy()) presence = { ...presence, status: "away", place: "مشغول حالياً · مكتب المدير", returnAt: state.busyUntil, note: state.busyReason || "" };
    if (presence.status !== "available" && presence.returnAt && new Date(presence.returnAt).getTime() <= Date.now()) {
      return { ...presence, status: "available", place: presence.returnPlace || "مكتب العمل", returnAt: null, note: "انتهت مدة الغياب المحددة" };
    }
    return presence;
  }

  function presenceLabel(status) {
    return ({ available: "متاح الآن", away: "بعيد مؤقتاً", offsite: "خارج المكتب", remote: "متاح عن بُعد" })[status] || "الحالة غير محددة";
  }

  function presenceTime(presence) {
    if (!presence.returnAt) return "لا يوجد وقت عودة محدد";
    const date = new Date(presence.returnAt);
    const day = localDayKey(date) === localDayKey() ? "" : `${new Intl.DateTimeFormat("ar-EG", { weekday: "short", day: "numeric", month: "short" }).format(date)} `;
    return `العودة ${day}${formatDateTime(presence.returnAt)}`;
  }

  function incomingStaffRequests() {
    const person = currentPerson();
    if (!person) return [];
    const kind = person.kind || "staff";
    return state.staffRequests.filter((item) => item.recipientKind === kind && item.recipientId === person.id && item.status !== "مكتمل");
  }

  function renderAvailabilityCard(kind, id) {
    const person = personById(kind, id);
    if (!person) return "";
    const presence = presenceFor(id);
    const isSelf = currentPerson()?.id === id;
    return `<article class="presence-chip"><div class="presence-chip-top"><div class="presence-person"><span class="presence-avatar">${esc(person.initials || person.name.slice(0, 1))}</span><div><strong>${esc(person.name)}</strong><span>${esc(person.position || person.department)}</span></div></div><span class="presence-pill status-${esc(presence.status)}"><span></span>${presenceLabel(presence.status)}</span></div><div class="presence-location">${icon("target")}<span>${esc(presence.place || "مكان العمل غير محدد")}</span><small>${esc(presenceTime(presence))}</small></div><div class="presence-chip-actions">${isSelf ? `<button class="link-button" data-action="update-presence" type="button">تحديث تواجدي</button>` : `<button class="link-button" data-action="contact-person" data-person-kind="${kind}" data-person-id="${esc(id)}" type="button">${icon("message")} ${kind === "leader" && ["employee", "department"].includes(state.role) ? "مراسلة" : "إرسال طلب"}</button>`}</div></article>`;
  }

  function renderAvailabilityStrip() {
    const view = ["department", "employee"].includes(state.role) ? "my-presence" : "presence";
    const linkLabel = view === "my-presence" ? "تواجدي" : "كل الموظفين";
    return `<section class="availability-strip" aria-label="حالة تواجد المدير والنواب"><div class="availability-strip-heading"><strong>تواجد المدير والنواب</strong><span>اعرف الحالة قبل الذهاب إلى المكتب</span><button class="link-button" data-view="${view}" type="button">${linkLabel} ${icon("chevron")}</button></div><div class="availability-strip-list">${LEADER_IDS.map((id) => renderAvailabilityCard("leader", id)).join("")}</div></section>`;
  }

  function renderDemoNote() {
    if (state.role === "employee") return `<div class="demo-note">${icon("shield")}<span><strong>نموذج تواصل تجريبي:</strong> تحديث التواجد والطلبات الواردة محفوظة على هذا الجهاز فقط. للوصول من المنزل يلزم اتصال VPN مستشفى موثوق؛ لا تدخل بيانات حساسة أو عنواناً منزلياً.</span></div>`;
    if (state.role === "department") return `<div class="demo-note">${icon("shield")}<span><strong>نموذج تجريبي:</strong> إخفاء جهة الإحالة هنا تمثيل للواجهة فقط. لا ترسل بيانات مرضى أو معلومات حقيقية؛ العزل وRLS يتطلبان خادماً موثوقاً ومصادقة فعلية.</span></div>`;
    return `<div class="demo-note">${icon("shield")}<span><strong>بيئة عرض توضيحي:</strong> البيانات والأدوار محفوظة في هذا المتصفح فقط. لا تطبق هذه الواجهة مصادقة أو عزل قواعد بيانات (RLS)، ولا تستخدم بيانات مرضى حقيقية.</span></div>`;
  }

  function isBusy() {
    return !!state.busyUntil && new Date(state.busyUntil).getTime() > Date.now();
  }

  function renderBusyBanner() {
    if (!isBusy()) return "";
    const time = formatDateTime(state.busyUntil);
    return `<section class="busy-banner"><div class="busy-banner-copy"><div class="busy-icon">${icon("clock")}</div><div><strong>المدير غير متفرغ${state.busyReason ? ` · ${esc(state.busyReason)}` : ""}</strong><span>الوقت المتوقع للعودة: ${esc(time)} · يظهر هذا المؤشر ضمن المحاكاة المحلية فقط.</span></div></div>${state.role === "director" ? `<button class="btn btn-secondary btn-small" data-action="set-available" type="button">إنهاء الانشغال</button>` : ""}</section>`;
  }

  function heading(title, description, actions = "") {
    return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ""}</div>`;
  }

  function pageWrap(inner, includeNote = true) {
    return `<div class="page-content">${includeNote ? renderDemoNote() : ""}${renderBusyBanner()}${inner}</div>`;
  }

  function renderDashboard() {
    const requests = visibleRequests();
    const urgent = requests.filter((r) => r.quadrant === "q1" && r.status !== "مكتمل").length;
    const active = requests.filter((r) => !["مكتمل", "مرفوض"].includes(r.status)).length;
    const withDeputies = state.requests.filter((r) => ["deputy-med", "deputy-admin", "doctor"].includes(r.assignee) && r.status !== "مكتمل").length;
    const q1List = requests.filter((r) => r.quadrant === "q1" && r.status !== "مكتمل").slice(0, 3);
    const pendingDecisions = requests.filter((r) => ["بانتظار القرار", "جديد"].includes(r.status)).length;
    const actions = state.role === "department"
      ? `<button class="btn btn-primary" data-action="new-request" type="button">${icon("plus")} إرسال طلب جديد</button>`
      : `<button class="btn btn-secondary" data-action="open-busy" type="button">${icon("clock")} ${isBusy() ? "تعديل وقت الانشغال" : "تحديد عدم التفرغ"}</button><button class="btn btn-primary" data-action="open-new-request" type="button">${icon("plus")} معاملة جديدة</button>`;
    const title = state.role === "director" ? `صباح الخير، ${esc(ROLES.director.person)}` : `مرحباً، ${esc(ROLES[state.role].person)}`;
    const desc = `${dateLong()} · هذه نظرة سريعة على ما يحتاج انتباهك.`;
    return pageWrap(`${heading(title, desc, actions)}
      <div class="stats-grid">
        <article class="stat-card urgent"><div><div class="stat-label">هام وعاجل</div><div class="stat-value">${toArabicNumber(urgent)}</div><div class="stat-foot"><span class="up">يتطلب متابعة فورية</span></div></div><div class="stat-icon">${icon("bellRing")}</div></article>
        <article class="stat-card deputy"><div><div class="stat-label">لدى النواب والجهات</div><div class="stat-value">${toArabicNumber(state.role === "director" ? withDeputies : requests.filter((r) => r.status === "قيد المعالجة" || r.status === "مُحال للنائب").length)}</div><div class="stat-foot">معاملات قيد التنفيذ</div></div><div class="stat-icon">${icon("users")}</div></article>
        <article class="stat-card waiting"><div><div class="stat-label">بانتظار قرار</div><div class="stat-value">${toArabicNumber(pendingDecisions)}</div><div class="stat-foot">جديد أو بحاجة لاعتماد</div></div><div class="stat-icon">${icon("clock")}</div></article>
        <article class="stat-card"><div><div class="stat-label">طلبات نشطة</div><div class="stat-value">${toArabicNumber(active)}</div><div class="stat-foot"><span class="up">${toArabicNumber(state.requests.filter((r) => r.status === "مكتمل").length)} مكتملة</span> في سجل العرض</div></div><div class="stat-icon">${icon("check")}</div></article>
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-main-column">
          ${renderMatrixPanel(requests)}
          ${renderRecentRequests(requests)}
        </div>
        <div class="dashboard-side-column">
          ${renderBriefingCard(urgent, requests)}
          ${state.role === "director" ? renderRoutingCard() : renderLocalNoticeCard()}
        </div>
      </div>`, true);
  }

  function renderMatrixPanel(requests) {
    return `<section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("grid")}</span><div><h2>${state.role === "director" ? "مصفوفة آيزنهاور" : "مصفوفة مهامي"}</h2><p>التصنيف المقترح · اسحب للمراجعة من تفاصيل المعاملة</p></div></div><button class="link-button" data-view="matrix" type="button">عرض المصفوفة ${icon("chevron")}</button></div>
      <div class="matrix-preview"><div class="matrix-axis"><span class="axis-label">${icon("arrowUp")} مهم</span><span class="axis-label">عاجل <span class="axis-arrow">←</span> غير عاجل</span></div><div class="matrix-grid">${QUADRANTS.map((q) => renderQuadrant(q, requests.filter((r) => r.quadrant === q.id).slice(0, 2), true)).join("")}</div></div></section>`;
  }

  function renderQuadrant(q, items, preview = false) {
    return `<section class="quadrant ${q.className}"><div class="quadrant-head"><div class="quadrant-title"><span class="quadrant-mark">${q.mark}</span><div><strong>${q.label}</strong><span>${q.action}</span></div></div><span class="quadrant-count">${toArabicNumber(items.length)} طلب</span></div><div class="task-list">${items.length ? items.map((request) => renderTaskRow(request, preview)).join("") : `<div class="empty-in-quadrant">لا توجد معاملات في هذا المربع</div>`}</div></section>`;
  }

  function renderTaskRow(request, compact = false) {
    const info = qInfo(request.quadrant);
    const learned = request.learned ? `<span class="learning-label">${icon("spark")} تصنيف وفق تفضيلات سابقة</span>` : "";
    return `<div class="task-row" role="button" tabindex="0" data-open-request="${esc(request.id)}" aria-label="تفاصيل ${esc(request.title)}"><strong>${esc(request.title)}</strong><div class="task-row-meta"><span>${esc(request.department)}</span><span>${esc(request.time || request.date || "اليوم")}</span></div>${learned}${compact ? `<div class="task-actions"><button type="button" data-action="move-request" data-request-id="${esc(request.id)}" aria-label="تغيير تصنيف الطلب">نقل المربع</button></div>` : ""}</div>`;
  }

  function renderBriefingCard(urgent, requests) {
    const handled = state.requests.filter((r) => r.status === "مكتمل").length;
    const totalToday = Math.max(1, state.requests.length);
    const progress = Math.min(100, Math.round(((handled + Math.max(2, Math.round(totalToday * .52))) / totalToday) * 100));
    const urgentList = requests.filter((r) => r.quadrant === "q1").slice(0, 2);
    return `<section class="panel briefing-card"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("report")}</span><div><h2>موجز اليوم</h2><p>ملخص تنفيذي حتى الآن</p></div></div><span class="pill pill-green">${toArabicNumber(handled)} مكتمل</span></div>
      <div class="briefing-date">${dateLong()} · تحديث ${timeNow()}</div>
      <div class="briefing-kpis"><div class="brief-kpi critical"><span>حالات عاجلة</span><strong>${toArabicNumber(urgent)}</strong></div><div class="brief-kpi"><span>بانتظار المتابعة</span><strong>${toArabicNumber(requests.filter((r) => r.status !== "مكتمل").length)}</strong></div></div>
      <div class="briefing-progress"><div class="progress-label"><span>إنجاز مهام العرض</span><strong>${toArabicNumber(progress)}٪</strong></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div></div>
      ${urgentList.length ? `<div class="priority-feed">${urgentList.map((r) => `<div class="priority-item"><span class="priority-dot"></span><div class="priority-copy"><strong>${esc(r.title)}</strong><span>${esc(r.department)} · ${esc(r.time)}</span></div></div>`).join("")}</div>` : ""}
      <div class="briefing-foot"><span>المعاملات المعروضة</span><strong>${toArabicNumber(requests.length)} سجل</strong></div>
    </section>`;
  }

  function renderRoutingCard() {
    const routes = [
      { id: "deputy-med", icon: "مع", name: "النائب الأول", subtitle: "الشؤون الطبية", count: state.requests.filter((r) => r.assignee === "deputy-med" && r.status !== "مكتمل").length },
      { id: "deputy-admin", icon: "إم", name: "النائب الثاني", subtitle: "الإدارية والمالية", count: state.requests.filter((r) => r.assignee === "deputy-admin" && r.status !== "مكتمل").length },
      { id: "doctor", icon: "ط", name: "الطبيب المصرح", subtitle: "التوقيعات الروتينية", count: state.requests.filter((r) => r.assignee === "doctor" && r.status !== "مكتمل").length },
    ];
    return `<section class="panel route-card"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("users")}</span><div><h2>التوجيه للنواب</h2><p>توزيع المهام حسب الاختصاص</p></div></div></div><div class="route-list">${routes.map((r) => `<div class="route-item"><div class="route-person"><span class="route-avatar">${r.icon}</span><div><strong>${r.name}</strong><span>${r.subtitle}</span></div></div><div class="route-number">${toArabicNumber(r.count)}<small>نشطة</small></div></div>`).join("")}</div><div class="briefing-foot"><span>آخر مراجعة</span><strong>اليوم · ${timeNow()}</strong></div></section>`;
  }

  function renderLocalNoticeCard() {
    const items = state.notices.filter((n) => n.target === "all").slice(0, 2);
    return `<section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("bell")}</span><div><h2>التنبيهات</h2><p>آخر التحديثات للمستخدمين</p></div></div><button class="link-button" data-view="communications" type="button">إدارة ${icon("chevron")}</button></div>${items.length ? items.map((n) => `<div class="broadcast-item"><div><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p></div><time>${esc(n.time)}</time></div>`).join("") : `<div class="no-results">لا توجد تنبيهات جديدة.</div>`}</section>`;
  }

  function renderRecentRequests(requests) {
    const list = [...requests].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
    return `<section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("inbox")}</span><div><h2>أحدث المعاملات</h2><p>آخر ما ورد إلى مساحة العمل</p></div></div><button class="link-button" data-view="requests" type="button">سجل الطلبات ${icon("chevron")}</button></div>${list.length ? `<div class="table-wrap"><table class="requests-table"><thead><tr><th>المعاملة</th><th>القسم</th><th>الأولوية</th><th>الحالة</th></tr></thead><tbody>${list.map((r) => `<tr data-open-request="${esc(r.id)}" tabindex="0"><td><div class="request-title-cell"><span class="request-type-icon">${icon(r.confidential ? "lock" : "file")}</span><div><strong>${esc(r.title)}</strong><span>${esc(r.id)} · ${esc(r.time)}</span></div></div></td><td>${esc(r.department)}</td><td><span class="pill ${qInfo(r.quadrant).pill}">${qInfo(r.quadrant).label}</span></td><td><span class="status-text ${statusClass(r.status)}">${esc(r.status)}</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="no-results">لا توجد معاملات ظاهرة لهذا الدور.</div>`}</section>`;
  }

  function renderMatrixPage() {
    const requests = visibleRequests();
    const actions = `<button class="btn btn-secondary" data-action="export-requests" type="button">${icon("file")} تصدير CSV</button>`;
    return pageWrap(`${heading("مصفوفة آيزنهاور", "حرّك المعاملة يدوياً عند الحاجة؛ سيُحفظ هذا التعديل كقاعدة محلية للمقترحات المشابهة.", actions)}
      <div class="matrix-page-grid">${QUADRANTS.map((q) => renderQuadrant(q, requests.filter((r) => r.quadrant === q.id), false)).join("")}</div>
      <section class="learning-panel"><div class="learning-panel-copy"><span class="learning-panel-icon">${icon("spark")}</span><div><strong>محرك التعلّم من التعديلات</strong><p>عند نقل معاملة، تُحفظ كلمات مفتاحية والقسم والمربع الجديد على هذا المتصفح. عند ورود طلب مشابه من القسم نفسه يقترح النظام التصنيف المحفوظ، ويمكنك تغييره مجدداً.</p></div></div><div class="learning-stat"><strong>${toArabicNumber(state.overrides.length)}</strong><span>قاعدة محفوظة</span></div></section>
      <div class="footer-caption">قواعد التعلّم هنا تجريبية ومخزنة في المتصفح فقط؛ لا تستبدل سياسة تصنيف أو سجل تدقيق معتمداً.</div>`, true);
  }

  function renderRequestsPage() {
    const requests = [...visibleRequests()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const filtered = requests.filter((r) => {
      const query = normalizeArabic(state.requestSearch);
      const matchesQuery = !query || normalizeArabic(`${r.id} ${r.title} ${r.department} ${r.requester} ${r.status}`).includes(query);
      const matchesFilter = state.requestFilter === "all" || r.quadrant === state.requestFilter || (state.requestFilter === "open" && r.status !== "مكتمل");
      return matchesQuery && matchesFilter;
    });
    return pageWrap(`${heading(state.role === "director" || state.role === "secretary" ? "سجل الطلبات" : "المعاملات الموجّهة إليّ", "ابحث بالرقم أو القسم أو الكلمات المفتاحية، ثم افتح الطلب للإجراء." , `<button class="btn btn-primary" data-action="open-new-request" type="button">${icon("plus")} إضافة معاملة</button>`)}
      <div class="filter-bar"><label class="filter-search">${icon("search")}<input id="request-search" type="search" placeholder="ابحث في الطلبات..." value="${esc(state.requestSearch)}" autocomplete="off" /></label><select class="filter-select" id="request-filter" aria-label="تصفية الطلبات"><option value="all"${state.requestFilter === "all" ? " selected" : ""}>كل الطلبات</option><option value="open"${state.requestFilter === "open" ? " selected" : ""}>غير مكتملة</option>${QUADRANTS.map((q) => `<option value="${q.id}"${state.requestFilter === q.id ? " selected" : ""}>${q.label}</option>`).join("")}</select></div>
      <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("inbox")}</span><div><h2>قائمة المعاملات</h2><p>${toArabicNumber(filtered.length)} معاملة معروضة</p></div></div><span class="pill pill-gray">${toArabicNumber(requests.length)} في النطاق</span></div>${filtered.length ? `<div class="table-wrap"><table class="requests-table"><thead><tr><th>المعاملة</th><th>القسم</th><th>الإحالة</th><th>الأولوية</th><th>الحالة</th><th></th></tr></thead><tbody>${filtered.map((r) => `<tr data-open-request="${esc(r.id)}" tabindex="0"><td><div class="request-title-cell"><span class="request-type-icon">${icon(r.confidential ? "lock" : "file")}</span><div><strong>${esc(r.title)}${r.confidential ? ` <span class="confidential">${icon("lock")} سرية</span>` : ""}</strong><span>${esc(r.id)} · ${esc(r.time || r.date || "اليوم")} · ${esc(r.requester)}</span></div></div></td><td>${esc(r.department)}</td><td>${esc(roleShort(r.assignee))}</td><td><span class="pill ${qInfo(r.quadrant).pill}">${qInfo(r.quadrant).label}</span>${r.learned ? `<span class="learning-label">${icon("spark")} تعلم</span>` : ""}</td><td><span class="status-text ${statusClass(r.status)}">${esc(r.status)}</span></td><td><button class="row-menu" data-action="open-request" data-request-id="${esc(r.id)}" aria-label="فتح تفاصيل المعاملة">${icon("more")}</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="no-results">لا توجد نتائج مطابقة.</div>`}</section>`, true);
  }

  function renderCommunications() {
    const notices = state.notices.slice(0, 8);
    const directorBusy = isBusy();
    return pageWrap(`${heading("التواصل والاستدعاء", "إشعارات وتنسيق داخل الشبكة المحلية — في هذا النموذج لا تُرسل رسائل فعلية إلى أجهزة أخرى.", `<button class="btn btn-primary" data-action="open-broadcast" type="button">${icon("send")} تعميم جديد</button>`)}
      <div class="communication-grid">
          <section class="panel action-panel"><div class="action-panel-head"><span class="action-big-icon ${directorBusy ? "" : "green"}">${icon("clock")}</span><div><strong>حالة التفرغ</strong><span>تظهر مؤقتاً في لوحات العرض</span></div></div><div class="action-panel-body"><p class="action-description">${directorBusy ? `المدير غير متفرغ حتى ${esc(formatDateTime(state.busyUntil))}${state.busyReason ? ` بسبب: ${esc(state.busyReason)}` : ""}.` : "حدّد مدة الانشغال قبل الاجتماع؛ يلزم إدخال وقت نهاية واضح."}</p>${state.role === "director" ? `<button class="btn ${directorBusy ? "btn-secondary" : "btn-primary"}" data-action="${directorBusy ? "set-available" : "open-busy"}" type="button">${icon(directorBusy ? "check" : "clock")}${directorBusy ? "إنهاء حالة الانشغال" : "تحديد وقت عدم التفرغ"}</button>` : "<span class=\"helper-text\">تُدار هذه الحالة من لوحة المدير.</span>"}</div></section>
        <section class="panel action-panel"><div class="action-panel-head"><span class="action-big-icon blue">${icon("phone")}</span><div><strong>نداء مباشر</strong><span>استدعاء موظف أو نائب للمكتب</span></div></div><div class="action-panel-body"><p class="action-description">إرسال نداء تجريبي إلى شخص محدد أو إلى رئيس قسم. لا يصل إلى هاتف حقيقي في هذه النسخة.</p><button class="btn btn-secondary" data-action="open-summon" type="button">${icon("phone")} إنشاء نداء</button></div></section>
      </div>
      <section class="panel" style="margin-top:15px"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("bell")}</span><div><h2>التعاميم والتنبيهات</h2><p>سجل الرسائل المحفوظة محلياً</p></div></div><span class="pill pill-gray">${toArabicNumber(notices.length)} رسالة</span></div>${notices.length ? notices.map((n) => `<div class="broadcast-item"><div><strong>${esc(n.title)}${n.target === "all" ? ` <span class="pill pill-blue">لكل الأقسام</span>` : ` <span class="pill pill-gray">${esc(n.department || n.target)}</span>`}</strong><p>${esc(n.message)}</p></div><time>${esc(n.time || "الآن")}</time></div>`).join("") : `<div class="no-results">لا توجد تعاميم بعد.</div>`}<div style="padding:0 17px 16px"><button class="btn btn-secondary btn-small" data-action="open-broadcast" type="button">${icon("plus")} إضافة تعميم</button></div></section>
      <div class="demo-note" style="margin-top:15px;margin-bottom:0">${icon("shield")}<span>للتنفيذ الحقيقي على عدة أجهزة يلزم خادم محلي وقناة WebSocket موثوقة مع مصادقة وصلاحيات. تحديث localStorage لا يرسل إشعارات إلى أجهزة الشبكة.</span></div>`, true);
  }

  function renderPresencePage() {
    const presenceIds = [...PRESENCE_ROLE_IDS, ...state.staff.map((person) => person.id)];
    const statuses = presenceIds.map((id) => presenceFor(id).status);
    const awayCount = statuses.filter((status) => status !== "available").length;
    const current = currentPerson();
    const sent = state.staffRequests.filter((item) => item.requesterId === current?.id).slice(0, 5);
    const received = state.staffRequests.filter((item) => item.recipientKind === (current?.kind || "staff") && item.recipientId === current?.id).slice(0, 5);
    return pageWrap(`${heading("تواجد الموظفين", "قبل ما تغادر مكتبك، اعرف مين موجود أو خارج المكتب ومتى يرجع. لو غايب ابعت له طلب معلومة أو مستند من هنا.", `<button class="btn btn-secondary" data-action="update-presence" type="button">${icon("clock")} تحديث تواجدي</button>`)}
      <div class="stats-grid presence-stats"><article class="stat-card"><div><div class="stat-label">المدير والنواب</div><div class="stat-value">${toArabicNumber(LEADER_IDS.filter((id) => presenceFor(id).status === "available").length)} / ${toArabicNumber(LEADER_IDS.length)}</div><div class="stat-foot">متاحون الآن</div></div><div class="stat-icon">${icon("users")}</div></article><article class="stat-card waiting"><div><div class="stat-label">خارج المكان المعتاد</div><div class="stat-value">${toArabicNumber(awayCount)}</div><div class="stat-foot">مع وقت عودة متوقع</div></div><div class="stat-icon">${icon("clock")}</div></article><article class="stat-card deputy"><div><div class="stat-label">طلبات اتصال مفتوحة</div><div class="stat-value">${toArabicNumber(state.staffRequests.filter((item) => item.status !== "مكتمل").length)}</div><div class="stat-foot">معلومات أو مستندات</div></div><div class="stat-icon">${icon("message")}</div></article><article class="stat-card"><div><div class="stat-label">آخر تحديث</div><div class="stat-value" style="font-size:18px">${timeNow()}</div><div class="stat-foot">حالة تجريبية محلية</div></div><div class="stat-icon">${icon("refresh")}</div></article></div>
      <div class="presence-section-head"><div><h2>المدير والنواب</h2><p>الحالة ظاهرة في الشريط أعلى كل صفحة</p></div><span class="pill pill-blue">${toArabicNumber(LEADER_IDS.length)} أشخاص</span></div><div class="presence-grid">${LEADER_IDS.map((id) => renderAvailabilityCard("leader", id)).join("")}</div>
      <div class="presence-section-head" style="margin-top:20px"><div><h2>الطبيب المصرح</h2><p>حالة الدور المسؤول عن التوقيعات الروتينية في النموذج</p></div><span class="pill pill-gray">دور مساند</span></div><div class="presence-grid">${renderAvailabilityCard("leader", "doctor")}</div>
      <div class="presence-section-head" style="margin-top:20px"><div><h2>موظفو الأقسام</h2><p>مكان عمل عام ووقت عودة تقريبي؛ لا نعرض عناوين منزلية أو إحداثيات GPS</p></div><span class="pill pill-gray">${toArabicNumber(state.staff.length)} موظفين</span></div><div class="presence-grid">${state.staff.map((person) => renderAvailabilityCard("staff", person.id)).join("")}</div>
      ${received.length ? `<section class="panel received-staff-requests"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("inbox")}</span><div><h2>طلبات وصلتني</h2><p>طلبات أرسلها الموظفون إلى دورك</p></div></div><span class="pill pill-blue">${toArabicNumber(received.length)}</span></div>${received.map((item) => renderStaffRequestCard(item)).join("")}</section>` : ""}
      <section class="panel sent-staff-requests"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("message")}</span><div><h2>طلبات أرسلتها</h2><p>طلب معلومة أو ورقة دون البحث عن الموظف في أرجاء المستشفى</p></div></div><span class="pill pill-gray">${toArabicNumber(sent.length)} حديثة</span></div>${sent.length ? sent.map((item) => `<div class="broadcast-item"><div><strong>${esc(item.title)} <span class="pill ${item.status === "مكتمل" ? "pill-green" : "pill-amber"}">${esc(item.status)}</span></strong><p>إلى ${esc(personById(item.recipientKind, item.recipientId)?.name || item.recipientId)} · ${esc(item.message)}</p>${item.response ? `<p><strong>الرد:</strong> ${esc(item.response)}</p>` : ""}</div><time>${esc(item.time)}</time></div>`).join("") : `<div class="no-results">لم ترسل طلبات اتصال بعد.</div>`}</section>
      <div class="demo-note remote-access-note">${icon("shield")}<span><strong>مهم للوصول من المنزل:</strong> النظام المحلي لا يصل إلى هاتف خارج شبكة المستشفى تلقائياً. يلزم VPN مستشفى مُدار ومصادقة قوية (أو بوابة وصول معتمدة)؛ لا تفتحوا الخادم مباشرة على الإنترنت. المكان هنا وصف عمل عام اختياري، وليس تتبع GPS.</span></div>`, true);
  }

  function renderMyPresence() {
    const person = currentPerson();
    const presence = presenceFor(person.id);
    const allIncoming = state.staffRequests.filter((item) => item.recipientKind === (person.kind || "staff") && item.recipientId === person.id).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const incoming = allIncoming.filter((item) => item.status !== "مكتمل");
    const sent = state.staffRequests.filter((item) => item.requesterId === person.id).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
    return `<div class="page-content"><div class="employee-wrap">${renderDemoNote()}${renderBusyBanner()}${heading("تواجدي والطلبات الواردة", "حدّث حالتك قبل ما تترك مكانك، وخلي المدير يعرف إمتى يتواصل معك أو أين يجدك داخل المستشفى.", `<button class="btn btn-primary" data-action="update-presence" type="button">${icon("clock")} تحديث حالتي</button>`)}
      ${state.role === "employee" ? `<div class="staff-identity-picker"><label for="staff-select">اختَر حساب الموظف في هذا العرض</label><select id="staff-select">${state.staff.map((member) => `<option value="${esc(member.id)}"${member.id === state.staffId ? " selected" : ""}>${esc(member.name)} · ${esc(member.position)}</option>`).join("")}</select><span>التبديل للتجربة فقط؛ النظام الحقيقي يربط الموظف بحسابه بعد تسجيل الدخول.</span></div>` : ""}
      <section class="panel my-presence-card"><div class="my-presence-top"><span class="presence-avatar large">${esc(person.initials || "م")}</span><div><strong>${esc(person.name)}</strong><span>${esc(person.position || person.department)}</span></div><span class="presence-pill status-${esc(presence.status)}"><span></span>${presenceLabel(presence.status)}</span></div><div class="my-presence-details"><div><span>مكان العمل / وصف عام</span><strong>${esc(presence.place || "غير محدد")}</strong></div><div><span>وقت العودة المتوقع</span><strong>${esc(presence.returnAt ? formatDateTime(presence.returnAt) : "متاح دون موعد عودة")}</strong></div><div><span>ملاحظة</span><strong>${esc(presence.note || "لا توجد")}</strong></div></div><div class="blind-note">اختَر مكاناً عاماً مثل «مخزن الدور الثاني» أو «خارج المستشفى». لا تكتب عنوان المنزل ولا تشارك موقع GPS دائم.</div></section>
      <section class="panel" style="margin-top:15px"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("message")}</span><div><h2>طلبات المدير أو السكرتارية</h2><p>تظهر لك هنا طلبات المعلومات والمستندات</p></div></div><span class="pill pill-amber">${toArabicNumber(incoming.length)} مفتوح</span></div>${allIncoming.length ? allIncoming.slice(0, 4).map((item) => renderStaffRequestCard(item)).join("") : `<div class="no-results">لا توجد طلبات واردة حالياً.</div>`}</section>
      ${sent.length ? `<section class="panel" style="margin-top:15px"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("send")}</span><div><h2>مراسلاتي إلى المدير أو النواب</h2><p>تظهر حالة الرسالة أو الرد عندما يفتحه الطرف الآخر</p></div></div><span class="pill pill-gray">${toArabicNumber(sent.length)}</span></div>${sent.map((item) => `<div class="broadcast-item"><div><strong>إلى ${esc(item.recipient)} · ${esc(item.title)} <span class="pill ${item.status === "مكتمل" ? "pill-green" : "pill-amber"}">${esc(item.status)}</span></strong><p>${esc(item.message)}</p>${item.response ? `<p><strong>الرد:</strong> ${esc(item.response)}</p>` : ""}</div><time>${esc(item.time)}</time></div>`).join("")}</section>` : ""}
      <section class="panel" style="margin-top:15px"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("users")}</span><div><h2>حالة المدير والنواب</h2><p>تظهر أيضاً في شريط أعلى الصفحات</p></div></div></div><div class="presence-grid compact-presence">${LEADER_IDS.map((id) => renderAvailabilityCard("leader", id)).join("")}</div></section>
      <div class="demo-note remote-access-note" style="margin-top:15px">${icon("shield")}<span>للوصول من المنزل يلزم VPN المستشفى أو وسيلة وصول مُدارة ومعتمدة. هذه الواجهة لا تتصل بالإنترنت الخارجي ولا ترسل تنبيهاً للهاتف الحقيقي.</span></div>
    </div></div>`;
  }

  function renderStaffRequestCard(item) {
    const due = item.dueAt ? formatDateTime(item.dueAt) : "بدون موعد محدد";
    return `<article class="staff-request-card"><div class="staff-request-heading"><div><span class="pill ${item.kind === "document" ? "pill-blue" : "pill-amber"}">${item.kind === "document" ? "مستند" : item.kind === "attendance" ? "حضور" : "معلومة"}</span>${item.priority === "urgent" ? `<span class="pill pill-red">عاجل</span>` : ""}<strong>${esc(item.title)}</strong></div><span class="status-text ${statusClass(item.status)}">${esc(item.status)}</span></div><p>${esc(item.message)}</p><div class="staff-request-meta"><span>من ${esc(item.requester)}</span><span>الموعد: ${esc(due)}</span></div>${item.status !== "مكتمل" ? `<form class="staff-reply-form" data-form="staff-reply" data-staff-request-id="${esc(item.id)}"><textarea name="response" maxlength="500" required placeholder="اكتب المعلومة أو أين سلّمت الورقة…"></textarea><button class="btn btn-primary btn-small" type="submit">${icon("send")} إرسال الرد</button></form>` : item.response ? `<div class="digest-quote"><strong>الرد المسجل</strong>${esc(item.response)}</div>` : ""}</article>`;
  }

  function renderStaffInbox() {
    const person = currentPerson();
    const incoming = state.staffRequests.filter((item) => item.recipientKind === (person.kind || "staff") && item.recipientId === person.id).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return `<div class="page-content"><div class="employee-wrap">${renderDemoNote()}${heading("طلبات الإدارة لي", "لو المدير يحتاج معلومة أو ورقة، يرسلها هنا بدل ما يترك مكتبه ويدور عليك.")}<section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("inbox")}</span><div><h2>صندوق الطلبات</h2><p>${toArabicNumber(incoming.filter((item) => item.status !== "مكتمل").length)} لم تُغلق بعد</p></div></div></div>${incoming.length ? incoming.map((item) => renderStaffRequestCard(item)).join("") : `<div class="no-results">صندوقك خالٍ من الطلبات حالياً.</div>`}</section><div class="blind-note">لو أنت بعيداً، اكتب وقت عودتك ومكان عمل عام في «تواجدي». إذا كنت خارج شبكة المستشفى، يلزم VPN آمن حتى تستلم الطلب.</div></div></div>`;
  }

  function localDayKey(date = new Date()) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function dayFromKey(key) {
    const [year, month, day] = String(key).split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  }

  function plannerDayLabel(offset, dateKey) {
    if (offset === 0) return "اليوم";
    if (offset === 1) return "غداً";
    return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "short" }).format(dayFromKey(dateKey));
  }

  function plannerClock(unit) {
    const [hours, minutes] = String(state.plannerPrefs.startTime || "09:00").split(":").map(Number);
    const date = new Date(2000, 0, 1, hours || 9, (minutes || 0) + unit * 30);
    return new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function plannerPriority(quadrant) {
    return ({ q1: 0, q3: 1, q2: 2, q4: 3 })[quadrant] ?? 4;
  }

  function plannerDuration(units) {
    const wholeHours = Math.floor(units / 2);
    if (units % 2) return wholeHours ? `${toArabicNumber(wholeHours)} ساعة ونصف` : "نصف ساعة";
    return `${toArabicNumber(wholeHours)} ساعة`;
  }

  function plannerTasks() {
    const requestTasks = state.requests.filter((request) => request.status !== "مكتمل" && request.quadrant !== "q4").map((request) => ({
      id: request.id,
      title: request.title,
      quadrant: request.quadrant,
      units: Math.max(1, Math.min(6, Number(request.estimatedUnits) || (request.quadrant === "q1" ? 2 : request.quadrant === "q3" ? 1 : 2))),
      dueDate: request.planDate || localDayKey(),
      createdAt: request.createdAt || 0,
      sourceType: "request",
      requestId: request.id,
    }));
    const manualTasks = state.plannerTasks.filter((task) => task.status !== "مكتمل").map((task) => ({
      ...task,
      units: Math.max(1, Math.min(6, Number(task.units) || 1)),
      dueDate: task.dueDate || localDayKey(),
      createdAt: task.createdAt || 0,
      sourceType: "manual",
    }));
    return [...requestTasks, ...manualTasks].filter((task) => ["q1", "q2", "q3"].includes(task.quadrant));
  }

  function buildWeekPlan() {
    const workdayHours = Math.max(1, Number(state.plannerPrefs.workdayHours) || 6);
    const totalUnits = Math.round(workdayHours * 2);
    const bufferUnits = Math.max(1, Math.min(totalUnits - 1, Number(state.plannerPrefs.bufferUnits) || 2));
    const tasks = plannerTasks().sort((a, b) => plannerPriority(a.quadrant) - plannerPriority(b.quadrant) || Number(!!b.urgent) - Number(!!a.urgent) || (a.createdAt || 0) - (b.createdAt || 0));
    const assigned = new Set();
    const days = [];
    for (let offset = 0; offset <= 7; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const key = localDayKey(date);
      const items = [];
      let used = 0;
      const eligible = tasks.filter((task) => !assigned.has(task.id) && task.dueDate <= key);
      for (const quadrant of ["q1", "q3", "q2"]) {
        for (const task of eligible.filter((candidate) => candidate.quadrant === quadrant)) {
          const fitsTotal = used + task.units <= totalUnits;
          const fitsProtectedDay = quadrant === "q1" || used + task.units <= totalUnits - bufferUnits;
          if (!fitsTotal || !fitsProtectedDay) continue;
          items.push({ taskId: task.id, title: task.title, quadrant: task.quadrant, units: task.units, startUnit: used, sourceType: task.sourceType, requestId: task.requestId || "" });
          used += task.units;
          assigned.add(task.id);
        }
      }
      days.push({ offset, date: key, label: plannerDayLabel(offset, key), totalUnits, bufferUnits, usedUnits: used, items });
    }
    const backlog = tasks.filter((task) => !assigned.has(task.id));
    return { generatedAt: Date.now(), baseDate: localDayKey(), workdayHours, totalUnits, bufferUnits, days, backlog };
  }

  function refreshWeekPlan() {
    state.weekPlan = buildWeekPlan();
  }

  function renderPlannerDay(day) {
    const reserveUsed = Math.max(0, day.usedUnits - (day.totalUnits - day.bufferUnits));
    const reserveLeft = Math.max(0, day.bufferUnits - reserveUsed);
    const fill = Math.min(100, Math.round(day.usedUnits / day.totalUnits * 100));
    return `<article class="plan-day-card${day.offset === 0 ? " is-today" : ""}"><div class="plan-day-head"><div><span class="plan-day-date">${esc(day.label)}</span><strong>${esc(new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long" }).format(dayFromKey(day.date)))}</strong></div><span class="pill ${day.offset === 0 ? "pill-blue" : "pill-gray"}">${toArabicNumber(day.usedUnits)} / ${toArabicNumber(day.totalUnits)} وحدة</span></div><div class="progress-track"><div class="progress-fill" style="width:${fill}%"></div></div><div class="plan-day-workload"><span>المستخدم ${toArabicNumber(day.usedUnits)} وحدة · ${plannerDuration(day.usedUnits)}</span><span>المتبقي ${toArabicNumber(day.totalUnits - day.usedUnits)} وحدة</span></div><div class="plan-task-list">${day.items.length ? day.items.map((item) => `<div class="plan-task-item"><div class="plan-task-time">${plannerClock(item.startUnit)}<span>إلى ${plannerClock(item.startUnit + item.units)}</span></div><div class="plan-task-copy"><strong>${esc(item.title)}</strong><span class="pill ${qInfo(item.quadrant).pill}">${qInfo(item.quadrant).label} · ${toArabicNumber(item.units)} وحدات</span></div><div class="plan-task-actions"><button class="plan-estimate" data-action="estimate-plan-task" data-task-id="${esc(item.taskId)}" data-source-type="${item.sourceType}" aria-label="تعديل وقت ${esc(item.title)}" type="button">${icon("clock")}</button><button class="plan-complete" data-action="complete-plan-task" data-task-id="${esc(item.taskId)}" data-source-type="${item.sourceType}" aria-label="إنجاز ${esc(item.title)}" type="button">${icon("check")}</button></div></div>`).join("") : `<div class="plan-empty">لا توجد مهام مثبتة. تبقّى وقت للخطة أو للطوارئ.</div>`}</div><div class="plan-buffer-card">${icon("spark")}<span><strong>احتياطي الطوارئ:</strong> ${toArabicNumber(reserveLeft)} من ${toArabicNumber(day.bufferUnits)} وحدة · الوقت المفتوح ${toArabicNumber(day.totalUnits - day.usedUnits)} وحدة</span></div></article>`;
  }

  function renderPlanner() {
    if (!state.weekPlan || state.weekPlan.baseDate !== localDayKey()) {
      refreshWeekPlan();
      save();
    }
    const plan = state.weekPlan;
    const prefs = state.plannerPrefs;
    return pageWrap(`${heading("خطة الوقت: اليوم والأسبوع", "رتّب العمل قبل نهاية اليوم. الوحدة ٣٠ دقيقة؛ الطلب العاجل يدخل أولاً، وتبقى وحدات احتياط حتى لا تبتلع المفاجآت اليوم كله.", `<button class="btn btn-quiet" data-action="refresh-plan" type="button">${icon("refresh")} إعادة ترتيب الخطة</button><button class="btn btn-quiet" data-action="open-planner-task" type="button">${icon("plus")} مهمة مخططة</button><button class="btn btn-primary" data-action="open-unexpected-task" type="button">${icon("bellRing")} مهمة طارئة</button>`)}
      <section class="planner-settings panel"><div class="planner-settings-title"><span class="title-icon">${icon("clock")}</span><div><strong>إعداد يوم العمل</strong><span>${toArabicNumber(plan.totalUnits)} وحدة × ٣٠ دقيقة = ${toArabicNumber(plan.workdayHours)} ساعات · تبدأ الفترة ${esc(prefs.startTime)}</span></div></div><form class="planner-settings-form" data-form="planner-prefs"><label>ساعات العمل<select name="workdayHours">${[4, 5, 6, 7, 8, 9, 10, 12].map((hours) => `<option value="${hours}"${Number(prefs.workdayHours) === hours ? " selected" : ""}>${toArabicNumber(hours)} ساعات</option>`).join("")}</select></label><label>احتياطي المفاجآت<select name="bufferUnits">${[1, 2, 3, 4].map((units) => `<option value="${units}"${Number(prefs.bufferUnits) === units ? " selected" : ""}>${toArabicNumber(units)} وحدة · ${toArabicNumber(units * 30)} دقيقة</option>`).join("")}</select></label><label>بداية الدوام<input name="startTime" type="time" value="${esc(prefs.startTime || "09:00")}" required /></label><button class="btn btn-primary btn-small" type="submit">تحديث الخطة</button></form></section>
      <div class="planner-rules"><span>${icon("bellRing")} <strong>١.</strong> هام وعاجل أولاً</span><span>${icon("send")} <strong>٢.</strong> غير هام وعاجل بعده</span><span>${icon("calendar")} <strong>٣.</strong> المهم غير العاجل في المساحة المتبقية</span><span>${icon("spark")} <strong>٤.</strong> المربع الرابع لا يستهلك وقت الجدول</span></div>
      <div class="planner-days-heading"><div><h2>خطة اليوم + السبعة أيام القادمة</h2><p>عند إضافة طارئ، يعاد ترتيب المهام الأقل أولوية إلى الأيام التالية.</p></div><span class="pill pill-green">${toArabicNumber(plan.days.length)} أيام</span></div><div class="planner-day-grid">${plan.days.map((day) => renderPlannerDay(day)).join("")}</div>
      ${plan.backlog.length ? `<section class="panel planner-backlog"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("inbox")}</span><div><h2>قائمة ما بعد الأسبوع</h2><p>مهام لم تتسع لها الوحدات المحجوزة خلال الأيام الثمانية المعروضة</p></div></div><span class="pill pill-amber">${toArabicNumber(plan.backlog.length)} مهام</span></div><div class="backlog-list">${plan.backlog.map((task) => `<div class="backlog-item"><strong>${esc(task.title)}</strong><span class="pill ${qInfo(task.quadrant).pill}">${qInfo(task.quadrant).label} · ${toArabicNumber(task.units)} وحدات</span></div>`).join("")}</div></section>` : ""}
      <div class="demo-note remote-access-note">${icon("shield")}<span>هذه خطة عرض تجريبية مبنية على الأولوية والتقدير اليدوي، وليست تكاملاً مع تقويم حقيقي. المدير يستطيع تعديل الوحدات والاحتياطي؛ كل نصف ساعة وحدة واحدة، والمهام غير المنجزة يعاد ترتيبها لا حذفها.</span></div>`, true);
  }

  function renderSecretary() {
    const waiting = state.queue.length;
    const next = state.queue[0];
    const appointments = [...state.agenda];
    const unsigned = state.documents.filter((d) => d.status === "بانتظار التوقيع");
    return pageWrap(`${heading("إدارة المكتب", "طابور منظم للزوار، أجندة المدير، ومستندات جاهزة للمراجعة.", `<button class="btn btn-secondary" data-action="show-waiting" type="button">${icon("laptop")} شاشة صالة الانتظار</button><button class="btn btn-primary" data-action="open-queue-add" type="button">${icon("plus")} حجز موعد</button>`)}
      <div class="secretary-grid">
        <div style="display:grid;gap:15px">
          <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("users")}</span><div><h2>طابور المكتب</h2><p>عرض الرقم الحالي فقط على شاشة الانتظار</p></div></div><span class="pill pill-green">${toArabicNumber(waiting)} بانتظار الدخول</span></div>
            <div class="queue-display"><div><small>الرقم الحالي</small><strong>${esc(state.currentTicket)}</strong><p>تتم إدارة تفاصيل الزائر داخل المكتب فقط</p></div><div class="queue-next"><span>التالي</span><strong>${esc(next ? next.number : "—")}</strong></div></div>
            <div class="queue-actions"><button class="btn btn-primary btn-small" data-action="call-next" type="button">${icon("arrow")} استدعاء التالي</button><button class="btn btn-secondary btn-small" data-action="show-waiting" type="button">فتح شاشة العرض</button></div>
            <div class="queue-list">${state.queue.length ? state.queue.slice(0, 5).map((q) => `<div class="queue-row${q.priority ? " is-priority" : ""}"><span class="queue-number">${esc(q.number)}</span><div class="queue-copy"><strong>${esc(q.name)}</strong><span>${esc(q.department)}${q.priority ? " · أولوية" : ""}</span></div><time>${esc(q.time)}</time></div>`).join("") : `<div class="no-results">الطابور فارغ حالياً.</div>`}</div>
          </section>
          <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("file")}</span><div><h2>مسار التوقيعات</h2><p>محاكاة لحالة المستندات فقط — لا توقيع رقمي فعلي</p></div></div><span class="pill pill-amber">${toArabicNumber(unsigned.length)} بانتظار المراجعة</span></div><div class="queue-list">${state.documents.map((d) => `<div class="queue-row"><span class="request-type-icon">${icon("file")}</span><div class="queue-copy"><strong>${esc(d.name)}</strong><span>${esc(d.department)} · ${esc(d.status)}</span></div>${d.status === "بانتظار التوقيع" ? `<button class="btn btn-secondary btn-small" data-action="demo-sign" data-document-id="${esc(d.id)}" type="button">اعتماد تجريبي</button>` : `<span class="pill pill-green">تم</span>`}</div>`).join("")}</div><div class="blind-note" style="margin:0 17px 15px">الإقرار هنا يغيّر حالة العرض فقط؛ لا ينشئ توقيع PDF معتمداً أو ختمًا رقمياً.</div></section>
        </div>
        <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("calendar")}</span><div><h2>أجندة اليوم</h2><p>${dateLong()}</p></div></div><button class="link-button" data-action="open-appointment" type="button">إضافة ${icon("plus")}</button></div><div class="calendar-body"><div class="calendar-head"><strong>المواعيد القادمة</strong><span>${toArabicNumber(appointments.length)} بنود</span></div>${appointments.map((item) => `<div class="agenda-item"><div class="agenda-time">${esc(item.time)}</div><div class="agenda-event" style="border-color:${item.focus ? "#dfbd72" : "#a9d5c0"}"><strong>${esc(item.title)}</strong><span>${esc(item.detail)}</span></div></div>`).join("")}<div class="focus-card"><strong>${icon("target")} وقت تركيز محمي</strong><p>احجز فترة بلا مقاطعات للمهام المهمة وغير العاجلة.</p><button class="btn btn-secondary btn-small" data-action="open-focus" type="button">${icon("clock")} حجز وقت تركيز</button></div></div></section>
      </div>
      <div class="footer-caption">هذه الأدوات تحفظ عيّنات بيانات محلياً. الجدولة الفعلية وتوقيع المستندات تتطلب تكاملات خادمية معتمدة.</div>`, true);
  }

  function renderDecisions() {
    const query = normalizeArabic(state.decisionSearch);
    const decisions = state.decisions.filter((d) => !query || normalizeArabic(`${d.id} ${d.title} ${d.summary} ${d.category} ${d.owner}`).includes(query));
    return pageWrap(`${heading("سجل القرارات", "أرشيف تجريبي قابل للبحث للرجوع إلى القرارات السابقة ومنع التضارب.", `<button class="btn btn-primary" data-action="open-decision" type="button">${icon("plus")} تسجيل قرار</button>`)}
      <label class="filter-search" style="margin-bottom:14px">${icon("search")}<input id="decision-search" type="search" placeholder="ابحث عن قرار أو موضوع..." value="${esc(state.decisionSearch)}" autocomplete="off" /></label>
      <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("archive")}</span><div><h2>القرارات المحفوظة</h2><p>${toArabicNumber(decisions.length)} نتيجة</p></div></div><span class="pill pill-gray">تخزين محلي توضيحي</span></div><div class="decisions-list">${decisions.length ? decisions.map((d) => `<article class="decision-row"><div class="decision-number">${esc(d.id)}</div><div class="decision-copy"><strong>${esc(d.title)}</strong><p>${esc(d.summary)}</p></div><div class="decision-meta"><span class="pill pill-blue">${esc(d.category)}</span><span>${esc(d.date)}</span></div></article>`).join("") : `<div class="no-results">لا توجد قرارات مطابقة.</div>`}</div></section>`, true);
  }

  function renderDaily() {
    const open = state.requests.filter((r) => r.status !== "مكتمل");
    const urgent = open.filter((r) => r.quadrant === "q1");
    const completed = state.requests.filter((r) => r.status === "مكتمل");
    const signed = state.documents.filter((d) => d.status !== "بانتظار التوقيع");
    const deputyPending = state.requests.filter((r) => ["deputy-med", "deputy-admin", "doctor"].includes(r.assignee) && r.status !== "مكتمل");
    return pageWrap(`${heading("الموجز اليومي", "ملخص تنفيذي من بيانات العرض الحالية. اطبع الصفحة أو راجع عناصر المتابعة.", `<button class="btn btn-secondary" data-action="print-page" type="button">${icon("file")} طباعة الموجز</button>`)}
      <div class="digest-grid">
        <div style="display:grid;gap:15px">
          <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("report")}</span><div><h2>ملخص الحالة</h2><p>${dateLong()} · ${timeNow()}</p></div></div><span class="pill pill-green">محدّث الآن</span></div><div class="digest-summary"><div class="digest-summary-item critical"><span>أزمات عاجلة</span><strong>${toArabicNumber(urgent.length)}</strong></div><div class="digest-summary-item"><span>مكتملة</span><strong>${toArabicNumber(completed.length)}</strong></div><div class="digest-summary-item"><span>معلّقة</span><strong>${toArabicNumber(open.length)}</strong></div></div><div class="digest-list"><div class="digest-line"><span class="digest-line-icon">${icon("bellRing")}</span><div><strong>الأزمات العاجلة</strong><span>${urgent.length ? urgent.map((r) => esc(r.title)).join(" · ") : "لا توجد حالات عاجلة ظاهرة."}</span></div></div><div class="digest-line"><span class="digest-line-icon">${icon("users")}</span><div><strong>مهام لدى النواب</strong><span>${toArabicNumber(deputyPending.length)} معاملة لا تزال مفتوحة لدى النواب أو الطبيب المصرح.</span></div></div><div class="digest-line"><span class="digest-line-icon">${icon("file")}</span><div><strong>الأوراق الموقعة</strong><span>${toArabicNumber(signed.length)} مستند بحالة موقّع تجريبياً أو مكتمل في بيانات العرض.</span></div></div></div></section>
          <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("inbox")}</span><div><h2>قائمة المتابعة قبل نهاية اليوم</h2><p>الأولوية للطلبات العاجلة ثم المعلّقة</p></div></div></div><div class="decisions-list">${open.slice(0, 6).map((r) => `<div class="digest-line" style="padding:13px 18px;cursor:pointer" data-open-request="${esc(r.id)}"><span class="digest-line-icon">${icon(r.quadrant === "q1" ? "bellRing" : "file")}</span><div><strong>${esc(r.title)}</strong><span>${esc(r.department)} · ${esc(r.status)} · ${esc(roleShort(r.assignee))}</span></div></div>`).join("") || `<div class="no-results">لا توجد مهام مفتوحة.</div>`}</div></section>
        </div>
        <div style="display:grid;align-content:start;gap:15px">
          <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("sound")}</span><div><h2>تنبيهات صوتية محلية</h2><p>للمربع الأول فقط عند إضافة طلب عاجل</p></div></div></div><div class="action-panel-body"><p class="action-description">الصوت يعمل بعد تفعيل يدوي في هذا المتصفح. لا يرسل بيانات أو تنبيهاً إلى أجهزة أخرى.</p><button class="btn ${state.soundAlerts ? "btn-primary" : "btn-secondary"}" data-action="toggle-sound" type="button">${icon(state.soundAlerts ? "check" : "sound")}${state.soundAlerts ? "التنبيهات مفعّلة" : "تفعيل الصوت"}</button>${state.soundAlerts ? `<button class="btn btn-quiet btn-small" style="margin-right:8px" data-action="test-sound" type="button">تجربة</button>` : ""}</div></section>
          <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("spark")}</span><div><h2>ملخص نهاية اليوم</h2><p>صياغة آلية مبسطة من العينة</p></div></div></div><div class="digest-quote"><strong>للاطلاع التنفيذي</strong>تحتوي بيانات العرض على ${toArabicNumber(urgent.length)} معاملة عاجلة مفتوحة و${toArabicNumber(deputyPending.length)} لدى النواب. راجع المعاملات المرتبطة بسلامة الخدمة، ثم اعتمد ما يلزم أو حدّد موعد متابعة واضحاً.</div></section>
        </div>
      </div>`, true);
  }

  function renderEmployee() {
    const notices = state.notices.filter((n) => n.target === "all" || n.department === state.department).slice(0, 3);
    return `<div class="page-content"><div class="employee-wrap">${renderDemoNote()}${renderBusyBanner()}<div class="employee-hero"><h1>بوابة رئيس القسم</h1><p>سجّل المشكلة أو الاحتياج مرة واحدة، واحتفظ برقم متابعة. لا تعرض هذه الواجهة مسار الإحالة في نموذج العرض.</p><span class="employee-status"><span class="pulse-dot"></span>${isBusy() ? `المدير غير متفرغ حتى ${esc(formatDateTime(state.busyUntil))}` : "استقبلنا الطلبات عبر النظام"}</span></div>
      <section class="panel employee-form-panel"><div class="employee-form-heading"><h2>تسجيل طلب جديد</h2><p>أدخل المعلومات الضرورية فقط. لا ترفع بيانات تعريفية للمرضى في هذه النسخة التجريبية.</p></div><form class="form-stack" data-form="new-request"><div class="field-row"><div class="form-field"><label for="employee-department">القسم</label><select id="employee-department" name="department" required>${["العناية المركزة", "العمليات", "الطوارئ", "التمريض", "الشؤون الطبية", "الخدمات الهندسية", "الموارد البشرية", "الإدارة المالية", "المخازن", "مكتب الجودة", "العيادات الخارجية"].map((dep) => `<option${state.department === dep ? " selected" : ""}>${dep}</option>`).join("")}</select></div><div class="form-field"><label for="employee-requester">مقدم الطلب</label><input id="employee-requester" name="requester" value="${esc(ROLES.department.person)}" required /></div></div><div class="form-field"><label for="employee-title">عنوان الطلب</label><input id="employee-title" name="title" maxlength="120" placeholder="مثال: عطل يؤثر على تقديم الخدمة" required /></div><div class="form-field"><label for="employee-details">التفاصيل</label><textarea id="employee-details" name="details" maxlength="1500" placeholder="اكتب ملخصاً واضحاً، دون بيانات مرضى أو معلومات لا تلزم لمعالجة الطلب." required></textarea></div><div class="field-row"><div class="form-field"><label for="employee-importance">الأهمية</label><select id="employee-importance" name="importance"><option value="auto">يحددها النظام مبدئياً</option><option value="high">هام</option><option value="low">غير هام</option></select></div><div class="form-field"><label for="employee-urgency">الاستعجال</label><select id="employee-urgency" name="urgency"><option value="normal">عادي</option><option value="urgent">عاجل / يؤثر على سلامة الخدمة</option></select></div></div><label class="confidential-choice"><input type="checkbox" name="confidential" value="yes" /><span><strong>يتطلب مناقشة سرية أو حضوراً شخصياً</strong><span>سيُمنع الرد الكتابي في المحاكاة ويُقترح استدعاء شخصي؛ هذا لا يضمن منع التصوير أو التسريب في نظام ويب حقيقي.</span></span></label><div class="employee-submit"><span class="helper-text">لن يظهر لك مسؤول الإحالة في هذه الواجهة. رقم المتابعة لا يعني أن بياناتك معزولة خادمياً.</span><button class="btn btn-primary" type="submit">${icon("send")} إرسال الطلب</button></div></form></section>
      ${notices.length ? `<section class="panel" style="margin-top:15px"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("bell")}</span><div><h2>تنبيهات المكتب</h2><p>رسائل عامة في نموذج العرض</p></div></div></div>${notices.map((n) => `<div class="broadcast-item"><div><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p></div><time>${esc(n.time)}</time></div>`).join("")}</section>` : ""}
      <div class="footer-caption">النسخة الحالية لا تنفذ المصادقة أو سياسات العزل على مستوى قاعدة البيانات.</div></div></div>`;
  }

  function renderMyRequests() {
    const list = visibleRequests().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return `<div class="page-content"><div class="employee-wrap">${renderDemoNote()}${renderBusyBanner()}${heading("طلباتي والردود", `قسم ${esc(state.department)} · يمكنك متابعة الحالة ورسائل المكتب.`, `<button class="btn btn-primary" data-view="employee" type="button">${icon("plus")} طلب جديد</button>`)}
      <section class="panel"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("inbox")}</span><div><h2>معاملاتي</h2><p>${toArabicNumber(list.length)} طلب مسجل</p></div></div></div>${list.length ? list.map((r) => `<div class="my-request-row"><div><strong>${esc(r.title)}</strong><span>${esc(r.id)} · ${esc(r.time || r.date)} · ${r.confidential ? "مناقشة شخصية" : "متابعة رقمية"}</span></div><span class="status-text ${statusClass(r.status)}">${esc(r.status)}</span></div>`).join("") : `<div class="no-results">لا توجد طلبات بعد. ابدأ بتسجيل طلب جديد.</div>`}</section>
      <div class="blind-note">${icon("shield")} إذا استدعى الطلب مقابلة شخصية، سيظهر لك موعد المراجعة فقط دون رد كتابي. يرجى عدم استخدام بيانات حقيقية داخل هذا النموذج التوضيحي.</div>
      <section class="panel" style="margin-top:15px"><div class="panel-head"><div class="panel-title"><span class="title-icon">${icon("message")}</span><div><h2>رسائل المكتب</h2><p>التعاميم والاستدعاءات الظاهرة لهذا القسم</p></div></div></div>${state.notices.filter((n) => n.target === "all" || n.department === state.department).map((n) => `<div class="broadcast-item"><div><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p></div><time>${esc(n.time)}</time></div>`).join("") || `<div class="no-results">لا توجد رسائل حالياً.</div>`}</section></div></div>`;
  }

  function renderWaiting() {
    const next = state.queue[0];
    return `<main class="waiting-screen"><div class="waiting-top"><div class="waiting-brand"><span class="brand-mark">${icon("brand")}</span><strong>مستشفى النور التخصصي · صالة الانتظار</strong></div><button class="btn" data-action="exit-waiting" type="button">${icon("x")} إنهاء العرض</button></div><div class="waiting-label">الرقم الحالي</div><div class="waiting-number">${esc(state.currentTicket)}</div><div class="waiting-next"><span>يرجى الاستعداد · الرقم التالي</span><strong>${esc(next ? next.number : "—")}</strong></div><div class="waiting-message">يرجى متابعة الشاشة والتوجه إلى المكتب عند ظهور رقمك.</div><div class="waiting-clock">${dateLong()} · ${timeNow()}</div></main>`;
  }

  function renderModal() {
    if (!state.modal) return "";
    const { type } = state.modal;
    let content = "";
    let compact = false;
    if (type === "new-request") content = modalNewRequest();
    else if (type === "move-request") content = modalMoveRequest();
    else if (type === "request-details") content = modalRequestDetails();
    else if (type === "availability") { compact = true; content = modalAvailability(); }
    else if (type === "staff-contact") { compact = true; content = modalStaffContact(); }
    else if (type === "planner-task") { compact = true; content = modalPlannerTask(); }
    else if (type === "planner-estimate") { compact = true; content = modalPlannerEstimate(); }
    else if (type === "unexpected-task") { compact = true; content = modalUnexpectedTask(); }
    else if (type === "busy") { compact = true; content = modalBusy(); }
    else if (type === "summon") { compact = true; content = modalSummon(); }
    else if (type === "broadcast") { compact = true; content = modalBroadcast(); }
    else if (type === "queue-add") { compact = true; content = modalQueueAdd(); }
    else if (type === "decision") content = modalDecision();
    else if (type === "appointment") { compact = true; content = modalAppointment(false); }
    else if (type === "focus") { compact = true; content = modalAppointment(true); }
    if (!content) return "";
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal${compact ? " modal-compact" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title">${content}</section></div>`;
  }

  function modalHeader(title, sub = "") {
    return `<div class="modal-header"><div class="modal-header-copy"><h2 id="modal-title">${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div><button class="modal-close" data-action="close-modal" type="button" aria-label="إغلاق">${icon("x")}</button></div>`;
  }

  function modalNewRequest() {
    const deptOptions = ["العناية المركزة", "العمليات", "الطوارئ", "التمريض", "الشؤون الطبية", "الخدمات الهندسية", "الموارد البشرية", "الإدارة المالية", "المخازن", "مكتب الجودة", "العيادات الخارجية"];
    return `${modalHeader("إضافة معاملة", "بيانات عرض تجريبي — لا ترفق معلومات مرضى.")}<form data-form="new-request"><div class="modal-body"><div class="form-stack"><div class="field-row"><div class="form-field"><label for="new-department">القسم</label><select id="new-department" name="department" required>${deptOptions.map((d) => `<option${(state.role === "department" ? state.department : "العناية المركزة") === d ? " selected" : ""}>${d}</option>`).join("")}</select></div><div class="form-field"><label for="new-requester">مقدم الطلب</label><input id="new-requester" name="requester" value="${esc(ROLES[state.role].person)}" required /></div></div><div class="form-field"><label for="new-title">عنوان الطلب</label><input id="new-title" name="title" maxlength="120" placeholder="اكتب عنواناً مختصراً وواضحاً" required /></div><div class="form-field"><label for="new-details">التفاصيل</label><textarea id="new-details" name="details" maxlength="1500" placeholder="اشرح الحالة والإجراء المطلوب، دون معلومات تعريفية للمرضى." required></textarea></div><div class="field-row"><div class="form-field"><label for="new-importance">الأهمية</label><select id="new-importance" name="importance"><option value="auto">تحديد تلقائي مبدئي</option><option value="high">هام</option><option value="low">غير هام</option></select></div><div class="form-field"><label for="new-urgency">الاستعجال</label><select id="new-urgency" name="urgency"><option value="normal">عادي</option><option value="urgent">عاجل / يؤثر على سلامة الخدمة</option></select></div></div><label class="confidential-choice"><input type="checkbox" name="confidential" value="yes" /><span><strong>معاملة سرية — تتطلب مقابلة شخصية</strong><span>لن يظهر الرد الكتابي أو المرفقات في العرض؛ ميزة إخفاء البيانات ليست حماية فعلية.</span></span></label></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("send")} حفظ المعاملة</button></div></form>`;
  }

  function modalMoveRequest() {
    const request = state.requests.find((r) => r.id === state.modal.requestId);
    if (!request) return "";
    const current = qInfo(request.quadrant);
    return `${modalHeader("تعديل تصنيف المعاملة", "سيُحفظ النقل اليدوي كتفضيل محلي للطلبات المشابهة.")}<form data-form="move-request" data-request-id="${esc(request.id)}"><div class="modal-body"><div class="request-detail-header"><h3>${esc(request.title)}</h3><div class="request-detail-meta"><span>${esc(request.id)}</span><span>${esc(request.department)}</span><span>التصنيف الحالي: ${current.label}</span></div></div><div class="choice-list">${QUADRANTS.map((q) => `<label class="choice-option"><input type="radio" name="quadrant" value="${q.id}"${request.quadrant === q.id ? " checked" : ""} /><span><strong>${q.mark} · ${q.label}</strong><span>${q.action} — ${q.hint}</span></span></label>`).join("")}</div><div class="secret-warning">سيتعلم النموذج من كلمات الطلب والقسم على هذا الجهاز فقط. هذه القاعدة ليست نموذج تعلم مدققاً ولا تنتقل بين الأجهزة.</div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("check")} حفظ التعديل</button></div></form>`;
  }

  function modalRequestDetails() {
    const request = state.requests.find((r) => r.id === state.modal.requestId);
    if (!request) return `${modalHeader("المعاملة غير موجودة")}<div class="modal-body"><div class="no-results">تعذر العثور على هذه المعاملة في بيانات العرض.</div></div>`;
    const q = qInfo(request.quadrant);
    const isDepartment = state.role === "department";
    const isSecretary = state.role === "secretary";
    const canManage = state.role === "director" || state.role === request.assignee;
    const showBody = !isSecretary || !request.confidential;
    const isConfidential = request.confidential;
    const detailMessage = showBody ? `<p>${esc(request.body || "لا توجد تفاصيل إضافية مسجلة.")}</p>` : `<p>المعاملة سرية. تُخفى التفاصيل عن دور السكرتارية في هذا النموذج.</p>`;
    const canChange = canManage && !isDepartment;
    return `${modalHeader("تفاصيل المعاملة", `${esc(request.id)} · ${esc(request.department)}`)}<div class="modal-body"><div class="request-detail-header"><h3>${esc(request.title)}</h3><div class="request-detail-meta"><span>${esc(request.requester)}</span><span>${esc(request.time || request.date || "اليوم")}</span><span class="pill ${q.pill}">${q.label}</span>${isConfidential ? `<span class="confidential">${icon("lock")} سرية</span>` : ""}</div></div><div class="request-detail-body">${detailMessage}</div><div class="detail-grid"><div class="detail-info"><span>الحالة</span><strong>${esc(request.status)}</strong></div><div class="detail-info"><span>جهة المتابعة</span><strong>${esc(roleName(request.assignee))}</strong></div></div>${request.learned ? `<div class="learning-label">${icon("spark")} تم اقتراح التصنيف بناءً على تعديل سابق</div>` : ""}${isConfidential ? `<div class="secret-warning">${icon("lock")} معاملة حساسة: يمنع هذا النموذج عرض الرد الكتابي أو الملفات. استخدم الاستدعاء الشخصي. لا يمكن لواجهة ويب منع لقطات الشاشة أو ضمان السرية.</div>` : ""}${canChange ? `<div class="form-stack" style="margin-top:15px"><div class="field-row"><button class="btn btn-secondary" data-action="move-request" data-request-id="${esc(request.id)}" type="button">${icon("grid")} تغيير المربع</button><form data-form="assign-request" data-request-id="${esc(request.id)}" style="display:flex;gap:7px"><select class="filter-select" name="assignee" aria-label="جهة الإحالة">${["director", "deputy-med", "deputy-admin", "doctor", "secretary"].map((id) => `<option value="${id}"${request.assignee === id ? " selected" : ""}>${esc(roleName(id))}</option>`).join("")}</select><button class="btn btn-secondary btn-small" type="submit">إحالة</button></form></div></div>` : ""}${isConfidential && canChange && request.status !== "مكتمل" ? `<div style="margin-top:14px"><button class="btn btn-danger btn-block" data-action="summon-request" data-request-id="${esc(request.id)}" type="button">${icon("phone")} استدعاء شخصي — بلا رد كتابي</button></div>` : ""}${!isConfidential && canManage && request.status !== "مكتمل" ? `<form data-form="reply-request" data-request-id="${esc(request.id)}" class="form-stack" style="margin-top:15px"><div class="form-field"><label for="reply-text">رد أو ملاحظة المتابعة</label><textarea id="reply-text" name="reply" maxlength="900" placeholder="اكتب ملخص الإجراء أو المطلوب من القسم..." required></textarea></div><button class="btn btn-primary" type="submit">${icon("send")} إرسال الرد وتحديث الحالة</button></form>` : ""}${request.response ? `<div class="digest-quote" style="margin:15px 0 0"><strong>آخر رد مسجل</strong>${esc(request.response)}</div>` : ""}</div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إغلاق</button></div>`;
  }

  function modalAvailability() {
    const person = currentPerson();
    const presence = presenceFor(person.id);
    return `${modalHeader("تحديث حالة التواجد", "اختر مدة الغياب ومكان عمل عام حتى لا يتحرك أحد لمكانك دون داعٍ.")}<form data-form="availability"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="presence-status">حالتي</label><select id="presence-status" name="status"><option value="available"${presence.status === "available" ? " selected" : ""}>متاح في مكان العمل</option><option value="away"${presence.status === "away" ? " selected" : ""}>غائب مؤقتاً عن مكتبي</option><option value="offsite"${presence.status === "offsite" ? " selected" : ""}>في قسم أو موقع آخر</option><option value="remote"${presence.status === "remote" ? " selected" : ""}>متاح عن بُعد</option></select></div><div class="form-field"><label for="presence-place">مكان العمل العام (لا تكتب عنوان المنزل)</label><input id="presence-place" name="place" maxlength="90" value="${esc(presence.place || "")}" placeholder="مثال: مخزن الدور الثاني أو خارج المستشفى" required /></div><div class="form-field"><label for="presence-return">وقت العودة المتوقع عند الغياب</label><input id="presence-return" name="returnAt" type="datetime-local" min="${localDateTimeValue(0)}" value="${presence.returnAt ? esc(toLocalDateTimeInput(presence.returnAt)) : localDateTimeValue(45)}" /></div><div class="form-field"><label for="presence-note">ملاحظة اختيارية</label><input id="presence-note" name="note" maxlength="100" value="${esc(presence.note || "")}" placeholder="مثال: متاح عبر التطبيق" /></div><div class="secret-warning">إذا اخترت الغياب أو الخروج، يجب إدخال وقت عودة. مشاركة المكان اختيارية ومقصورة على وصف العمل، دون تتبع GPS.</div></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("check")} حفظ التواجد</button></div></form>`;
  }

  function toLocalDateTimeInput(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  function modalStaffContact() {
    const kind = state.modal.recipientKind || "staff";
    const id = state.modal.recipientId || "";
    const person = personById(kind, id);
    if (!person) return `${modalHeader("المستلم غير موجود")}<div class="modal-body"><div class="no-results">تعذر العثور على الموظف في بيانات العرض.</div></div>`;
    const presence = presenceFor(id);
    const sender = currentPerson();
    const modalTitle = kind === "leader" && !LEADER_IDS.includes(sender?.id) ? "مراسلة المدير أو النائب" : "طلب معلومة أو مستند";
    return `${modalHeader(modalTitle, `إلى ${esc(person.name)} · ${presenceLabel(presence.status)} · ${esc(presence.place || "مكان غير محدد")}`)}<form data-form="staff-contact" data-recipient-kind="${kind}" data-recipient-id="${esc(id)}"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="staff-request-kind">نوع الطلب</label><select id="staff-request-kind" name="kind"><option value="info">معلومة أو إفادة</option><option value="document">ورقة أو مستند</option><option value="attendance">طلب تواصل أو حضور</option></select></div><div class="form-field"><label for="staff-request-title">عنوان قصير</label><input id="staff-request-title" name="title" maxlength="100" required placeholder="مثال: أحتاج نسخة من محضر اليوم" /></div><div class="form-field"><label for="staff-request-message">التفاصيل</label><textarea id="staff-request-message" name="message" maxlength="500" required placeholder="اكتب المطلوب والسبب، دون بيانات مرضى أو معلومات شديدة الحساسية."></textarea></div><div class="field-row"><div class="form-field"><label for="staff-request-due">الموعد المطلوب (اختياري)</label><input id="staff-request-due" name="dueAt" type="datetime-local" /></div><div class="form-field"><label for="staff-request-priority">الأولوية</label><select id="staff-request-priority" name="priority"><option value="normal">عادي</option><option value="urgent">عاجل</option></select></div></div><div class="secret-warning">إذا كان الموظف خارج شبكة المستشفى، وصوله من المنزل يتطلب VPN المستشفى أو قناة معتمدة. هذا طلب نصي محلي فقط: لا رفع ملفات ولا إرسال إشعار لهاتف فعلي؛ لا تكتب بيانات حساسة.</div></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("send")} إرسال الطلب</button></div></form>`;
  }

  function modalPlannerTask() {
    const selectedDate = state.weekPlan?.days?.[1]?.date || localDayKey(new Date(Date.now() + 86400000));
    return `${modalHeader("إضافة مهمة إلى الخطة", "قدّر حجمها بوحدات نصف ساعة، واختر أول يوم يسمح ببدئها.")}<form data-form="planner-task"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="plan-task-title">اسم المهمة</label><input id="plan-task-title" name="title" maxlength="120" required placeholder="مثال: مراجعة خطة تطوير قسم العمليات" /></div><div class="field-row"><div class="form-field"><label for="plan-task-quadrant">الأولوية</label><select id="plan-task-quadrant" name="quadrant"><option value="q1">هام وعاجل</option><option value="q3">غير هام وعاجل · يفوّض</option><option value="q2" selected>هام وغير عاجل</option></select></div><div class="form-field"><label for="plan-task-units">الحجم (وحدات ٣٠ دقيقة)</label><select id="plan-task-units" name="units">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}"${n === 2 ? " selected" : ""}>${toArabicNumber(n)} · ${toArabicNumber(n * 30)} دقيقة</option>`).join("")}</select></div></div><div class="form-field"><label for="plan-task-date">يبدأ في</label><select id="plan-task-date" name="dueDate">${(state.weekPlan?.days || []).slice(0, 8).map((day) => `<option value="${day.date}"${day.date === selectedDate ? " selected" : ""}>${esc(day.label)} · ${esc(new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short" }).format(dayFromKey(day.date)))}</option>`).join("")}</select></div></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("calendar")} إضافة للخطة</button></div></form>`;
  }

  function modalPlannerEstimate() {
    const { taskId, sourceType } = state.modal || {};
    const task = sourceType === "request" ? state.requests.find((item) => item.id === taskId) : state.plannerTasks.find((item) => item.id === taskId);
    if (!task) return `${modalHeader("المهمة غير موجودة")}<div class="modal-body"><div class="no-results">تعذر العثور على المهمة.</div></div>`;
    const units = Number(task.estimatedUnits || task.units) || plannerTasks().find((candidate) => candidate.id === taskId)?.units || 2;
    return `${modalHeader("تعديل وقت المهمة", esc(task.title))}<form data-form="planner-estimate" data-task-id="${esc(taskId)}" data-source-type="${sourceType}"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="estimate-units">التقدير بوحدات نصف ساعة</label><select id="estimate-units" name="units">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}"${units === n ? " selected" : ""}>${toArabicNumber(n)} وحدة · ${plannerDuration(n)}</option>`).join("")}</select></div><div class="secret-warning">غيّر التقدير إذا احتاجت المهمة وقتاً أكثر أو أقل. سيُعاد توزيع المهام الأخرى تلقائياً حسب الأولوية.</div></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("clock")} تحديث التقدير</button></div></form>`;
  }

  function modalUnexpectedTask() {
    return `${modalHeader("إضافة مهمة طارئة", "تُعطى أولوية الآن؛ ويُعاد دفع الأقل أولوية إلى الأيام التالية عند الحاجة.")}<form data-form="unexpected-task"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="unexpected-title">ما المهمة غير المخططة؟</label><input id="unexpected-title" name="title" maxlength="120" required placeholder="مثال: اجتماع عاجل مع فريق التشغيل" /></div><div class="form-field"><label for="unexpected-units">الوقت المتوقع</label><select id="unexpected-units" name="units"><option value="1">وحدة واحدة · ٣٠ دقيقة</option><option value="2" selected>وحدتان · ساعة</option><option value="3">٣ وحدات · ساعة ونصف</option><option value="4">٤ وحدات · ساعتان</option></select></div><div class="secret-warning">يُستهلك الطارئ من هامش الوقت أولاً، ثم تُرحّل الأعمال الأقل أولوية تلقائياً. راجع الجدول بعد الإضافة.</div></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-danger" type="submit">${icon("bellRing")} إدراج الطارئ وإعادة الترتيب</button></div></form>`;
  }

  function modalBusy() {
    return `${modalHeader("تحديد حالة عدم التفرغ", "يلزم تحديد وقت نهاية واضح حتى يظهر للموظفين.")}<form data-form="busy"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="busy-end">وقت العودة المتوقع</label><input id="busy-end" name="until" type="datetime-local" min="${localDateTimeValue(0)}" value="${localDateTimeValue(120)}" required /></div><div class="form-field"><label for="busy-reason">السبب (اختياري)</label><input id="busy-reason" name="reason" maxlength="100" placeholder="مثال: اجتماع لجنة التشغيل" value="${esc(state.busyReason)}" /></div><span class="helper-text">في النظام الإنتاجي يجب بث التغيير فورياً إلى الأجهزة عبر قناة موثوقة. هذه النسخة تحفظه في المتصفح فقط.</span></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("clock")} تفعيل حتى وقت العودة</button></div></form>`;
  }

  function modalSummon() {
    const request = state.modal.requestId ? state.requests.find((r) => r.id === state.modal.requestId) : null;
    return `${modalHeader(request ? "استدعاء صاحب المعاملة" : "نداء مباشر", request ? `معاملة ${esc(request.id)} · لا ترسل تفاصيل مكتوبة` : "اختر شخصاً أو قسماً للحضور إلى المكتب.")}<form data-form="summon" data-request-id="${request ? esc(request.id) : ""}"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="summon-target">المستلم</label><select id="summon-target" name="target" required><option value="رئيس قسم العناية المركزة"${request?.department === "العناية المركزة" ? " selected" : ""}>رئيس قسم العناية المركزة</option><option value="رئيس قسم العمليات"${request?.department === "العمليات" ? " selected" : ""}>رئيس قسم العمليات</option><option value="رئيس قسم الطوارئ">رئيس قسم الطوارئ</option><option value="النائب الأول للشؤون الطبية">النائب الأول للشؤون الطبية</option><option value="النائب الثاني للشؤون الإدارية">النائب الثاني للشؤون الإدارية</option><option value="الطبيب المصرح">الطبيب المصرح</option><option value="السكرتير التنفيذي">السكرتير التنفيذي</option></select></div><div class="form-field"><label for="summon-time">موعد الحضور</label><select id="summon-time" name="time"><option value="فوراً">فوراً</option><option value="خلال ١٥ دقيقة">خلال ١٥ دقيقة</option><option value="خلال ٣٠ دقيقة">خلال ٣٠ دقيقة</option><option value="عند مراجعة السكرتارية">عند مراجعة السكرتارية</option></select></div><div class="form-field"><label for="summon-message">نص الاستدعاء</label><textarea id="summon-message" name="message" maxlength="250" required>${request ? "يرجى الحضور إلى المكتب لمناقشة المعاملة بسرية. لا تُرسل تفاصيل عبر التطبيق." : "يرجى الحضور إلى مكتب الإدارة."}</textarea></div><div class="secret-warning">لن تُرسل رسالة فعلية على الهاتف في هذا النموذج. لا تُدرج معلومات طبية أو سرية في نص الاستدعاء.</div></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("phone")} تسجيل الاستدعاء</button></div></form>`;
  }

  function modalBroadcast() {
    return `${modalHeader("تعميم أو تنبيه", "سيظهر في سجل هذا المتصفح فقط، وليس على أجهزة الأقسام.")}<form data-form="broadcast"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="broadcast-title">عنوان التنبيه</label><input id="broadcast-title" name="title" maxlength="100" required placeholder="عنوان واضح ومختصر" /></div><div class="form-field"><label for="broadcast-message">نص الرسالة</label><textarea id="broadcast-message" name="message" maxlength="700" required placeholder="تجنب إدراج معلومات سرية أو بيانات مرضى."></textarea></div><div class="form-field"><label for="broadcast-target">المستلمون</label><select id="broadcast-target" name="department"><option value="all">كل رؤساء الأقسام</option>${["العناية المركزة", "العمليات", "الطوارئ", "التمريض", "الشؤون الطبية", "الخدمات الهندسية", "الموارد البشرية", "الإدارة المالية", "المخازن", "مكتب الجودة"].map((d) => `<option>${d}</option>`).join("")}</select></div></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("send")} حفظ التعميم</button></div></form>`;
  }

  function modalQueueAdd() {
    return `${modalHeader("إضافة موعد إلى الطابور", "يعرض التلفزيون رقم الانتظار فقط دون تفاصيل شخصية.")}<form data-form="queue-add"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="queue-name">اسم الزائر داخل لوحة السكرتارية</label><input id="queue-name" name="name" maxlength="80" required /></div><div class="form-field"><label for="queue-department">القسم أو الجهة</label><input id="queue-department" name="department" maxlength="70" required /></div><label class="confidential-choice"><input type="checkbox" name="priority" value="yes" /><span><strong>أولوية زيارة</strong><span>تظهر الأولوية لموظف السكرتارية فقط.</span></span></label></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("plus")} إضافة للطابور</button></div></form>`;
  }

  function modalDecision() {
    return `${modalHeader("تسجيل قرار", "أضف ملخصاً قابلاً للبحث دون تخزين معلومات سرية.")}<form data-form="decision"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="decision-title">عنوان القرار</label><input id="decision-title" name="title" maxlength="130" required /></div><div class="form-field"><label for="decision-summary">الملخص أو التوجيه</label><textarea id="decision-summary" name="summary" maxlength="800" required></textarea></div><div class="field-row"><div class="form-field"><label for="decision-category">التصنيف</label><select id="decision-category" name="category"><option>تشغيل</option><option>شؤون طبية</option><option>إدارية ومالية</option><option>موارد بشرية</option><option>جودة</option></select></div><div class="form-field"><label for="decision-owner">صاحب القرار</label><input id="decision-owner" name="owner" value="${esc(ROLES[state.role].person)}" required /></div></div></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("check")} حفظ القرار</button></div></form>`;
  }

  function modalAppointment(focus) {
    return `${modalHeader(focus ? "حجز وقت تركيز" : "إضافة موعد", focus ? "احمِ وقتاً للعمل العميق دون اجتماعات." : "أضف بنداً إلى أجندة العرض المحلية.")}<form data-form="appointment" data-focus="${focus ? "yes" : "no"}"><div class="modal-body"><div class="form-stack"><div class="form-field"><label for="appointment-title">${focus ? "عنوان المهمة" : "عنوان الموعد"}</label><input id="appointment-title" name="title" maxlength="100" value="${focus ? "وقت تركيز محمي" : ""}" required /></div><div class="field-row"><div class="form-field"><label for="appointment-time">الوقت</label><input id="appointment-time" name="time" type="time" required /></div><div class="form-field"><label for="appointment-detail">المكان أو التفاصيل</label><input id="appointment-detail" name="detail" maxlength="100" placeholder="قاعة الاجتماعات" /></div></div></div></div><div class="modal-footer"><span class="spacer"></span><button class="btn btn-secondary" data-action="close-modal" type="button">إلغاء</button><button class="btn btn-primary" type="submit">${icon("calendar")} حفظ في الأجندة</button></div></form>`;
  }

  function render() {
    if (state.role === "waiting" || state.view === "waiting") {
      $app.innerHTML = renderWaiting();
      return;
    }
    const view = state.view;
    let content;
    if (view === "matrix") content = renderMatrixPage();
    else if (view === "requests") content = renderRequestsPage();
    else if (view === "communications") content = renderCommunications();
    else if (view === "secretary") content = renderSecretary();
    else if (view === "decisions") content = renderDecisions();
    else if (view === "daily") content = renderDaily();
    else if (view === "planner") content = renderPlanner();
    else if (view === "presence") content = renderPresencePage();
    else if (view === "my-presence") content = renderMyPresence();
    else if (view === "staff-inbox") content = renderStaffInbox();
    else if (view === "employee") content = renderEmployee();
    else if (view === "my-requests") content = renderMyRequests();
    else content = renderDashboard();
    $app.innerHTML = `<div class="app-shell">${renderSidebar()}<main class="main">${renderHeader()}${renderAvailabilityStrip()}${content}</main></div>${renderModal()}`;
    if (state.menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }

  function openRequest(requestId) {
    if (!state.requests.some((r) => r.id === requestId)) return;
    state.modal = { type: "request-details", requestId };
    render();
  }

  function openMove(requestId) {
    state.modal = { type: "move-request", requestId };
    render();
  }

  function createNewRequest(formData) {
    const department = String(formData.get("department") || state.department).trim();
    const title = String(formData.get("title") || "").trim();
    const details = String(formData.get("details") || "").trim();
    if (!title || !details) return showToast("أدخل عنوان الطلب وتفاصيله.", true);
    const data = {
      department,
      title,
      details,
      importance: String(formData.get("importance") || "auto"),
      urgency: String(formData.get("urgency") || "normal"),
    };
    const classification = classifyRequest(data);
    const idNumber = Math.max(185, ...state.requests.map((r) => Number((r.id.match(/\d+/) || ["0"])[0]) + 1));
    const request = {
      id: `RF-${idNumber}`,
      title,
      department,
      requester: String(formData.get("requester") || ROLES[state.role].person).trim(),
      time: timeNow(),
      date: "اليوم",
      quadrant: classification.quadrant,
      status: "جديد",
      assignee: suggestedAssignee(data, classification.quadrant),
      confidential: formData.get("confidential") === "yes",
      body: details,
      authorRole: state.role === "department" ? "department" : state.role,
      learned: classification.learned,
      createdAt: Date.now(),
    };
    state.requests.unshift(request);
    if (state.role === "department") state.department = department;
    if (state.weekPlan) refreshWeekPlan();
    save();
    state.modal = null;
    if (state.role === "department") state.view = "my-requests";
    render();
    showToast(`تم تسجيل الطلب ${request.id} · ${request.confidential ? "بانتظار ترتيب مقابلة شخصية" : `تصنيف أولي: ${qInfo(request.quadrant).label}`}`);
    if (request.quadrant === "q1") playUrgentTone();
  }

  function handleFormSubmit(form) {
    const data = new FormData(form);
    const kind = form.dataset.form;
    if (kind === "new-request") {
      createNewRequest(data);
      return;
    }
    if (kind === "availability") {
      const person = currentPerson();
      const status = String(data.get("status") || "available");
      const place = String(data.get("place") || "").trim();
      const returnValue = String(data.get("returnAt") || "");
      const returnDate = returnValue ? new Date(returnValue) : null;
      if (!place) return showToast("اكتب مكان عمل عاماً أو اسم القسم.", true);
      if (status !== "available" && (!returnDate || Number.isNaN(returnDate.getTime()) || returnDate.getTime() <= Date.now())) return showToast("أدخل وقت عودة لاحقاً للوقت الحالي.", true);
      const previous = state.availability[person.id] || {};
      state.availability[person.id] = { status, place, returnAt: status === "available" ? null : returnDate.toISOString(), returnPlace: status === "available" ? null : (previous.status === "available" ? previous.place : previous.returnPlace || "مكتب العمل"), note: String(data.get("note") || "").trim(), updatedAt: Date.now() };
      if (state.role === "director") { state.busyUntil = null; state.busyReason = ""; }
      save();
      state.modal = null;
      render();
      showToast("تم تحديث التواجد في هذا المتصفح فقط.");
      return;
    }
    if (kind === "staff-contact") {
      const recipientKind = form.dataset.recipientKind || "staff";
      const recipientId = form.dataset.recipientId || "";
      const recipient = personById(recipientKind, recipientId);
      const sender = currentPerson();
      const title = String(data.get("title") || "").trim();
      const message = String(data.get("message") || "").trim();
      const dueValue = String(data.get("dueAt") || "");
      const dueDate = dueValue ? new Date(dueValue) : null;
      if (!recipient || !title || !message) return showToast("اختر مستلماً واكتب العنوان والتفاصيل.", true);
      if (dueValue && (!dueDate || Number.isNaN(dueDate.getTime()) || dueDate.getTime() <= Date.now())) return showToast("اختر موعداً لاحقاً للوقت الحالي.", true);
      const staffRequest = { id: `SR-${Date.now()}`, kind: String(data.get("kind") || "info"), title, message, priority: String(data.get("priority") || "normal"), requesterId: sender.id, requesterKind: sender.kind || "staff", requester: sender.name, recipientId, recipientKind, recipient: recipient.name, dueAt: dueDate ? dueDate.toISOString() : null, status: "جديد", response: "", createdAt: Date.now(), time: timeNow() };
      state.staffRequests.unshift(staffRequest);
      save();
      state.modal = null;
      render();
      showToast("تم تسجيل الطلب في هذا المتصفح. لم يُرسل تنبيه حقيقي.");
      return;
    }
    if (kind === "staff-reply") {
      const item = state.staffRequests.find((request) => request.id === form.dataset.staffRequestId);
      const response = String(data.get("response") || "").trim();
      if (!item || !response) return showToast("اكتب الرد أو مكان تسليم الورقة.", true);
      item.response = response;
      item.status = "مكتمل";
      item.respondedAt = Date.now();
      item.respondedBy = currentPerson()?.name || "الموظف";
      save();
      render();
      showToast("تم حفظ الرد في بيانات العرض المحلية.");
      return;
    }
    if (kind === "planner-prefs") {
      const hours = Number(data.get("workdayHours"));
      const units = Number(data.get("bufferUnits"));
      const startTime = String(data.get("startTime") || "09:00");
      if (!hours || !/^\d{2}:\d{2}$/.test(startTime)) return showToast("تحقق من ساعات العمل ووقت البدء.", true);
      state.plannerPrefs = { workdayHours: hours, bufferUnits: Math.min(units, Math.max(1, hours * 2 - 1)), startTime };
      refreshWeekPlan();
      save();
      render();
      showToast("أُعيد بناء خطة اليوم والأسبوع بالإعدادات الجديدة.");
      return;
    }
    if (kind === "planner-estimate") {
      const taskId = form.dataset.taskId;
      const units = Math.max(1, Math.min(6, Number(data.get("units")) || 1));
      if (form.dataset.sourceType === "request") {
        const request = state.requests.find((item) => item.id === taskId);
        if (request) request.estimatedUnits = units;
      } else {
        const task = state.plannerTasks.find((item) => item.id === taskId);
        if (task) task.units = units;
      }
      refreshWeekPlan(); save(); state.modal = null; render(); showToast("تم تحديث تقدير الوقت وإعادة توزيع الخطة.");
      return;
    }
    if (kind === "planner-task" || kind === "unexpected-task") {
      const title = String(data.get("title") || "").trim();
      if (!title) return showToast("اكتب اسم المهمة.", true);
      const unexpected = kind === "unexpected-task";
      const task = { id: `PT-${Date.now()}`, title, quadrant: unexpected ? "q1" : String(data.get("quadrant") || "q2"), units: Math.max(1, Number(data.get("units")) || 1), dueDate: unexpected ? localDayKey() : String(data.get("dueDate") || localDayKey()), status: "مفتوحة", urgent: unexpected, createdAt: Date.now() };
      state.plannerTasks.push(task);
      refreshWeekPlan();
      save();
      state.modal = null;
      render();
      showToast(unexpected ? "أُدرجت المهمة الطارئة وأعيد ترتيب الخطة وفق الأولوية." : "أضيفت المهمة إلى الخطة.");
      return;
    }
    if (kind === "move-request") {
      const request = state.requests.find((r) => r.id === form.dataset.requestId);
      const newQuadrant = String(data.get("quadrant") || "");
      if (!request || !QUADRANTS.some((q) => q.id === newQuadrant)) return;
      if (request.quadrant !== newQuadrant) {
        const before = request.quadrant;
        const keyWords = keywords(`${request.title} ${request.body || ""}`);
        state.overrides.push({ department: request.department, keywords: keyWords, from: before, to: newQuadrant, createdAt: Date.now() });
        request.quadrant = newQuadrant;
        request.learned = false;
        request.updatedAt = Date.now();
        if (state.weekPlan) refreshWeekPlan();
        save();
        state.modal = null;
        render();
        showToast(`حُفظ التعديل. الطلبات المشابهة من ${request.department} ستقترح «${qInfo(newQuadrant).label}».`);
      } else {
        state.modal = null;
        render();
        showToast("التصنيف لم يتغير.");
      }
      return;
    }
    if (kind === "assign-request") {
      const request = state.requests.find((r) => r.id === form.dataset.requestId);
      if (!request) return;
      request.assignee = String(data.get("assignee") || request.assignee);
      request.status = request.status === "جديد" ? "مُحال للنائب" : request.status;
      save();
      state.modal = null;
      render();
      showToast(`تم تحديث جهة المتابعة للمعاملة ${request.id}.`);
      return;
    }
    if (kind === "reply-request") {
      const request = state.requests.find((r) => r.id === form.dataset.requestId);
      if (!request || request.confidential) return showToast("المعاملات السرية لا تقبل رداً كتابياً.", true);
      request.response = String(data.get("reply") || "").trim();
      request.status = "بانتظار القسم";
      request.respondedAt = Date.now();
      pushNotice({ type: "reply", title: `رد على المعاملة ${request.id}`, message: request.response, target: "department", department: request.department });
      state.modal = null;
      render();
      showToast("تم حفظ الرد وتحديث حالة الطلب في المحاكاة.");
      return;
    }
    if (kind === "busy") {
      const endValue = String(data.get("until") || "");
      const end = new Date(endValue);
      if (!endValue || Number.isNaN(end.getTime()) || end.getTime() <= Date.now()) return showToast("اختر وقت عودة لاحقاً للوقت الحالي.", true);
      state.busyUntil = end.toISOString();
      state.busyReason = String(data.get("reason") || "").trim();
      save();
      state.modal = null;
      render();
      showToast(`تم ضبط حالة عدم التفرغ حتى ${formatDateTime(state.busyUntil)} في هذا العرض.`);
      return;
    }
    if (kind === "summon") {
      const target = String(data.get("target") || "");
      const when = String(data.get("time") || "فوراً");
      const message = String(data.get("message") || "").trim();
      const requestId = form.dataset.requestId;
      const request = requestId ? state.requests.find((r) => r.id === requestId) : null;
      if (request) request.status = "موعد مقابلة";
      pushNotice({ type: "summon", title: `استدعاء شخصي${request ? ` · ${request.id}` : ""}`, message: `${message} الموعد: ${when}.`, target, department: request?.department || "", confidential: !!request?.confidential });
      state.modal = null;
      render();
      showToast(`سُجّل استدعاء ${target} في بيانات العرض. لم يُرسل إشعار فعلي.`);
      return;
    }
    if (kind === "broadcast") {
      const title = String(data.get("title") || "").trim();
      const message = String(data.get("message") || "").trim();
      const department = String(data.get("department") || "all");
      pushNotice({ type: "broadcast", title, message, target: department === "all" ? "all" : "department", department: department === "all" ? "" : department });
      state.modal = null;
      render();
      showToast("تم حفظ التعميم في المتصفح. لا يوجد إرسال متعدد الأجهزة في هذه النسخة.");
      return;
    }
    if (kind === "queue-add") {
      const serials = state.queue.map((q) => Number((q.number.match(/\d+/) || ["10"])[0]));
      const nextNo = Math.max(10, ...serials) + 1;
      state.queue.push({ number: `و-${new Intl.NumberFormat("ar-EG").format(nextNo)}`, name: String(data.get("name") || "").trim(), department: String(data.get("department") || "").trim(), time: timeNow(), priority: data.get("priority") === "yes" });
      save();
      state.modal = null;
      render();
      showToast("أضيف الموعد إلى طابور العرض.");
      return;
    }
    if (kind === "decision") {
      const next = Math.max(1, ...state.decisions.map((d) => Number((d.id.match(/\d+/) || ["0"])[0]) + 1));
      state.decisions.unshift({ id: `ق-${next}`, title: String(data.get("title") || "").trim(), summary: String(data.get("summary") || "").trim(), category: String(data.get("category") || "تشغيل"), date: dateLong(), owner: String(data.get("owner") || ROLES[state.role].person).trim() });
      save();
      state.modal = null;
      render();
      showToast("حُفظ القرار في الأرشيف المحلي.");
      return;
    }
    if (kind === "appointment") {
      const rawTime = String(data.get("time") || "");
      const [hh, mm] = rawTime.split(":").map(Number);
      const time = Number.isFinite(hh) ? new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(new Date(2000, 0, 1, hh, mm || 0)) : rawTime;
      const focus = form.dataset.focus === "yes";
      state.agenda.push({ time, title: String(data.get("title") || "").trim(), detail: String(data.get("detail") || (focus ? "وقت تركيز محمي" : "موعد مكتبي")).trim(), focus });
      state.agenda.sort((a, b) => a.time.localeCompare(b.time, "ar"));
      save();
      state.modal = null;
      render();
      showToast(focus ? "حُجز وقت تركيز في الأجندة المحلية." : "أضيف الموعد إلى الأجندة المحلية.");
    }
  }

  function handleAction(action, element) {
    const requestId = element.dataset.requestId;
    if (action === "menu-toggle") { state.menuOpen = !state.menuOpen; render(); }
    else if (action === "close-menu") { state.menuOpen = false; render(); }
    else if (action === "open-new-request" || action === "new-request") {
      if (state.role === "department") setView("employee");
      else { state.modal = { type: "new-request" }; render(); }
    }
    else if (action === "open-busy") { state.modal = { type: "busy" }; render(); }
    else if (action === "update-presence") { state.modal = { type: "availability" }; render(); }
    else if (action === "contact-person") { state.modal = { type: "staff-contact", recipientKind: element.dataset.personKind || "staff", recipientId: element.dataset.personId || "" }; render(); }
    else if (action === "open-planner-task") { state.modal = { type: "planner-task" }; render(); }
    else if (action === "estimate-plan-task") { state.modal = { type: "planner-estimate", taskId: element.dataset.taskId, sourceType: element.dataset.sourceType }; render(); }
    else if (action === "open-unexpected-task") { state.modal = { type: "unexpected-task" }; render(); }
    else if (action === "refresh-plan") { refreshWeekPlan(); save(); render(); showToast("أعيد ترتيب الخطة: الهام والعاجل أولاً ثم ما يمكن تفويضه."); }
    else if (action === "complete-plan-task") {
      const id = element.dataset.taskId;
      if (element.dataset.sourceType === "request") {
        const request = state.requests.find((item) => item.id === id);
        if (request) { request.status = "مكتمل"; request.completedAt = Date.now(); }
      } else {
        const task = state.plannerTasks.find((item) => item.id === id);
        if (task) { task.status = "مكتمل"; task.completedAt = Date.now(); }
      }
      refreshWeekPlan(); save(); render(); showToast("تم إنهاء المهمة وإعادة حساب الوقت المتاح.");
    }
    else if (action === "set-available") { state.busyUntil = null; state.busyReason = ""; save(); state.modal = null; render(); showToast("تم إنهاء حالة عدم التفرغ في هذا العرض."); }
    else if (action === "open-summon") { state.modal = { type: "summon" }; render(); }
    else if (action === "summon-request") { state.modal = { type: "summon", requestId }; render(); }
    else if (action === "open-broadcast") { state.modal = { type: "broadcast" }; render(); }
    else if (action === "open-communications") setView(state.role === "department" ? "my-requests" : state.role === "employee" ? "staff-inbox" : "communications");
    else if (action === "move-request") openMove(requestId);
    else if (action === "open-request") openRequest(requestId);
    else if (action === "close-modal") { state.modal = null; render(); }
    else if (action === "backdrop-close" && element.classList.contains("modal-backdrop")) { state.modal = null; render(); }
    else if (action === "open-queue-add") { state.modal = { type: "queue-add" }; render(); }
    else if (action === "call-next") {
      if (!state.queue.length) return showToast("لا يوجد زوار في الطابور.");
      const next = state.queue.shift();
      state.currentTicket = next.number;
      save(); render(); showToast(`تم استدعاء الرقم ${next.number} إلى المكتب.`);
    }
    else if (action === "show-waiting") { state.savedRole = state.role; state.role = "waiting"; save(); render(); }
    else if (action === "exit-waiting") { state.role = ROLE_IDS.includes(state.savedRole) && state.savedRole !== "waiting" ? state.savedRole : "secretary"; state.savedRole = null; state.view = state.role === "department" ? "employee" : "secretary"; save(); render(); }
    else if (action === "open-decision") { state.modal = { type: "decision" }; render(); }
    else if (action === "open-appointment") { state.modal = { type: "appointment" }; render(); }
    else if (action === "open-focus") { state.modal = { type: "focus" }; render(); }
    else if (action === "demo-sign") {
      const doc = state.documents.find((d) => d.id === element.dataset.documentId);
      if (doc) { doc.status = "موقّع تجريبياً"; save(); render(); showToast("تم تغيير حالة العرض فقط؛ لم ينشأ توقيع رقمي معتمد."); }
    }
    else if (action === "toggle-sound") { state.soundAlerts = !state.soundAlerts; save(); render(); showToast(state.soundAlerts ? "فُعّلت التنبيهات الصوتية في هذا المتصفح." : "أُوقفت التنبيهات الصوتية."); if (state.soundAlerts) playUrgentTone(); }
    else if (action === "test-sound") { playUrgentTone(); showToast("هذا اختبار صوت محلي فقط."); }
    else if (action === "export-requests") exportRequests();
    else if (action === "print-page") window.print();
  }

  function exportRequests() {
    const rows = visibleRequests();
    const fields = ["id", "title", "department", "requester", "quadrant", "status", "assignee", "confidential"];
    const csv = [fields.join(","), ...rows.map((r) => fields.map((key) => `"${String(key === "assignee" ? roleName(r[key]) : r[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "rifd-demo-requests.csv"; link.click(); URL.revokeObjectURL(url);
    showToast("تم تنزيل سجل العرض بصيغة CSV.");
  }

  document.addEventListener("click", (event) => {
    const viewTarget = event.target.closest("[data-view]");
    if (viewTarget) { setView(viewTarget.dataset.view); return; }
    const actionTarget = event.target.closest("[data-action]");
    if (actionTarget) {
      if (actionTarget.dataset.action === "backdrop-close" && event.target !== actionTarget) return;
      handleAction(actionTarget.dataset.action, actionTarget);
      return;
    }
    const requestTarget = event.target.closest("[data-open-request]");
    if (requestTarget) { openRequest(requestTarget.dataset.openRequest); }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.modal) { state.modal = null; render(); }
      else if (state.menuOpen) { state.menuOpen = false; render(); }
    }
    const target = event.target;
    if ((event.key === "Enter" || event.key === " ") && target instanceof HTMLElement && target.matches("[data-open-request][role='button'], tr[data-open-request]")) {
      event.preventDefault(); openRequest(target.dataset.openRequest);
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    handleFormSubmit(form);
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "role-select") {
      state.role = event.target.value;
      state.view = state.role === "department" ? "employee" : state.role === "employee" ? "my-presence" : "dashboard";
      state.modal = null;
      save(); render();
      showToast(`تم تفعيل عرض الدور: ${roleName(state.role)}. التبديل تمثيلي وليس مصادقة حقيقية.`);
    }
    if (event.target.id === "staff-select" && state.role === "employee") {
      if (state.staff.some((person) => person.id === event.target.value)) {
        state.staffId = event.target.value;
        save();
        render();
      }
    }
    if (event.target.id === "request-filter") {
      state.requestFilter = event.target.value;
      render();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "request-search") {
      state.requestSearch = event.target.value;
      const query = normalizeArabic(state.requestSearch);
      document.querySelectorAll("tbody tr[data-open-request]").forEach((row) => {
        row.style.display = !query || normalizeArabic(row.textContent).includes(query) ? "" : "none";
      });
    }
    if (event.target.id === "decision-search") {
      state.decisionSearch = event.target.value;
      const start = event.target.selectionStart;
      const end = event.target.selectionEnd;
      render();
      const replacement = document.getElementById("decision-search");
      if (replacement) { replacement.focus(); replacement.setSelectionRange(start, end); }
    }
  });

  function updateExpiredPresence() {
    const now = Date.now();
    let changed = false;
    Object.entries(state.availability).forEach(([id, presence]) => {
      if (presence.status !== "available" && presence.returnAt && new Date(presence.returnAt).getTime() <= now) {
        state.availability[id] = { ...presence, status: "available", place: presence.returnPlace || presence.place || "مكتب العمل", returnAt: null, note: "انتهت مدة الغياب المحددة" };
        changed = true;
      }
    });
    if (state.busyUntil && new Date(state.busyUntil).getTime() <= now) {
      state.busyUntil = null;
      state.busyReason = "";
      changed = true;
    }
    if (changed) { save(); render(); }
  }

  window.addEventListener("storage", (event) => {
    if (!event.key || Object.values(STORAGE).includes(event.key) || event.key.startsWith("rifd-demo-")) {
      state.requests = read(STORAGE.requests, clone(SEED_REQUESTS));
      state.overrides = read(STORAGE.overrides, []);
      state.notices = read(STORAGE.notices, clone(SEED_NOTICES));
      state.queue = read(STORAGE.queue, clone(SEED_QUEUE));
      state.currentTicket = read("rifd-demo-current-ticket-v1", "و-١١");
      state.busyUntil = read("rifd-demo-busy-until-v1", null);
      state.busyReason = read("rifd-demo-busy-reason-v1", "");
      state.availability = read(STORAGE.availability, clone(SEED_AVAILABILITY));
      state.staff = read(STORAGE.staff, clone(SEED_STAFF));
      state.staffRequests = read(STORAGE.staffRequests, []);
      state.plannerTasks = read(STORAGE.plannerTasks, []);
      state.weekPlan = read(STORAGE.weekPlan, null);
      state.plannerPrefs = read(STORAGE.plannerPrefs, { workdayHours: 6, bufferUnits: 2, startTime: "09:00" });
      render();
    }
  });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }

  render();
  if (typeof window.setInterval === "function") window.setInterval(updateExpiredPresence, 30000);
})();
