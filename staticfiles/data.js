/* Personal Developer System: static personal data that is NOT stored in the Django database.
   Everything else (domains, technologies, projects, learning, lab) comes from the view through
   <script id="dev-system-data"> (see app/views.py and index.html) and replaces any value of the same name here. */
window.DevSystemData = {

CONFIG: {
  email: 'maziyarheydari87811@gmail.com',
  github: 'https://github.com/MH87811',
  linkedin: 'https://www.linkedin.com/in/maziyar-heydary-84b436397',
  availability: 'open to backend roles',
  rev: '2026.10'
},

STATE_DEF: {
  exploring:'first look, broad and curious',
  learning:'structured, working through material',
  studying:'deep reading, theory and trade-offs',
  developing:'building real things with it'
},

ABOUT: {
  lede:'Backend developer. I build the part of an application that has to be right: data models, APIs, authentication, and the services that keep them running.',
  body:[
    'My main tools are Django and Django REST Framework, Laravel, and Go. I work on Linux and spend as much time on the layer below the framework (processes, networks, databases) as on the framework itself, because that is where most production problems start.',
    'I prefer small interfaces, explicit data models, and failures that are visible instead of silent. Right now I am studying networking and system design, building in Go, and writing up experiments in the lab.'
  ],
  principles:[
    ['Make failure visible','Errors should be loud, specific and traceable to a cause.'],
    ['Keep the data model boring','Clear tables and constraints outlast clever abstractions.'],
    ['Understand the layer below','Frameworks change. Sockets, processes and SQL change much less.']
  ]
},

/* Persian (or English) versions of content, supplied by the owner. EMPTY ON PURPOSE: nothing here is
   machine-translated or invented. Whatever is missing is shown in its original language and marked so.
   Only add text you wrote or approved. Shape (every key optional, only the fields you give are replaced):

   I18N_CONTENT: {
     fa: {
       COPY:   { 'copy.hero.sum': '...', 'copy.hero.focus': '...', 'copy.about.builds': '...', 'copy.about.uses': '...' },
       CONFIG: { availability: '...' },
       ABOUT:  { lede: '...', body: ['...'], principles: [['title', 'text']], sections: [{t: '...', p: ['...']}] },
       STATE_DEF: { exploring: '...' },
       DOMAINS: { '<category-slug>': { n: '...', r: '...' } },
       TECH:    { '<technology-slug>': { r: '...' } },
       PROJ:    { '<project-slug>': { name: '...', desc: '...', kind: '...', overview: ['...'], problem: ['...'],
                                      outcome: ['...'], limitations: ['...'], decisions: [{t:'',w:'',x:''}],
                                      challenges: [{p:'',r:''}], body: [{type:'p', text:'...'}] } },
       LEARN:   { '<learning-slug>': { n: '...', note: '...' } },
       LAB:     { '<entry-slug>': { t: '...', d: '...', body: [{type:'p', text:'...'}] } }
     }
   }
   Django can supply the same fields per item as item.i18n.fa (see the backend checklist); it wins over this file. */
I18N_CONTENT: {
  fa: {
    CONFIG: {
      availability: 'آماده برای فرصت‌های شغلی بک‌اند'
    },

    STATE_DEF: {
      exploring: 'آشنایی اولیه و بررسی گستردهٔ موضوع',
      learning: 'یادگیری ساختاریافته و پیشروی مرحله‌به‌مرحله',
      studying: 'مطالعهٔ عمیق، مبانی نظری و بررسی بده‌بستان‌ها',
      developing: 'ساخت و توسعهٔ پروژه‌های واقعی'
    },

    ABOUT: {
      lede: 'توسعه‌دهندهٔ بک‌اند هستم. روی بخش‌هایی از یک برنامه کار می‌کنم که باید درست و قابل‌اعتماد باشند: مدل‌های داده، APIها، احراز هویت و سرویس‌هایی که همه‌چیز را سرپا نگه می‌دارند.',

      body: [
        'ابزارهای اصلی من Django و Django REST Framework، لاراول و Go هستند. با لینوکس کار می‌کنم و به‌اندازهٔ فریم‌ورک‌ها، به لایه‌های زیرین آن‌ها، از فرایندها و شبکه‌ها گرفته تا پایگاه‌های داده، اهمیت می‌دهم؛ چون بسیاری از مشکلات محیط واقعی از همین لایه‌ها شروع می‌شوند.',
        'رابط‌های ساده، مدل‌های دادهٔ شفاف و خطاهایی را ترجیح می‌دهم که آشکار و قابل‌ردیابی باشند، نه خطاهایی که بی‌سروصدا پنهان می‌مانند. این روزها روی شبکه و طراحی سیستم مطالعه می‌کنم، با Go پروژه می‌سازم و آزمایش‌ها و آموخته‌هایم را در بخش آزمایشگاه ثبت می‌کنم.'
      ],

      principles: [
        [
          'خطاها را آشکار کن',
          'خطاها باید واضح، دقیق و تا رسیدن به علت اصلی قابل‌ردیابی باشند.'
        ],
        [
          'مدل داده را ساده نگه دار',
          'جدول‌ها و محدودیت‌های شفاف، معمولاً از انتزاع‌های پیچیده ماندگارترند.'
        ],
        [
          'لایهٔ زیرین را بشناس',
          'فریم‌ورک‌ها تغییر می‌کنند؛ اما سوکت‌ها، فرایندها و SQL بسیار پایدارترند.'
        ]
      ]
    },

    COPY: {
      'copy.hero.sum': 'یادداشت‌ها، پروژه‌ها و آزمایش‌های من در توسعهٔ بک‌اند و مهندسی سیستم.',
      'copy.hero.focus': 'تمرکز فعلی: بک‌اند، API، پایگاه داده، پردازش پس‌زمینه و زیرساخت.',
      'copy.about.builds': 'ساخت سرویس‌های بک‌اند با تمرکز بر شفافیت، قابلیت نگهداری و رفتار قابل‌پیش‌بینی.',
      'copy.about.uses': 'ابزارهایی که استفاده می‌کنم، مفاهیمی که بررسی می‌کنم و تصمیم‌هایی که در مسیر توسعه می‌گیرم.'
    }
  }
}
};