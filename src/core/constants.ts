
import { ServicePackage, AddOnItem, Report, Translation } from './types';

export const JORDAN_BANKS = [
    "البنك العربي (Arab Bank)",
    "بنك الاتحاد (Bank al Etihad)",
    "بنك الإسكان (Housing Bank)",
    "البنك الإسلامي الأردني (JIB)",
    "البنك العربي الإسلامي الدولي (IIAB)",
    "بنك القاهرة عمان (Cairo Amman Bank)",
    "كابيتال بنك (Capital Bank)",
    "بنك الأردن (Bank of Jordan)",
    "البنك الأهلي الأردني (Jordan Ahli Bank)",
    "بنك صفوة الإسلامي (Safwa Islamic Bank)",
    "انفست بنك (Investbank)",
    "بنك الاستثمار العربي الأردني (AJIB)",
    "البنك الأردني الكويتي (JKB)",
    "بنك ABC"
];

export const JORDAN_WALLETS = [
    "زين كاش (Zain Cash)",
    "أورنج موني (Orange Money)",
    "المحفظة الوطنية (Mahfazati)",
    "يواليت (UWallet - Umniah)",
    "دينارك (Dinarak)",
    "آيا باي (Aya Pay)",
    "جادة (Gadha)",
    "بنكي (Banki - Blink)"
];

export const PACKAGES: ServicePackage[] = [
  {
    id: 'tech-hour', name: 'techHour', price: 20, currency: 'JOD', type: 'one-time', features: []
  },
  {
    id: 'tech-day', name: 'techDay', price: 55, currency: 'JOD', type: 'one-time', features: []
  },
  {
    id: 'business-core', name: 'businessCore', price: 180, currency: 'JOD', type: 'subscription',
    limits: { users: 10, visits: 2, visitDuration: 4, tickets: 3 },
    addOnPricing: { extraUser: 6 },
    includedResources: { microsoft365: 5, microsoft365Type: 'Business Standard', antivirus: 2, antivirusType: 'Endpoint' },
    resourceRates: { microsoft365: 10, antivirus: 7 }, features: [], securityFeatures: []
  },
  {
    id: 'business-plus', name: 'businessPlus', price: 280, currency: 'JOD', type: 'subscription', isPopular: true,
    limits: { users: 20, visits: 4, visitDuration: 4, tickets: 7 },
    addOnPricing: { extraUser: 5 },
    includedResources: { microsoft365: 10, microsoft365Type: 'Business Standard', antivirus: 5, antivirusType: 'Endpoint' },
    resourceRates: { microsoft365: 9, antivirus: 6 }, features: [], securityFeatures: []
  },
  {
    id: 'managed-it', name: 'managedIt', price: 360, currency: 'JOD', type: 'subscription',
    limits: { users: 30, visits: 8, visitDuration: 4, tickets: 12 },
    addOnPricing: { extraUser: 4 },
    includedResources: { microsoft365: 15, microsoft365Type: 'Business Premium', antivirus: 10, antivirusType: 'Endpoint' },
    resourceRates: { microsoft365: 8, antivirus: 5 }, features: [], securityFeatures: []
  }
];

export const ADDONS_DATA: AddOnItem[] = [
  { id: 'extra-user', name: 'extraUser', price: 'Depends on Plan', unit: 'perUser', type: 'user' },
  { id: 'extra-visit', name: 'extraVisit', price: 25, unit: 'perVisit', type: 'visit', description: 'Up to 4 hours' },
  { id: 'emergency-visit', name: 'emergencyVisit', price: 50, unit: 'perVisit', type: 'visit', description: 'Immediate response' },
  { id: 'extra-ticket', name: 'extraTicket', price: 10, unit: 'perTicket', type: 'ticket' },
  { id: 'microsoft-365', name: 'microsoft365', price: 'Depends on Plan', unit: 'perUserMonth', type: 'license' },
  { id: 'antivirus', name: 'antivirus', price: 'Depends on Plan', unit: 'perUserMonth', type: 'license' },
];

export const MOCK_REPORTS: Report[] = [];

