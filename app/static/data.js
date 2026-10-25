/* Personal Developer System: static personal data that is NOT stored in the Django database.
   Everything else (domains, technologies, projects, learning, lab) comes from the view through
   <script id="dev-system-data"> (see app/views.py and index.html) and replaces any value of the same name here. */
window.DevSystemData = {

CONFIG: {
  email: 'maziyarheydari87811@gmail.com',
  github: 'https://github.com/MH87811',
  linkedin: 'https://www.linkedin.com/in/maziyar-heydary-84b436397',
  telegram: 'https://t.me/Mr87811',
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
      availability: 'به فرصت‌های شغلی بک‌اند علاقه‌مندم'
    },

    STATE_DEF: {
      exploring: 'اولین نگاه؛ کنجکاوانه و در سطح کلی',
      learning: 'یادگیری ساختاریافته؛ منابع رو یکی‌یکی جلو می‌برم',
      studying: 'مطالعه عمیق؛ هم مبانی نظری، هم انتخاب‌ها و پیامدها',
      developing: 'دارم باهاش چیزهای واقعی می‌سازم'
    },

    ABOUT: {
      lede: 'توسعه‌دهنده بک‌اند هستم و بیشتر با Django، Laravel و Go کار می‌کنم. دوست دارم علاوه بر ساختن قابلیت‌های جدید، بفهمم برنامه در لایه‌های پایین‌تر چطور کار می‌کنه؛ از پایگاه داده و شبکه گرفته تا پردازش‌ها و سرویس‌هایی که روی سرور اجرا می‌شن.',

      body: [
        'بخش زیادی از کارم به ساخت API، پیاده‌سازی احراز هویت و کنار هم قرار دادن بخش‌های مختلف یک برنامه مربوط می‌شه. در پروژه‌هام سعی می‌کنم ساختار کد روشن باشه، هر بخش مسئولیت مشخصی داشته باشه و وقتی مشکلی پیش میاد، پیدا کردن علتش سخت‌تر از خود مشکل نشه.',
        'در کنار توسعه بک‌اند، دارم دانشم رو در زمینه شبکه، زیرساخت، تست و طراحی سیستم بیشتر می‌کنم. برام مهمه فقط بدونم چطور از یک ابزار استفاده کنم؛ می‌خوام دلیل انتخابش و تأثیرش روی بقیه سیستم رو هم بفهمم.'
      ],

      principles: [
        [
          'سادگیِ قابل نگهداری',
          'کدی که بعداً بشه راحت فهمید و تغییرش داد، معمولاً انتخاب بهتریه.'
        ],
        [
          'خطاهای قابل‌ردیابی',
          'وقتی چیزی درست کار نمی‌کنه، باید بتونیم بفهمیم مشکل از کجاست.'
        ],
        [
          'ساختار روشن',
          'مسئولیت هر بخش باید مشخص باشه و وابستگی‌ها بی‌دلیل پیچیده نشن.'
        ],
        [
          'فهمیدن پشت صحنه',
          'استفاده از فریم‌ورک مهمه، اما شناخت پایگاه داده، شبکه و نحوه اجرای برنامه هم ارزش زیادی داره.'
        ]
      ]
    },

    COPY: {
      'copy.hero.sum': 'با Django، Laravel و Go، API و سرویس‌های بک‌اند می‌سازم و به بخش‌هایی که برنامه رو سرپا نگه می‌دارن اهمیت می‌دم.',
      'copy.hero.focus': 'سیستم‌های قابل‌اعتماد',
      'copy.about.builds': 'API، سیستم‌های احراز هویت و سرویس‌های بلادرنگ',
      'copy.about.uses': 'Django، DRF، Laravel و Go روی Linux'
    }
  }
}
};