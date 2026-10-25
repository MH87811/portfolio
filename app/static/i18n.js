/* i18n.js: language state and interface dictionary for the Personal Developer System.

   Loaded synchronously in <head> (before the stylesheets) so that <html lang dir> is correct
   before the first paint. Used by index.html, app.js and 404.html.

   Language resolution order (first match wins):
     1. ?lang=fa | ?lang=en in the URL      (shareable link, never written unless it was already there)
     2. localStorage "ds-lang"              (the visitor's last explicit choice)
     3. navigator.languages                 (first visit only: Persian browsers get Persian)
     4. "en"

   Interface text lives in DICT. Keys under "copy." are owner-authored sentences that were
   hard-coded in the frontend. They are deliberately NOT translated here: a Persian version has to
   be supplied by the owner through I18N_CONTENT.fa.COPY (see data.js). Until then the English text is
   shown and marked lang="en" instead of being passed off as translated.                      */
(function(root){
'use strict';

var SUPPORTED = ['fa', 'en'];
var STORE_KEY = 'ds-lang';
var DIRS = {fa:'rtl', en:'ltr'};
var NAMES = {fa:'فارسی', en:'English'};

/* ============ INTERFACE DICTIONARY ============ */
var DICT = {

en: {
  'doc.title':'Personal Developer System',
  'brand.aria':'Maziyar system, home',
  'crumbs.aria':'Location',
  'jump':'Jump to',
  'rail.aria':'System',
  'totop':'↑ TOP',
  'totop.aria':'Back to top',
  'lang.group':'Language / زبان',
  'lang.live':'Language: English',
  'js.needed':'This page needs JavaScript.',

  'pal.label':'Jump to',
  'pal.ph':'Jump to a page, project, note or technology',
  'pal.close':'Close',
  'pal.esc':'esc',
  'pal.closeShort':'close',
  'pal.results':'Results',
  'pal.move':'move',
  'pal.open':'open',
  'pal.empty':'Nothing matches “{q}”.',
  'pal.n':'{n} results',
  'pal.none':'No results',
  'pal.type.Pages':'Page',
  'pal.type.Projects':'Project',
  'pal.type.Notes':'Note',
  'pal.type.Technologies':'Technology',
  'pal.type.Learning':'Learning',

  'nav.home':'/', 'nav.about':'about/', 'nav.projects':'projects/', 'nav.stack':'stack/',
  'nav.learning':'learning/', 'nav.lab':'lab/', 'nav.contact':'contact/',
  'name.home':'Home', 'name.about':'About', 'name.projects':'Projects', 'name.stack':'Stack',
  'name.learning':'Learning', 'name.lab':'Lab', 'name.contact':'Contact',
  'crumb.maziyar':'maziyar', 'crumb.about':'about', 'crumb.projects':'projects', 'crumb.stack':'stack',
  'crumb.learning':'learning', 'crumb.lab':'lab', 'crumb.contact':'contact',

  'rail.processes':'active processes',
  'rail.none':'none running',
  'rail.rev':'rev {v}',
  'rail.keys':'keys 0 to 6',
  'status.focus':'FOCUS',
  'status.now':'CURRENTLY',
  'word.learning':'learning',

  'hero.role':'BACKEND DEVELOPER',
  'hero.system':'SYSTEM',
  'hero.focus':'FOCUS',
  'hero.now':'CURRENTLY',
  'hero.projects':'projects →',
  'hero.contact':'contact →',
  'role':'backend developer',
  'role.system':'backend engineer',

  /* owner-authored copy that is hard-coded in the frontend: needs the owner's own Persian (see header) */
  'copy.hero.sum':'I build APIs and services with Django, Laravel and Go, and I care about the parts that keep them running.',
  'copy.hero.focus':'reliable systems',
  'copy.about.builds':'APIs, authentication systems and realtime services',
  'copy.about.uses':'Django, DRF, Laravel and Go on Linux',

  'p.completed':'completed', 'p.active':'active', 'p.prototype':'prototype', 'p.archived':'archived',
  'l.exploring':'exploring', 'l.learning':'learning', 'l.studying':'studying', 'l.developing':'developing', 'l.queued':'queued',
  'lab.s.in progress':'in progress', 'lab.s.queued':'queued', 'lab.s.published':'published',
  'lab.k.experiment':'experiment', 'lab.k.prototype':'prototype', 'lab.k.note':'note',
  'status.label':'status: {s}',
  'updated':'updated {d}',

  'state.exploring':'first look, broad and curious',
  'state.learning':'structured, working through material',
  'state.studying':'deep reading, theory and trade-offs',
  'state.developing':'building real things with it',
  'state.queued':'Planned, not started.',

  'about.title':'About',
  'about.empty':'Nothing written here yet.',
  'about.progress':'in progress · {n}',
  'about.who':'maziyar Heydari, backend developer',
  'about.projectsGlance':'{n} modules, each with an architecture write-up',
  'about.contactGlance':'Email, GitHub and LinkedIn',
  'about.contactGlanceTg':'Telegram, email, GitHub and LinkedIn',
  'glance.WHO':'WHO', 'glance.BUILDS':'BUILDS', 'glance.USES':'USES', 'glance.PROJECTS':'PROJECTS', 'glance.CONTACT':'CONTACT',
  'glance.about':'about →', 'glance.projects':'projects →', 'glance.stack':'stack →', 'glance.open':'open →',
  'kv.ROLE':'ROLE', 'kv.FOCUS':'FOCUS', 'kv.FRAMEWORKS':'FRAMEWORKS', 'kv.LANGUAGES':'LANGUAGES',
  'kv.PLATFORM':'PLATFORM', 'kv.DATA':'DATA', 'kv.STATUS':'STATUS',

  'projects.lede':'Each project is a module with an architecture, the decisions behind it, and a repository.',
  'projects.empty':'No projects published yet.',
  'btn.architecture':'ARCHITECTURE', 'btn.details':'DETAILS', 'btn.repo':'REPOSITORY',
  'btn.details.for':'DETAILS: {n}', 'btn.architecture.for':'ARCHITECTURE: {n}', 'btn.repo.for':'REPOSITORY: {n}',
  'ext.newtab':'(opens in a new tab)',

  'sec.overview':'overview', 'sec.problem':'problem', 'sec.architecture':'architecture', 'sec.technologies':'technologies',
  'sec.decisions':'technical decisions', 'sec.challenges':'challenges', 'sec.body':'write-up', 'sec.outcome':'outcome',
  'sec.limitations':'limitations', 'sec.related':'related', 'sec.repository':'repository',
  'cidx.overview':'overview', 'cidx.problem':'problem', 'cidx.architecture':'architecture', 'cidx.technologies':'technologies',
  'cidx.decisions':'decisions', 'cidx.challenges':'challenges', 'cidx.body':'body', 'cidx.outcome':'outcome',
  'cidx.limitations':'limitations', 'cidx.related':'related', 'cidx.repository':'repository',
  'case.sections.aria':'Case study sections',
  'back.home':'‹ /maziyar',
  'case.back':'‹ /projects',
  'case.tradeoff':'trade-off: ',
  'case.problem':'problem',
  'case.empty':'No details published for this project yet.',
  'pn.prev':'‹ previous', 'pn.next':'next ›',
  'pn.projects.aria':'Other projects', 'pn.notes.aria':'Notes',
  'btn.copy':'COPY', 'btn.copied':'COPIED', 'btn.select':'SELECT TEXT', 'btn.open':'OPEN', 'btn.compose':'COMPOSE',
  'btn.more':'Read more', 'btn.less':'Show less',

  'rel.note':'Matched by shared technologies, not hand-picked.',
  'rel.projects':'projects', 'rel.notes':'notes', 'rel.learning':'learning',
  'more':'+{n} more',

  'stack.lede':'Installed components, grouped by layer. Each one lists what it requires and where it is used. Hover a row to trace its dependencies.',
  'stack.empty':'No components registered yet.',
  'dep.requires':'requires', 'dep.requiredBy':'required by', 'dep.usedIn':'used in', 'dep.notes':'notes',
  'dep.learning':'learning', 'dep.none':'no dependencies',

  'learning.lede':'Processes that are running right now. State describes how I am working on something, not how much I know.',
  'learning.running':'running', 'learning.queued':'queued', 'learning.related':'related work',
  'learning.empty':'Nothing listed yet.',

  'lab.lede':'Experiments, prototypes and technical notes. Nothing here is finished by design. Entries move from queued to in progress to published.',
  'lab.search':'search', 'lab.kind':'kind', 'lab.status':'status', 'lab.tech':'technology', 'lab.all':'all',
  'lab.ph':'Title, text or technology',
  'lab.count':'{a} of {b} entries',
  'lab.empty':'No entries published yet.',
  'lab.noMatch':'No entries match these filters.',
  'lab.clear':'Clear filters',
  'lab.reserved':'RESERVED',
  'lab.next':'Next experiment',
  'lab.nextText':'New entries are added as they are started.',
  'lab.summary':'summary', 'lab.writeup':'write-up', 'lab.technologies':'technologies', 'lab.related':'related',
  'lab.nowriteup':'No long-form write-up has been published for this entry yet.',
  'lab.back':'‹ /lab',
  'sections.aria':'Sections',
  'fig.code':'Code', 'fig.terminal':'Terminal', 'fig.diagram':'Diagram', 'fig.diagram.aria':'Diagram. {l}',

  'contact.title':'Contact',
  'contact.n1':'One channel.', 'contact.n2':'Two channels.', 'contact.n3':'Three channels.', 'contact.n4':'Four channels.',
  'contact.fastest':' Email is the fastest.',
  'contact.ledeTg':'For questions about projects, collaboration or job opportunities, you can message me on Telegram.',
  'contact.empty':'No contact channels listed yet.',
  'ch.EMAIL':'EMAIL', 'ch.GITHUB':'GITHUB', 'ch.LINKEDIN':'LINKEDIN', 'ch.TELEGRAM':'TELEGRAM',
  'ch.direct':'direct channel', 'ch.source':'source code', 'ch.pro':'professional profile',
  'ch.quick':'quick message',
  'btn.telegram':'Message on Telegram',

  /* technology kinds (group headings in the stack, labels in the inspector); English equals the raw value used before */
  'kind.language':'language', 'kind.framework':'framework', 'kind.database':'database', 'kind.cache':'cache',
  'kind.protocol':'protocol', 'kind.tool':'tool', 'kind.platform':'platform', 'kind.other':'other',

  'insp.label':'inspector',
  'insp.title':'System map',
  'insp.hint':'Hover a node to trace what connects to it. Select one to pin it. Components sit on the left, the work that uses them on the right.',
  'legend.contains':'contains', 'legend.usedIn':'used in',
  'insp.glance':'at a glance',
  'insp.counts':'{p} projects · {c} components · {l} active learning areas',
  'node.components':'{n} components', 'node.active':'{n} active', 'node.entries':'{n} entries',
  'node.learning':'LEARNING', 'node.lab':'LAB',
  'insp.kind.domain':'domain', 'insp.kind.project':'project · {s}', 'insp.kind.module':'module', 'insp.kind.component':'component · {d}',
  'insp.components':'components', 'insp.builtWith':'built with', 'insp.openCase':'open case study →',
  'insp.touches':'touches', 'insp.areas':'areas', 'insp.entries':'entries',
  'insp.openLearning':'open learning →', 'insp.openLab':'open lab →',
  'insp.learningName':'/learning', 'insp.labName':'/lab',
  'insp.learningText':'Areas being worked on right now, with the state each one is in.',
  'insp.labText':'Experiments, prototypes and notes. Published as they are finished.',
  'insp.usedIn':'used in', 'insp.nothing':'nothing yet', 'insp.requires':'requires', 'insp.requiredBy':'required by',
  'insp.notes':'notes', 'insp.openStack':'open in stack →', 'insp.clear':'clear selection (esc)',
  'map.aria':'System map',

  'tree.about':'ABOUT', 'tree.projects':'PROJECTS', 'tree.stack':'STACK', 'tree.learning':'LEARNING', 'tree.lab':'LAB', 'tree.contact':'CONTACT',
  'tree.aboutMeta':'who and focus',
  'tree.projectsMeta':'{n} modules', 'tree.stackMeta':'{n} components', 'tree.learningMeta':'{n} active',
  'tree.labMeta':'{n} entries', 'tree.contactMeta':'{n} channels',
  'open.about':'open about →', 'open.projects':'open projects →', 'open.stack':'open stack →',
  'open.learning':'open learning →', 'open.lab':'open lab →', 'open.contact':'open contact →',

  'notice.only.en':'Most of the content on this page is currently available only in English.',
  'notice.only.fa':'Most of the content on this page is currently available only in Persian.',

  /* 404 page */
  'nf.title':'404 · Page not found',
  'nf.route':'route unresolved',
  'nf.what':'Route not found',
  'nf.msg':'No page in this system matches that address. It may have moved, or the link may be mistyped.',
  'nf.requested':'requested', 'nf.resolved':'resolved', 'nf.status':'status', 'nf.nearest':'nearest',
  'nf.none':'none', 'nf.notfound':'404 not found', 'nf.thisAddress':'this address',
  'nf.home':'Back to home', 'nf.back':'Go back',
  'nf.keys':'esc or 0 returns home<br>keys 1 to 6 open a section',
  'nf.resolvedCaps':'RESOLVED', 'nf.statusCaps':'STATUS'
},

fa: {
  'doc.title':'سامانه شخصی توسعه‌دهنده',
  'brand.aria':'سامانه مازیار، صفحه اصلی',
  'crumbs.aria':'مسیر صفحه',
  'jump':'برو به',
  'rail.aria':'پیمایش اصلی',
  'totop':'↑ بالا',
  'totop.aria':'برگشت به بالای صفحه',
  'lang.group':'Language / زبان',
  'lang.live':'زبان: فارسی',
  'js.needed':'برای دیدن این صفحه باید جاوااسکریپت فعال باشد.',

  'pal.label':'برو به',
  'pal.ph':'یک صفحه، پروژه، یادداشت یا فناوری پیدا کن',
  'pal.close':'بستن',
  'pal.esc':'esc',
  'pal.closeShort':'بستن',
  'pal.results':'نتایج',
  'pal.move':'جابه‌جایی',
  'pal.open':'باز کردن',
  'pal.empty':'نتیجه‌ای برای «{q}» پیدا نشد.',
  'pal.n':'{n} نتیجه',
  'pal.none':'نتیجه‌ای پیدا نشد',
  'pal.type.Pages':'صفحه',
  'pal.type.Projects':'پروژه',
  'pal.type.Notes':'یادداشت',
  'pal.type.Technologies':'فناوری',
  'pal.type.Learning':'یادگیری',

  'nav.home':'خانه', 'nav.about':'درباره من', 'nav.projects':'پروژه‌ها', 'nav.stack':'فناوری‌ها',
  'nav.learning':'مسیر یادگیری', 'nav.lab':'آزمایشگاه', 'nav.contact':'ارتباط',
  'name.home':'خانه', 'name.about':'درباره من', 'name.projects':'پروژه‌ها', 'name.stack':'فناوری‌ها',
  'name.learning':'مسیر یادگیری', 'name.lab':'آزمایشگاه', 'name.contact':'ارتباط',
  'crumb.maziyar':'maziyar', 'crumb.about':'درباره من', 'crumb.projects':'پروژه‌ها', 'crumb.stack':'فناوری‌ها',
  'crumb.learning':'مسیر یادگیری', 'crumb.lab':'آزمایشگاه', 'crumb.contact':'ارتباط',

  'rail.processes':'فرایندهای فعال',
  'rail.none':'فرایندی در حال اجرا نیست',
  'rail.rev':'نسخه {v}',
  'rail.keys':'کلیدهای ۰ تا ۶',
  'status.focus':'تمرکز',
  'status.now':'الان',
  'word.learning':'یادگیری',

  'hero.role':'توسعه‌دهنده بک‌اند',
  'hero.system':'سامانه',
  'hero.focus':'تمرکز',
  'hero.now':'الان',
  'hero.projects':'پروژه‌ها ←',
  'hero.contact':'ارتباط ←',
  'role':'توسعه‌دهنده بک‌اند',
  'role.system':'مهندس بک‌اند',

  /* no copy.* keys on purpose: see the header comment */

  'p.completed':'تکمیل‌شده', 'p.active':'در حال توسعه', 'p.prototype':'نمونه اولیه', 'p.archived':'بایگانی‌شده',
  'l.exploring':'در حال آشنایی', 'l.learning':'در حال یادگیری', 'l.studying':'در حال مطالعه', 'l.developing':'در حال ساخت', 'l.queued':'در صف',
  'lab.s.in progress':'در حال انجام', 'lab.s.queued':'در صف', 'lab.s.published':'منتشرشده',
  'lab.k.experiment':'آزمایش', 'lab.k.prototype':'نمونه اولیه', 'lab.k.note':'یادداشت',
  'status.label':'وضعیت: {s}',
  'updated':'آخرین به‌روزرسانی: {d}',

  'state.exploring':'اولین نگاه؛ کنجکاوانه و در سطح کلی',
  'state.learning':'یادگیری ساختاریافته؛ منابع رو یکی‌یکی جلو می‌برم',
  'state.studying':'مطالعه عمیق؛ هم مبانی نظری، هم انتخاب‌ها و پیامدها',
  'state.developing':'دارم باهاش چیزهای واقعی می‌سازم',
  'state.queued':'برنامه‌ریزی شده، ولی هنوز شروع نکردم.',

  'about.title':'درباره من',
  'about.empty':'هنوز چیزی اینجا نوشته نشده.',
  'about.progress':'در حال انجام — {n}',
  'about.who':'مازیار حیدری، توسعه‌دهنده بک‌اند',
  'about.projectsGlance':'{n} پروژه، هر کدام با توضیح معماری',
  'about.contactGlance':'ایمیل، گیت‌هاب و لینکدین',
  'about.contactGlanceTg':'تلگرام، ایمیل، گیت‌هاب و لینکدین',
  'glance.WHO':'معرفی', 'glance.BUILDS':'می‌سازم', 'glance.USES':'ابزارها', 'glance.PROJECTS':'پروژه‌ها', 'glance.CONTACT':'ارتباط',
  'glance.about':'درباره من ←', 'glance.projects':'پروژه‌ها ←', 'glance.stack':'فناوری‌ها ←', 'glance.open':'باز کردن ←',
  'kv.ROLE':'نقش', 'kv.FOCUS':'تمرکز', 'kv.FRAMEWORKS':'فریم‌ورک‌ها', 'kv.LANGUAGES':'زبان‌ها',
  'kv.PLATFORM':'پلتفرم', 'kv.DATA':'پایگاه داده', 'kv.STATUS':'وضعیت',

  'projects.lede':'برای هر پروژه می‌تونی معماری، تصمیم‌های فنی و مخزن کدش رو ببینی.',
  'projects.empty':'هنوز پروژه‌ای منتشر نشده.',
  'btn.architecture':'معماری', 'btn.details':'جزئیات', 'btn.repo':'مخزن کد',
  'btn.details.for':'جزئیات: {n}', 'btn.architecture.for':'معماری: {n}', 'btn.repo.for':'مخزن کد: {n}',
  'ext.newtab':'(در تب جدید باز می‌شود)',

  'sec.overview':'نمای کلی', 'sec.problem':'مسئله', 'sec.architecture':'معماری', 'sec.technologies':'فناوری‌ها',
  'sec.decisions':'تصمیم‌های فنی', 'sec.challenges':'چالش‌ها', 'sec.body':'توضیح کامل', 'sec.outcome':'نتیجه',
  'sec.limitations':'محدودیت‌ها', 'sec.related':'موارد مرتبط', 'sec.repository':'مخزن کد',
  'cidx.overview':'نمای کلی', 'cidx.problem':'مسئله', 'cidx.architecture':'معماری', 'cidx.technologies':'فناوری‌ها',
  'cidx.decisions':'تصمیم‌ها', 'cidx.challenges':'چالش‌ها', 'cidx.body':'توضیح کامل', 'cidx.outcome':'نتیجه',
  'cidx.limitations':'محدودیت‌ها', 'cidx.related':'مرتبط', 'cidx.repository':'مخزن کد',
  'case.sections.aria':'بخش‌های صفحه پروژه',
  'back.home':'› صفحه اصلی',
  'case.back':'› پروژه‌ها',
  'case.tradeoff':'بده‌بستان: ',
  'case.problem':'مشکل',
  'case.empty':'هنوز جزئیاتی برای این پروژه منتشر نشده.',
  'pn.prev':'› قبلی', 'pn.next':'بعدی ‹',
  'pn.projects.aria':'پروژه‌های دیگر', 'pn.notes.aria':'یادداشت‌های دیگر',
  'btn.copy':'کپی', 'btn.copied':'کپی شد', 'btn.select':'انتخاب متن', 'btn.open':'باز کردن', 'btn.compose':'نوشتن ایمیل',
  'btn.more':'نمایش بیشتر', 'btn.less':'نمایش کمتر',

  'rel.note':'این موارد بر اساس فناوری‌های مشترک پیدا شدن، نه اینکه دستی انتخاب شده باشن.',
  'rel.projects':'پروژه‌ها', 'rel.notes':'یادداشت‌ها', 'rel.learning':'یادگیری',
  'more':'+{n} مورد دیگر',

  'stack.lede':'فناوری‌هایی که باهاشون کار می‌کنم، دسته‌بندی‌شده بر اساس نقشی که دارن. برای هر کدوم می‌بینی به چی وابسته‌ست و کجاها ازش استفاده شده. نشانگر موس رو روی هر ردیف نگه دار تا وابستگی‌هاش مشخص بشن.',
  'stack.empty':'هنوز فناوری‌ای ثبت نشده.',
  'dep.requires':'وابسته به', 'dep.requiredBy':'پیش‌نیاز برای', 'dep.usedIn':'به‌کار رفته در', 'dep.notes':'یادداشت‌ها',
  'dep.learning':'یادگیری', 'dep.none':'بدون وابستگی',

  'learning.lede':'چیزهایی که همین الان دارم یاد می‌گیرم. وضعیت نشون می‌ده چطور روی هر موضوع کار می‌کنم، نه اینکه چقدر بلدم.',
  'learning.running':'در حال انجام', 'learning.queued':'در صف', 'learning.related':'کارهای مرتبط',
  'learning.empty':'هنوز چیزی اینجا نیست.',

  'lab.lede':'آزمایش‌ها، نمونه‌های اولیه و یادداشت‌های فنی. اینجا چیزی عمداً کامل و نهایی نیست؛ هر مورد اول «در صف» قرار می‌گیره، بعد «در حال انجام» می‌شه و در آخر «منتشرشده».',
  'lab.search':'جست‌وجو', 'lab.kind':'نوع', 'lab.status':'وضعیت', 'lab.tech':'فناوری', 'lab.all':'همه',
  'lab.ph':'عنوان، متن یا فناوری',
  'lab.count':'{a} از {b} مورد',
  'lab.empty':'هنوز موردی منتشر نشده.',
  'lab.noMatch':'نتیجه‌ای با این فیلترها پیدا نشد.',
  'lab.clear':'پاک کردن فیلترها',
  'lab.reserved':'به‌زودی',
  'lab.next':'آزمایش بعدی',
  'lab.nextText':'هر مورد جدید همین‌که کارش رو شروع کنم اینجا اضافه می‌شه.',
  'lab.summary':'خلاصه', 'lab.writeup':'توضیح کامل', 'lab.technologies':'فناوری‌ها', 'lab.related':'موارد مرتبط',
  'lab.nowriteup':'هنوز توضیح کاملی برای این مورد منتشر نشده.',
  'lab.back':'› آزمایشگاه',
  'sections.aria':'بخش‌های صفحه',
  'fig.code':'کد', 'fig.terminal':'ترمینال', 'fig.diagram':'نمودار', 'fig.diagram.aria':'نمودار. {l}',

  'contact.title':'ارتباط',
  'contact.n1':'یک راه ارتباطی.', 'contact.n2':'دو راه ارتباطی.', 'contact.n3':'سه راه ارتباطی.', 'contact.n4':'چهار راه ارتباطی.',
  'contact.fastest':' سریع‌ترین راه، ایمیل است.',
  'contact.ledeTg':'برای ارتباط درباره پروژه‌ها، همکاری یا فرصت‌های شغلی می‌تونی از تلگرام بهم پیام بدی.',
  'contact.empty':'هنوز راه ارتباطی‌ای ثبت نشده.',
  'ch.EMAIL':'ایمیل', 'ch.GITHUB':'گیت‌هاب', 'ch.LINKEDIN':'لینکدین', 'ch.TELEGRAM':'تلگرام',
  'ch.direct':'ارتباط مستقیم', 'ch.source':'کد پروژه‌ها', 'ch.pro':'پروفایل حرفه‌ای', 'ch.quick':'پیام سریع',
  'btn.telegram':'پیام در تلگرام',

  'kind.language':'زبان', 'kind.framework':'فریم‌ورک', 'kind.database':'پایگاه داده', 'kind.cache':'کش',
  'kind.protocol':'پروتکل', 'kind.tool':'ابزار', 'kind.platform':'پلتفرم', 'kind.other':'سایر',

  'insp.label':'جزئیات',
  'insp.title':'نقشه سامانه',
  'insp.hint':'نشانگر رو روی هر گره ببر تا ارتباط‌هاش مشخص بشه، یا روش کلیک کن تا ثابت بمونه. فناوری‌ها در یک طرف هستن و پروژه‌هایی که ازشون استفاده می‌کنن در طرف دیگه.',
  'legend.contains':'شامل', 'legend.usedIn':'به‌کار رفته در',
  'insp.glance':'در یک نگاه',
  'insp.counts':'{p} پروژه، {c} فناوری، {l} موضوع یادگیری فعال',
  'node.components':'{n} فناوری', 'node.active':'{n} فعال', 'node.entries':'{n} مورد',
  'node.learning':'مسیر یادگیری', 'node.lab':'آزمایشگاه',
  'insp.kind.domain':'دسته', 'insp.kind.project':'پروژه · {s}', 'insp.kind.module':'بخش', 'insp.kind.component':'فناوری · {d}',
  'insp.components':'فناوری‌ها', 'insp.builtWith':'ساخته شده با', 'insp.openCase':'دیدن جزئیات پروژه ←',
  'insp.touches':'فناوری‌های مرتبط', 'insp.areas':'موضوع‌ها', 'insp.entries':'موارد',
  'insp.openLearning':'باز کردن مسیر یادگیری ←', 'insp.openLab':'باز کردن آزمایشگاه ←',
  'insp.learningName':'مسیر یادگیری', 'insp.labName':'آزمایشگاه',
  'insp.learningText':'چیزهایی که همین الان دارم یاد می‌گیرم، همراه با وضعیت هر کدوم.',
  'insp.labText':'آزمایش‌ها، نمونه‌های اولیه و یادداشت‌ها؛ هر کدوم بعد از تکمیل منتشر می‌شه.',
  'insp.usedIn':'به‌کار رفته در', 'insp.nothing':'هنوز جایی استفاده نشده', 'insp.requires':'وابسته به', 'insp.requiredBy':'پیش‌نیاز برای',
  'insp.notes':'یادداشت‌ها', 'insp.openStack':'دیدن در فناوری‌ها ←', 'insp.clear':'برداشتن انتخاب (esc)',
  'map.aria':'نقشه سامانه',

  'tree.about':'درباره من', 'tree.projects':'پروژه‌ها', 'tree.stack':'فناوری‌ها', 'tree.learning':'مسیر یادگیری', 'tree.lab':'آزمایشگاه', 'tree.contact':'ارتباط',
  'tree.aboutMeta':'معرفی و تمرکز',
  'tree.projectsMeta':'{n} پروژه', 'tree.stackMeta':'{n} فناوری', 'tree.learningMeta':'{n} فعال',
  'tree.labMeta':'{n} مورد', 'tree.contactMeta':'{n} راه ارتباطی',
  'open.about':'باز کردن بخش درباره من ←', 'open.projects':'باز کردن بخش پروژه‌ها ←', 'open.stack':'باز کردن بخش فناوری‌ها ←',
  'open.learning':'باز کردن مسیر یادگیری ←', 'open.lab':'باز کردن آزمایشگاه ←', 'open.contact':'باز کردن بخش ارتباط ←',

  'notice.only.en':'بیشتر محتوای این صفحه فعلاً فقط به انگلیسی نوشته شده.',
  'notice.only.fa':'بیشتر محتوای این صفحه فعلاً فقط به فارسی نوشته شده.',

  'nf.title':'۴۰۴ — صفحه پیدا نشد',
  'nf.route':'مسیر پیدا نشد',
  'nf.what':'این صفحه پیدا نشد',
  'nf.msg':'هیچ صفحه‌ای با این آدرس وجود نداره. ممکنه جابه‌جا شده باشه یا آدرس رو اشتباه وارد کرده باشی.',
  'nf.requested':'آدرس درخواستی', 'nf.resolved':'پیداشده', 'nf.status':'وضعیت', 'nf.nearest':'نزدیک‌ترین',
  'nf.none':'هیچ‌کدام', 'nf.notfound':'۴۰۴ پیدا نشد', 'nf.thisAddress':'این آدرس',
  'nf.home':'برگشت به صفحه اصلی', 'nf.back':'برگشت',
  'nf.keys':'با esc یا ۰ به صفحه اصلی برمی‌گردی<br>با کلیدهای ۱ تا ۶ هر بخش رو باز می‌کنی',
  'nf.resolvedCaps':'پیداشده', 'nf.statusCaps':'وضعیت'
}
};

/* ============ LANGUAGE STATE ============ */
function readParam(){
  try{
    var m = /[?&]lang=([a-zA-Z-]+)/.exec(root.location.search || '');
    var v = m && m[1].toLowerCase().slice(0, 2);
    return SUPPORTED.indexOf(v) > -1 ? v : '';
  }catch(e){ return ''; }
}
function readStored(){
  try{
    var v = root.localStorage.getItem(STORE_KEY);
    return SUPPORTED.indexOf(v) > -1 ? v : '';
  }catch(e){ return ''; }   /* storage blocked (private mode, sandboxed frame) */
}
function readBrowser(){
  try{
    var list = root.navigator.languages && root.navigator.languages.length ? root.navigator.languages : [root.navigator.language || ''];
    for(var i = 0; i < list.length; i++){
      var l = String(list[i] || '').toLowerCase().slice(0, 2);
      if(SUPPORTED.indexOf(l) > -1) return l;
    }
  }catch(e){}
  return '';
}

var state = {lang: readParam() || readStored() || readBrowser() || 'en'};
var listeners = [];

/* Persian glyph coverage: the design fonts are Latin only, so Vazirmatn is added for Persian visitors only.
   unicode-range subsetting keeps the download small and English visitors never request it. */
function ensureFont(){
  if(state.lang !== 'fa' || !root.document || root.document.getElementById('ds-fa-font')) return;
  var l = root.document.createElement('link');
  l.id = 'ds-fa-font'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap';
  root.document.head.appendChild(l);
}
function applyDoc(){
  var de = root.document.documentElement;
  de.setAttribute('lang', state.lang);
  de.setAttribute('dir', DIRS[state.lang]);
  ensureFont();
}

/* ============ HELPERS ============ */
function t(key, params, lang){
  lang = lang || state.lang;
  var s = (DICT[lang] && DICT[lang][key] != null) ? DICT[lang][key] : (DICT.en[key] != null ? DICT.en[key] : key);
  if(params) s = s.replace(/\{(\w+)\}/g, function(m, k){ return params[k] != null ? params[k] : m; });
  return s;
}
function has(key, lang){ return !!(DICT[lang || state.lang] && DICT[(lang || state.lang)][key] != null); }

/* Latin digits to Persian digits when the interface is Persian (counts, indexes). Dates, URLs, ids stay untouched. */
var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
function digits(v){
  v = String(v);
  return state.lang === 'fa' ? v.replace(/[0-9]/g, function(d){ return FA_DIGITS.charAt(+d); }) : v;
}

/* Search normalisation: one spelling per letter, no diacritics / ZWNJ / tatweel, Persian and Arabic-Indic digits to Latin. */
function norm(s){
  return String(s == null ? '' : s).toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[\u200c\u200d\u0640]/g, '')
    .replace(/[\u064A\u0649]/g, '\u06CC')
    .replace(/\u0643/g, '\u06A9')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\u06C0|\u0629/g, '\u0647')
    .replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 0x660); })
    .replace(/[\u06F0-\u06F9]/g, function(d){ return String(d.charCodeAt(0) - 0x6F0); });
}

