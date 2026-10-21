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
}

};