export const TRANSLATIONS: Record<'en' | 'ar', Translation> = {
  en: {
    nav: { home: 'Home', about: 'About', services: 'Services', pricing: 'Pricing', contact: 'Contact', login: 'Login', dashboard: 'Dashboard', logout: 'Logout', productBy: 'Product of', switchLang: 'العربية' },
    hero: { tagline: 'Professional IT Solutions', titleLine1: 'RESTORE', titleLine2: 'OPTIMAL CONDITION', slogan: 'We architect stability so you can focus on growth', cta: 'View Packages' },
    home: {
      stats: { uptime: 'Uptime', response: 'Response', clients: 'Clients', security: 'Security' },
      features: {
        support: { title: 'Technical Support', desc: 'Professional assistance for your team ensuring zero downtime during business hours.' },
        security: { title: 'Security', desc: 'Advanced threat protection and proactive monitoring systems.' },
        maintenance: { title: 'Maintenance', desc: 'Routine proactive checks to ensure optimal uptime and performance.' }
      },
      canvasSection: { subtitle: '', title: 'Ctrl Z A Premier Product of Canvas', parentTitle: 'CANVAS', parentRole: 'Strategy & Vision', parentDesc: 'Setting the blueprint for business growth and operational excellence through consultancy.', connection: 'Executed By', childTitle: 'Ctrl Z', childRole: 'Technical Product', childDesc: 'Translating strategic vision into a stable, high-performance technical reality.', },
      servicesTitle: 'Technical Ecosystem', servicesSubtitle: 'Comprehensive IT Infrastructure.', servicesCta: 'View All Services', pricingTitle: 'Service Packages', pricingSubtitle: 'Predictable costs. Unpredictable quality. Choose the plan that fits your business scale.', pricingCta: 'View Full Pricing', contactCtaTitle: 'Your Investment in Tech Starts Here', contactCtaDesc: 'Join the ecosystem that powers the most stable businesses in Amman.', contactCtaButton: "Start the Journey"
    },
    about: { heroTitle: 'Our Vision', heroSubtitle: 'Product of Canvas', storyTitle: 'About Product', storyTitleBig: 'Ctrl Z: A Premier Product of Canvas', storyText1: 'We are not just a service provider; we are the operational manifestation of Canvas strategic vision', storyText2: 'Leveraging the consultancy depth of Canvas, we deliver a stable technical ecosystem that propels your business forward.', productOfCanvas: 'Product of Canvas', storyBridge: 'Bridging the gap between strategic consultancy and technical execution.', statUptime: 'Uptime Goal', statSupport: 'Support', ecosystemTitle: 'The Ecosystem', ecosystemSubtitle: 'Strategy meets Execution.', canvasRole: 'Strategy & Vision', canvasDesc: 'Defines the strategy, sets the vision, and outlines growth.', canvasPoint1: 'Strategic Planning', canvasPoint2: 'Business Consultancy', ctrlzRole: 'Technical Execution', ctrlzDesc: 'Executes the vision and builds the infrastructure.', ctrlzPoint1: 'Technical Implementation', ctrlzPoint2: 'System Maintenance', youAreHere: 'You are here', missionTitle: 'Our Mission', missionDesc: 'Empowering businesses by removing technical hurdles.', excellenceTitle: 'Excellence', excellenceDesc: 'Highest standards of service delivery by certified pros.', customerTitle: 'Client First', customerDesc: 'Building long-term partnerships for mutual success.', principlesTitle: 'Core Principles', principlesSubtitle: 'The foundation of our delivery.' },
    common: { loading: 'Loading...', submit: 'Submit', save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', view: 'View', mostPopular: 'Recommended', perMonth: '/ Month', jod: 'JOD', users: 'users', contactUs: 'Contact Us', bookService: 'Book Service', learnMore: 'Learn More', details: 'Details', addOns: 'Optional Add-ons', active: 'Active', suspended: 'Suspended', open: 'Open', resolved: 'Resolved', inProgress: 'In Progress', search: 'Search...', actions: 'Actions', status: 'Status', request: 'Request' },
    services: {
      title: 'Technical Ecosystem', subtitle: 'Digital Infrastructure for Business Growth.',
      items: {
        itSupport: { title: 'Technical Support', desc: 'Immediate assistance for hardware and software issues.', features: ['Hardware Repair', 'Software Installation', 'Performance Tuning'] },
        onSite: { title: 'On-site Visits', desc: 'Professional technicians at your office.', features: ['Scheduled Visits', 'Emergency Response', 'Hardware Setup'] },
        remote: { title: 'Remote Helpdesk', desc: 'Quick resolution of issues via secure remote connection.', features: ['Instant Access', 'Secure Tunneling', 'Cost Effective'] },
        managed: { title: 'Managed Services', desc: 'Proactive management of your entire IT infrastructure.', features: ['Server Maintenance', 'User Management', '24/7 Monitoring'] },
        security: { title: 'Cyber Security', desc: 'Advanced threat protection and antivirus licensing.', features: ['Firewall Setup', 'Antivirus Licensing', 'Threat Detection'] },
        backup: { title: 'Data Backup', desc: 'Automated daily backups and disaster recovery planning.', features: ['Cloud Backup', 'Data Recovery', 'Daily Snapshots'] },
        network: { title: 'Network Solutions', desc: 'Wifi optimization, cabling, and internal network configuration.', features: ['Cabling', 'WiFi Optimization', 'VPN Setup'] }
      }
    },
    packages: {
      title: 'Service Packages', oneTimeTitle: 'One-Time Services', subTitle: 'Transparent pricing for professional services', addonsTitle: 'Optional Add-ons', customNote: 'This package can be customized with additional users, visits, or support tickets.',
      items: {
        'techHour': { name: 'Technical Hour', capacity: '', features: ['Hardware & Software Check', 'System Diagnosis', 'Virus Removal', 'Driver Updates', 'Basic Network Setup', 'Printer Setup'] },
        'techDay': { name: 'Technical Day', capacity: '', features: ['Full Office Inspection', 'Network Diagnosis', 'Multiple Fixes', 'Security Setup', 'Backup Configuration', 'New Device Setup', 'Up to 4 Hours Duration'] },
        'businessCore': { name: 'Basic Business', capacity: 'Support & Maintenance', features: ['10 Users', '2 On-site Visits (4 Hours)', '3 Remote Tickets', '5 Microsoft 365 (Standard)', '2 Antivirus Licenses', 'Hardware & Network Support', 'Brief Monthly Report'] },
        'businessPlus': { name: 'Advanced Business', capacity: 'Proactive Monitoring', features: ['20 Users', '4 On-site Visits (4 Hours)', '7 Remote Tickets', '10 Microsoft 365 (Standard)', '5 Antivirus Licenses', 'User Management', 'Analytical Monthly Report'] },
        'managedIt': { name: 'Comprehensive Business', capacity: 'Full IT Management', features: ['30 Users', '8 On-site Visits (4 Hours)', '12 Remote Tickets', '15 Microsoft 365 (Premium)', '10 Antivirus Licenses', 'Advanced Security', 'Detailed Report & Consulting'] }
      },
      addons: { extraUser: { name: 'Additional User', unit: '/ User / Month' }, extraVisit: { name: 'Additional On-site Visit', unit: '' }, emergencyVisit: { name: 'Emergency Visit', unit: '' }, extraTicket: { name: 'Additional Support Ticket', unit: '' }, microsoft365: { name: 'Microsoft 365 Account', unit: '/ Month' }, antivirus: { name: 'Antivirus License', unit: '/ Month' } }
    },
    contact: { title: 'Contact Us', subtitle: 'Ready to optimize your business IT? Reach out to us for a consultation or booking.', name: 'Name', email: 'Email', message: 'Message', phone: 'Phone', send: 'Send Message', success: 'Message sent!', office: 'Office', officeAddress: '', workingHours: 'Mon-Sat 9am to 6pm' },
    footer: { desc: 'Delivering optimal technical conditions for businesses. Powered by Canvas.', rights: '© 2024 Ctrl Z. A product of Canvas.', product: 'Product', solutions: 'Solutions' },
    admin: { report: { create: 'Create Report', health: 'Technical Health', recommendations: 'Recommendations' } },
    client: { hello: 'Hello', myPackage: 'My Package', remainingVisits: 'Remaining Visits', remainingTickets: 'Remaining Tickets', requestVisit: 'Request Visit', openTicket: 'Open Ticket', recentActivity: 'Recent Activity', systemHealth: 'System Health', monthlyReport: 'Monthly Report', downloadPdf: 'Download PDF', availableAddons: 'Available Add-ons', packagePrivileges: 'Package Privileges', billing: { title: 'Billing', nextPayment: 'Next Payment', invoices: 'Invoices', amount: 'Amount', status: 'Status', download: 'Download', warning: 'You have overdue invoices.' }, reports: { title: 'Reports', month: 'Month', type: 'Type', view: 'View Report' }, activity: { maintenance: 'Maintenance', ticketClosed: 'Ticket Closed', planRenewed: 'Plan Renewed' } }
  },
  ar: {
    nav: { home: 'الرئيسية', about: 'عن المنتج', services: 'خدماتنا', pricing: 'الباقات', contact: 'تواصل معنا', login: 'تسجيل الدخول', dashboard: 'لوحة التحكم', logout: 'تسجيل الخروج', productBy: 'منتج من', switchLang: 'English' },
    hero: { tagline: 'حلول تقنية احترافية', titleLine1: 'نستعيد أجهزتك', titleLine2: 'لحالتها المثالية', slogan: 'نحن نبني الاستقرار لتتمكن من التركيز على النمو', cta: 'تصفح الباقات' },
    home: {
      stats: { uptime: 'جاهزية', response: 'استجابة', clients: 'عملاء', security: 'أمان' },
      features: {
        support: { title: 'الدعم الفني', desc: 'مساعدة احترافية لفريقك خلال ساعات العمل لضمان الإنتاجية.' },
        security: { title: 'الأمان والحماية', desc: 'حماية متقدمة من التهديدات وأنظمة مراقبة استباقية.' },
        maintenance: { title: 'الصيانة الدورية', desc: 'فحوصات استباقية روتينية لضمان الأداء الأمثل والجاهزية.' }
      },
      canvasSection: { subtitle: '', title: 'Ctrl Z منتج رائد من Canvas', parentTitle: 'CANVAS', parentRole: 'الاستراتيجية والرؤية', parentDesc: 'رسم مخطط النمو التجاري والتميز التشغيلي من خلال الاستشارات.', connection: 'تنفيذ بواسطة', childTitle: 'Ctrl Z', childRole: 'المنتج التقني', childDesc: 'ترجمة الرؤية الاستراتيجية إلى واقع تقني مستقر وعالي الأداء.', },
      servicesTitle: 'النظام البيئي التقني', servicesSubtitle: 'بنية تحتية شاملة لتقنية المعلومات.', servicesCta: 'عرض جميع الخدمات', pricingTitle: 'باقات الخدمات', pricingSubtitle: 'تكاليف متوقعة. جودة لا تضاهى. اختر الخطة التي تناسب حجم عملك.', pricingCta: 'عرض الأسعار الكاملة', contactCtaTitle: 'استثمارك في التكنولوجيا يبدأ هنا', contactCtaDesc: 'انضم إلى النظام البيئي الذي يدعم أكثر الأعمال استقراراً في عمان.', contactCtaButton: "ابدأ الرحلة"
    },
    about: { heroTitle: 'رؤيتنا', heroSubtitle: 'منتج من Canvas', storyTitle: 'عن المنتج', storyTitleBig: 'Ctrl Z: منتج رائد من Canvas', storyText1: 'نحن لسنا مجرد مزود خدمة؛ نحن التجسيد التشغيلي لرؤية Canvas الاستراتيجية', storyText2: 'بالاستفادة من عمق استشارات Canvas، نقدم نظاماً بيئياً تقنياً مستقراً يدفع عملك إلى الأمام.', productOfCanvas: 'منتج من Canvas', storyBridge: 'سد الفجوة بين الاستشارات الاستراتيجية والتنفيذ التقني.', statUptime: 'هدف الجاهزية', statSupport: 'الدعم', ecosystemTitle: 'النظام البيئي', ecosystemSubtitle: 'حين تلتقي الاستراتيجية بالتنفيذ.', canvasRole: 'الاستراتيجية والرؤية', canvasDesc: 'تحدد الاستراتيجية، تضع الرؤية، وترسم مسار النمو.', canvasPoint1: 'التخطيط الاستراتيجي', canvasPoint2: 'استشارات الأعمال', ctrlzRole: 'التنفيذ التقني', ctrlzDesc: 'ينفذ الرؤية ويبني البنية التحتية.', ctrlzPoint1: 'التنفيذ التقني', ctrlzPoint2: 'صيانة الأنظمة', youAreHere: 'أنت هنا', missionTitle: 'مهمتنا', missionDesc: 'تمكين الشركات من خلال إزالة العقبات التقنية.', excellenceTitle: 'التميز', excellenceDesc: 'أعلى معايير تقديم الخدمة من قبل محترفين معتمدين.', customerTitle: 'العميل أولاً', customerDesc: 'بناء شراكات طويلة الأمد لنجاح متبادل.', principlesTitle: 'المبادئ الأساسية', principlesSubtitle: 'أساس تقديم خدماتنا.' },
    common: { loading: 'جاري التحميل...', submit: 'إرسال', save: 'حفظ', cancel: 'إلغاء', edit: 'تعديل', delete: 'حذف', view: 'عرض', mostPopular: 'موصى به', perMonth: '/ شهر', jod: 'دينار', users: 'مستخدمين', contactUs: 'تواصل معنا', bookService: 'حجز خدمة', learnMore: 'المزيد', details: 'التفاصيل', addOns: 'إضافات اختيارية', active: 'نشط', suspended: 'معلق', open: 'مفتوح', resolved: 'محلول', inProgress: 'قيد التنفيذ', search: 'بحث...', actions: 'إجراءات', status: 'الحالة', request: 'طلب' },
    services: {
      title: 'النظام البيئي التقني', subtitle: 'التميز التقني لبنية عملك التحتية',
      items: {
        itSupport: { title: 'الدعم الفني', desc: 'مساعدة فورية لمشاكل الأجهزة والبرمجيات.', features: ['صيانة الأجهزة', 'تثبيت البرامج', 'تحسين الأداء'] },
        onSite: { title: 'زيارات ميدانية', desc: 'فنيون محترفون في مكتبك.', features: ['زيارات مجدولة', 'استجابة للطوارئ', 'إعداد الأجهزة'] },
        remote: { title: 'مساعدة عن بعد', desc: 'حل سريع للمشاكل عبر اتصال آمن عن بعد.', features: ['وصول فوري', 'اتصال آمن', 'تكلفة فعالة'] },
        managed: { title: 'الخدمات المدارة', desc: 'إدارة استباقية لبنيتك التحتية التقنية بالكامل.', features: ['صيانة الخوادم', 'إدارة المستخدمين', 'مراقبة 24/7'] },
        security: { title: 'الأمن السيبراني', desc: 'حماية متقدمة من التهديدات وتراخيص مضاد الفيروسات.', features: ['إعداد جدار الحماية', 'تراخيص مضاد الفيروسات', 'كشف التهديدات'] },
        backup: { title: 'نسخ احتياطي للبيانات', desc: 'نسخ احتياطي يومي مؤتمت وتخطيط للتعافي من الكوارث.', features: ['نسخ سحابي', 'استعادة البيانات', 'لقطات يومية'] },
        network: { title: 'حلول الشبكات', desc: 'تحسين الواي فاي، التمديدات، وإعداد الشبكة الداخلية.', features: ['تمديدات', 'تحسين الواي فاي', 'إعداد VPN'] }
      }
    },
    packages: {
      title: 'باقات الخدمات', oneTimeTitle: 'خدمات لمرة واحدة', subTitle: 'أسعار شفافة لخدمات احترافية', addonsTitle: 'إضافات اختيارية', customNote: 'يمكن تخصيص هذه الباقة وإضافة خدمات حسب الحاجة.',
      items: {
        'techHour': { name: 'ساعة تقنية', capacity: '', features: ['فحص الأجهزة والبرامج', 'تشخيص النظام', 'إزالة الفيروسات', 'تحديث التعريفات', 'إعداد شبكة أساسي', 'إعداد طابعة'] },
        'techDay': { name: 'يوم تقني', capacity: '', features: ['فحص كامل للمكتب', 'تشخيص الشبكة', 'إصلاحات متعددة', 'إعداد الأمان', 'إعداد النسخ الاحتياطي', 'إعداد أجهزة جديدة', 'خدمة تقنية مكثفة لمدة 4 ساعات لضمان أعلى إنتاجية'] },
        'businessCore': { name: 'باقة الأعمال الأساسية', capacity: 'الدعم والصيانة عند حدوث المشكلة', features: ['عدد 10 مستخدمين', '2 زيارات ميدانية شهرياً (4 ساعات)', '3 تذاكر دعم فني عن بعد', '5 حسابات Microsoft 365 (Business Standard)', '2 تراخيص Antivirus', 'صيانة الأجهزة والشبكات', 'تقرير تقني مختصر بعد كل زيارة'] },
        'businessPlus': { name: 'باقة الأعمال المتقدمة', capacity: 'مراقبة الأنظمة والتدخل الاستباقي لتقليل الأعطال', features: ['عدد 20 مستخدم', '4 زيارات ميدانية شهرياً (4 ساعات)', '7 تذاكر دعم فني عن بعد', '10 حسابات Microsoft 365 (Business Standard)', '5 تراخيص Antivirus', 'إدارة المستخدمين والصلاحيات', 'تقرير تقني تحليلي بعد كل زيارة'] },
        'managedIt': { name: 'باقة الأعمال الشاملة', capacity: 'إدارة تقنية كاملة وتحمل المسؤولية التقنية عن المؤسسة', features: ['عدد 30 مستخدم', '8 زيارات ميدانية شهرياً (4 ساعات)', '12 تذكرة دعم فني عن بعد', '15 حساب Microsoft 365 (Business Premium)', '10 تراخيص Antivirus', 'مراقبة استباقية وحل الأعطال', 'تقرير تقني مفصل مع توصيات للإدارة'] }
      },
      addons: { extraUser: { name: 'مستخدم إضافي', unit: '/ مستخدم / شهر' }, extraVisit: { name: 'زيارة ميدانية إضافية', unit: '' }, emergencyVisit: { name: 'زيارة طارئة', unit: '' }, extraTicket: { name: 'تذكرة دعم إضافية', unit: '' }, microsoft365: { name: 'حساب Microsoft 365', unit: '/ شهر' }, antivirus: { name: 'رخصة مضاد فيروسات', unit: '/ شهر' } }
    },
    contact: { title: 'تواصل معنا', subtitle: 'جاهز لتحسين تقنية عملك؟ تواصل معنا للحصول على استشارة أو حجز.', name: 'الاسم', email: 'البريد الإلكتروني', message: 'الرسالة', phone: 'الهاتف', send: 'إرسال الرسالة', success: 'تم إرسال الرسالة!', office: 'المكتب', officeAddress: '', workingHours: 'السبت - الخميس 9ص إلى 6م' },
    footer: { desc: 'توفير الظروف التقنية المثلى للأعمال. بدعم من Canvas.', rights: '© 2024 Ctrl Z. منتج من Canvas.', product: 'المنتج', solutions: 'الحلول' },
    admin: { report: { create: 'إنشاء تقرير', health: 'الصحة التقنية', recommendations: 'التوصيات' } },
    client: { hello: 'مرحباً', myPackage: 'تذاكري', remainingVisits: 'رصيد الزيارات', remainingTickets: 'رصيد التذاكر عن بعد', requestVisit: 'طلب زيارة', openTicket: 'تذكرة عن بعد', recentActivity: 'سجل النشاط', systemHealth: 'حالة النظام', monthlyReport: 'التقرير الشهري', downloadPdf: 'تحميل PDF', availableAddons: 'الإضافات المتاحة لهذه الباقة', packagePrivileges: 'امتيازات الباقة والترخيص', billing: { title: 'الفوترة والاشتراك', nextPayment: 'الدفعة القادمة', invoices: 'سجل الفواتير', amount: 'المبلغ', status: 'الحالة', download: 'تحميل الفاتورة', warning: 'لديك فواتير مستحقة الدفع. يرجى تسديد المبلغ لتجنب انقطاع الخدمة.' }, reports: { title: 'التقارير الفنية', month: 'الشهر', type: 'نوع التقرير', view: 'عرض التقرير' }, activity: { maintenance: 'تمت الصيانة الدورية', ticketClosed: 'تم إغلاق التذكرة', planRenewed: 'تجديد الاشتراك' } }
  }
};