/* Which language is this text written in? Counts letters by script. '' means "no letters, don't judge". */
var RE_AR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
var RE_LA = /[A-Za-z\u00C0-\u024F]/g;
function count(text){
  text = String(text == null ? '' : text).replace(/`[^`]*`/g, ' ').replace(/https?:\/\/\S+/g, ' ');
  return {fa:(text.match(RE_AR) || []).length, en:(text.match(RE_LA) || []).length};
}
function detect(text){
  var c = count(text);
  if(!c.fa && !c.en) return '';
  return c.fa >= c.en ? 'fa' : 'en';
}

function onChange(fn){ listeners.push(fn); }

/* data-i18n="key" sets textContent, data-i18n-html="key" sets innerHTML (trusted dictionary strings only),
   data-i18n-attr="aria-label:key;placeholder:key2" sets attributes. */
function apply(scope){
  var doc = root.document; if(!doc) return;
  scope = scope || doc;
  var all = function(sel){ return Array.prototype.slice.call(scope.querySelectorAll(sel)); };
  all('[data-i18n]').forEach(function(el){ el.textContent = t(el.getAttribute('data-i18n')); });
  all('[data-i18n-html]').forEach(function(el){ el.innerHTML = t(el.getAttribute('data-i18n-html')); });
  all('[data-i18n-attr]').forEach(function(el){
    el.getAttribute('data-i18n-attr').split(';').forEach(function(pair){
      var i = pair.indexOf(':'); if(i < 1) return;
      el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
    });
  });
  all('[data-lang-btn]').forEach(function(b){
    var on = b.getAttribute('data-lang-btn') === state.lang;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function set(lang, opts){
  opts = opts || {};
  if(SUPPORTED.indexOf(lang) < 0) return;
  var changed = lang !== state.lang;
  state.lang = lang;
  if(opts.persist !== false){
    try{ root.localStorage.setItem(STORE_KEY, lang); }catch(e){}
    /* keep a ?lang= that is already in the address bar in sync, so reload and shared links agree with the choice */
    try{
      if(/[?&]lang=/.test(root.location.search)){
        var u = new URL(root.location.href); u.searchParams.set('lang', lang);
        root.history.replaceState(root.history.state, '', u.pathname + u.search + u.hash);
      }
    }catch(e){}
  }
  applyDoc();
  apply();
  if(changed || opts.force) listeners.forEach(function(fn){ try{ fn(lang); }catch(err){ if(root.console) console.error(err); } });
}

applyDoc();   /* runs in <head>: lang/dir are right before the first paint */

root.DSI18N = {
  SUPPORTED: SUPPORTED, DIRS: DIRS, NAMES: NAMES, DICT: DICT,
  get lang(){ return state.lang; },
  get dir(){ return DIRS[state.lang]; },
  t: t, has: has, digits: digits, norm: norm, detect: detect, count: count, apply: apply, set: set, onChange: onChange
};
})(window);
