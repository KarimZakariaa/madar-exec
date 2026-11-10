/* MAD-HSD-502 · Madar side menu for the design site · Mustafa Saad
   MAD-HSD-570 · tools/build-madar.py adds each rebuilt page to its group (and replaces a split page by its parts)
   Groups follow the live Madar menu order. Each group lists its design families (ns from the kit);
   each family lists its lists (from app/pages-data.js), so every old menu page has a click target. */
window.MADAR_MENU = [
  { id: 'home', en: 'Home', ar: 'الرئيسية', icon: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
    items: [{ label: 'New home', ar: 'الرئيسية الجديدة', route: '#/hm' }, { label: 'Dashboard', ar: 'لوحة المعلومات', route: '#/hm/dash' }] },
  /* MAD-EXEC · Executive dashboards (اللوحات التنفيذية): the executive dashboard and its 22 module dashboards, drawn by exec/exec-shell.js */
  { id: 'exec', en: 'Executive dashboards', ar: 'اللوحات التنفيذية', icon: 'M3.5 17.5a8.5 8.5 0 1 1 17 0M12 17.5l4.2-5.6M6.4 12.4l1.3.8M12 6.5v1.6M17.6 12.4l-1.3.8M2.5 20.5h19',
    items: [{"label": "Executive dashboard", "ar": "لوحة القيادة التنفيذية", "route": "#/ex"}, {"label": "Ticket management", "ar": "إدارة التذاكر", "route": "#/ex/tickets"}, {"label": "Task management", "ar": "إدارة المهام", "route": "#/ex/tasks"}, {"label": "Service agreements", "ar": "اتفاقيات الخدمات", "route": "#/ex/agreements"}, {"label": "Contractor agreements", "ar": "اتفاقيات المقاولين", "route": "#/ex/contractors"}, {"label": "Service contracts", "ar": "عقود الخدمة", "route": "#/ex/contracts"}, {"label": "Emergency stock", "ar": "مخزون الطوارئ", "route": "#/ex/emergency-stock"}, {"label": "Camp distribution system", "ar": "نظام توزيع المخيمات", "route": "#/ex/camps"}, {"label": "Housing licenses", "ar": "تراخيص السكن", "route": "#/ex/housing"}, {"label": "Templates and surveys", "ar": "القوالب والاستبيانات", "route": "#/ex/templates-surveys"}, {"label": "Minutes", "ar": "المحاضر", "route": "#/ex/minutes"}, {"label": "Hospitality center expenses", "ar": "مصروفات مراكز الضيافة", "route": "#/ex/hospitality-expenses"}, {"label": "Catering", "ar": "الإعاشة", "route": "#/ex/catering"}, {"label": "Labor requests", "ar": "طلبات العمالة", "route": "#/ex/labor"}, {"label": "Gift management", "ar": "إدارة الهدايا", "route": "#/ex/gifts"}, {"label": "Tawaf", "ar": "التطويف", "route": "#/ex/tawaf"}, {"label": "Service proof", "ar": "إثبات الخدمة", "route": "#/ex/service-proof"}, {"label": "Incidents", "ar": "الوقوعات", "route": "#/ex/incidents"}, {"label": "Pilgrim movement", "ar": "حركة الحجاج", "route": "#/ex/pilgrim-movement"}, {"label": "Pilgrim transfers at the holy sites", "ar": "تنقلات الحجاج في المشاعر", "route": "#/ex/holy-sites-transport"}, {"label": "Jamarat Bridge", "ar": "جسر الجمرات", "route": "#/ex/jamarat-bridge"}, {"label": "Performance indicators", "ar": "مؤشرات الأداء", "route": "#/ex/kpis"}, {"label": "User management", "ar": "إدارة المستخدمين", "route": "#/ex/users"}] },
  { id: 'providers', en: 'Providers and contracts', ar: 'مزودو الخدمة والعقود', icon: 'M4 7h16v13H4zM9 7V4h6v3M4 12h16', fams: ['pc'] },
  { id: 'dash', en: 'Dashboards', ar: 'لوحات المعلومات', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', fams: ['dbv', 'dbc', 'dbd'] },
  { id: 'settings', en: 'Main settings', ar: 'إعدادات النظام', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4', fams: ['em', 'svc', 'pf'] },
  { id: 'hotels', en: 'Hotels management', ar: 'إدارة الفنادق', icon: 'M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M2 21h20', fams: ['hp'] },
  { id: 'eval', en: 'Evaluation and follow', ar: 'التقييم والمتابعة', icon: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z', fams: ['ev', 'fr', 'tc'] },
  { id: 'transport', en: 'Transportation', ar: 'النقل', icon: 'M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11zM5 11h14M7.5 20v-3M16.5 20v-3', fams: ['ft'] },
  { id: 'arrival', en: 'Arrival and departure', ar: 'الوصول والمغادرة', icon: 'M2 16l20-6L2 4l4 6zM6 10h8', fams: ['fl'] },
  { id: 'housinginfo', en: 'Housing info', ar: 'تجهيز الخيام', icon: 'M3 20L12 4l9 16zM12 4v16M9 20l3-6 3 6', fams: ['csr', 'at', 'csl', 'cst', 'csd', 'csx', 'csm', 'csa', 'cl'] },
  { id: 'moves', en: 'Transactions and movements', ar: 'إدارة التحركات / الوقوعات', icon: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7', fams: ['tx', 'pmv'] },
  { id: 'pilgrims', en: 'Pilgrims', ar: 'بيانات الحجاج', icon: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M21 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8', fams: ['pg', 'bg'] },
  { id: 'manual', en: 'Manual housing', ar: 'إدارة التسكين اليدوي', icon: 'M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-2.5-4.5a1.5 1.5 0 0 1 2.5-1.5L8 15', fams: ['hxh', 'hxc', 'hxf'] },
  { id: 'import', en: 'Import housing', ar: 'إدارة التسكين بالاستيراد', icon: 'M12 16V4M7 9l5-5 5 5M4 20h16', fams: ['ih', 'chU', 'chA', 'chB', 'chC', 'chD'] },
  { id: 'auto', en: 'Auto housing', ar: 'إدارة التسكين الآلي', icon: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8', fams: ['ax', 'cah'] },
  { id: 'store', en: 'Store and orders', ar: 'المتجر والطلبات', icon: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2', fams: ['so'] },
  { id: 'meals', en: 'Camps and catering', ar: 'الوجبات', icon: 'M4 3v8a3 3 0 0 0 6 0V3M7 3v18M17 3c-2 2-3 5-3 8h3v10', fams: ['ml'] },
  { id: 'ops', en: 'Pilgrim management', ar: 'إدارة التشغيل والعمليات', icon: 'M9 4h6l1 3h4v13H4V7h4zM9 13l2 2 4-4', fams: ['gp', 'tsk', 'iss', 'nb', 'mtg', 'tam'] },
  { id: 'medical', en: 'Medical clinics', ar: 'إدارة العيادات الطبية', icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M8.5 10h1M14.5 10h1M8.5 13.5h1M14.5 13.5h1', fams: ['mc', 'sc'] },
  { id: 'services', en: 'Pilgrim services', ar: 'خدمات الحجاج', icon: 'M4 4h16v12H8l-4 4zM8 9h8M8 12h5', fams: ['rq'] },
  { id: 'messages', en: 'Messages and notifications', ar: 'الرسائل والإشعارات', icon: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4', fams: ['msg'] },
  { id: 'content', en: 'App content', ar: 'إدارة محتوى التطبيق', icon: 'M4 5h16v11H4zM8 20h8M12 16v4', fams: ['ct', 'md'] },
  { id: 'reports', en: 'Reports', ar: 'تقارير الأداء', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2', fams: ['pr'] },
  { id: 'admin', en: 'Administration', ar: 'إدارة المستخدمين', icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', fams: ['us', 'co', 'au'] }
];
