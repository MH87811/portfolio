/* Personal Developer System: content data (browser-only, hardcoded).
   Data contract: see "Data contract" in the delivery notes.
   Replace the CONFIG placeholders with your real details. */
window.DevSystemData = {

CONFIG: {
  email: 'maziyarheydari87811@gmail.com',
  github: 'https://github.com/MH87811',
  linkedin: 'https://www.linkedin.com/in/maziyar-heydary-84b436397',
  availability: 'open to backend roles',
  rev: '2026.10'
},

DOMAINS: {
  backend:{n:'BACKEND', r:'Frameworks for building APIs and web back ends.'},
  languages:{n:'LANGUAGES', r:'What the code is written in.'},
  systems:{n:'SYSTEMS', r:'The layer below the framework: operating system, network and protocols.'},
  data:{n:'DATA', r:'Where state lives.'},
  tools:{n:'TOOLS', r:'How code is versioned, packaged and served.'}
},

STACK_ORDER: ['backend','languages','systems','data','tools'],
GRAPH_ORDER: ['backend','systems','data','tools'],

/* d: stack group, g: group on the home map (if shown there) */
TECH: {
  django:{n:'Django', d:'backend', g:'backend', r:'Full-featured Python framework: ORM, migrations, auth and admin out of the box.', needs:['python']},
  drf:{n:'DRF', d:'backend', g:'backend', r:'Django REST Framework. Serializers, viewsets, permissions and throttling for APIs.', needs:['django']},
  laravel:{n:'Laravel', d:'backend', g:'backend', r:'PHP framework with Eloquent, queues and a conventional structure.', needs:['php']},
  gin:{n:'Gin', d:'backend', r:'Minimal HTTP framework for Go. Routing and middleware without much else.', needs:['go']},
  python:{n:'Python', d:'languages', r:'Language behind Django and DRF. Services, scripts and tooling.', needs:[]},
  php:{n:'PHP', d:'languages', r:'Language behind Laravel applications.', needs:[]},
  go:{n:'Go', d:'languages', g:'backend', r:'Compiled language for small, fast services. Used with Gin for HTTP.', needs:[]},
  javascript:{n:'JavaScript', d:'languages', r:'Front-end behavior and small tools.', needs:[]},
  linux:{n:'Linux', d:'systems', g:'systems', r:'Where the code runs: processes, permissions, services, logs and the shell.', needs:[]},
  networking:{n:'Networking', d:'systems', g:'systems', r:'TCP/IP, DNS, HTTP, TLS and proxies. The path a request takes before it reaches code.', needs:[]},
  websockets:{n:'WebSockets', d:'systems', g:'systems', r:'Long-lived connections for live data: lifecycle, fan-out and slow clients.', needs:['networking']},
  apis:{n:'APIs', d:'systems', g:'systems', r:'REST design, versioning, authentication, pagination and error contracts.', needs:['networking']},
  postgresql:{n:'PostgreSQL', d:'data', g:'data', r:'Primary relational database. Constraints, indexes and query plans.', needs:[]},
  SQLite:{n:'SQLite', d:'data', g:'data', r:'Relational database common in Laravel projects.', needs:[]},
  redis:{n:'Redis', d:'data', g:'data', r:'In-memory store for caches, token state and channel layers.', needs:[]},
  git:{n:'Git', d:'tools', g:'tools', r:'Version control and the unit of every change.', needs:[]},
  docker:{n:'Docker', d:'tools', g:'tools', r:'Reproducible environments for services and their dependencies.', needs:['linux']},
  nginx:{n:'Nginx', d:'tools', g:'tools', r:'Reverse proxy and static server in front of application processes.', needs:['linux','networking']}
},

PROJ: [
  {
    id:'gin-auth', name:'GIN-AUTH', lang:'Go / Gin', kind:'Authentication System', status:'completed',
    desc:'Token-based authentication service in Go. Registration, login, refresh and logout behind a small HTTP API.',
    uses:['go','gin','apis','postgresql','redis','docker','git'],
    repo:'https://github.com/MH87811/gin-auth',
    overview:[
      'Gin-Auth is an authentication service written in Go. It handles registration, login, token refresh and logout behind a small HTTP API, so other services can depend on one place for identity.',
      'The goal was a codebase that reads end to end: one route, one handler, one service function, one query.'
    ],
    arch:[
      {l:'CLIENT', n:[{t:'Web or mobile client', s:'HTTPS + JSON'}]},
      {l:'EDGE', n:[{t:'Gin router', s:'versioned routes'}]},
      {l:'MIDDLEWARE', n:[{t:'Request ID', s:'trace every call'},{t:'Rate limit', s:'before auth'},{t:'Token check', s:'verify access token'}]},
      {l:'HANDLERS', n:[{t:'register', s:'POST'},{t:'login', s:'POST'},{t:'refresh', s:'POST'},{t:'logout', s:'POST'}]},
      {l:'SERVICES', n:[{t:'Auth service', s:'credentials and rules'},{t:'Token service', s:'issue, rotate, revoke'}]},
      {l:'STORAGE', n:[{t:'PostgreSQL', s:'users'},{t:'Redis', s:'refresh tokens, revocation', side:true}]}
    ],
    extras:[['JWT','signed, short-lived access tokens'],['bcrypt','adaptive password hashing']],
    decisions:[
      {t:'Short-lived access tokens with rotating refresh tokens', w:'A leaked access token expires quickly, and sessions can still be revoked on the server.', x:'One extra round trip when an access token expires.'},
      {t:'Passwords hashed with bcrypt', w:'An adaptive cost keeps brute force expensive as hardware improves.', x:'Hashing is deliberately slow, so login latency is dominated by it.'},
      {t:'Thin handlers, rules in services', w:'Business logic can be tested without starting an HTTP server.', x:'More files for a small codebase.'},
      {t:'Revocation state in Redis', w:'The check runs on every request, and entries can expire together with the token.', x:'A second datastore to run and monitor.'}
    ],
    challenges:[
      {p:'Detecting refresh token reuse', r:'Refresh tokens rotate on every use. Presenting one that was already used invalidates the whole token family.'},
      {p:'Middleware order', r:'Rate limiting runs before token verification so unauthenticated floods are cheap to reject. Tests pin the order.'},
      {p:'A consistent error contract', r:'Every failure returns the same JSON shape and a stable error code, so clients never parse messages.'}
    ]
  },
  {
    id:'channels-pulse', name:'CHANNELS-PULSE', lang:'Django / Channels', kind:'Realtime Event Service', status:'prototype',
    desc:'Prototype that pushes events to browsers over WebSockets. A DRF endpoint accepts events and Channels fans them out through Redis.',
    uses:['python','django','drf','websockets','redis','postgresql'],
    repo:'https://github.com/MH87811/channels-pulse',
    overview:[
      'Channels-Pulse explores how a Django back end can push events to connected browsers. A DRF endpoint accepts an event, stores it, and Django Channels delivers it to every subscribed client.',
      'It exists to find out where a WebSocket service first becomes hard: connection count, slow clients and reconnects.'
    ],
    arch:[
      {l:'CLIENT', n:[{t:'Browser', s:'WebSocket'}]},
      {l:'SERVER', n:[{t:'ASGI server', s:'HTTP and WebSocket'}]},
      {l:'CONSUMERS', n:[{t:'Channels consumer', s:'auth on connect'}]},
      {l:'CHANNEL LAYER', n:[{t:'Redis', s:'groups shared across workers', side:true}]},
      {l:'API', n:[{t:'DRF endpoint', s:'accepts events'}]},
      {l:'STORAGE', n:[{t:'PostgreSQL', s:'event log'}]}
    ],
    extras:[['Django Channels','consumers and channel layers']],
    decisions:[
      {t:'Authenticate during the handshake', w:'An unauthenticated socket is rejected before it holds a connection open.', x:'The token has to travel with the connection request.'},
      {t:'Redis as the channel layer', w:'Several ASGI workers can share the same groups.', x:'Messages in the layer are not durable, so the event log is the source of truth.'}
    ],
    challenges:[
      {p:'Reconnects', r:'Clients send the last event id they saw, and the server replays the gap from the event log.'},
      {p:'Slow consumers', r:'Each connection has a bounded send queue. Clients that fall behind are disconnected instead of stalling the group.'}
    ]
  },
  {
    id:'maziyar-system', name:'MAZIYAR-SYSTEM', lang:'HTML / CSS / JavaScript', kind:'Personal Developer System', status:'active',
    desc:'This site. A portfolio built as a small software system, with technologies and projects drawn as a dependency graph.',
    uses:['javascript','git'],
    repo:'https://github.com/MH87811/maziyar-system',
    overview:[
      'A portfolio designed as a system instead of a page. Every section is a module, and the relationships between technologies and projects are drawn as a graph instead of listed.',
      'It ships as a single page with no framework and no build step. Content lives as data, so a new project or lab entry is one object.'
    ],
    arch:[
      {l:'DATA', n:[{t:'Content objects', s:'projects, stack, learning, lab'}]},
      {l:'ROUTER', n:[{t:'Hash routes', s:'one URL per module'}]},
      {l:'VIEWS', n:[{t:'Map',s:'home'},{t:'Projects',s:'case studies'},{t:'Stack',s:'index'},{t:'Learning',s:'states'},{t:'Lab',s:'entries'}]},
      {l:'RENDER', n:[{t:'HTML nodes', s:'text stays crisp'},{t:'SVG edges', s:'measured from the DOM', side:true}]}
    ],
    extras:[],
    decisions:[
      {t:'Content as data', w:'Adding a project does not touch layout code.', x:'No editing interface. Changes go through the source.'},
      {t:'Edges measured from the DOM', w:'Text stays real HTML and layout stays in CSS. Lines follow wherever the nodes land.', x:'Edges are recomputed on resize.'},
      {t:'A separate layout for phones', w:'A graph does not fit a narrow screen, so the same data renders as an expandable tree.', x:'Two presentations of one data set to maintain.'}
    ],
    challenges:[
      {p:'Keeping the graph legible', r:'Hierarchy uses solid elbows, dependencies use thin dashed curves, and everything unrelated to the focused node dims.'},
      {p:'Working without a mouse', r:'Nodes are buttons, and keyboard focus traces connections the same way hover does.'}
    ]
  }
],

LEARN: [
  {id:'networking', n:'Networking', s:'exploring', note:'Following a request through DNS, TCP, TLS and the proxy in front of the app.', t:['networking','linux']},
  {id:'testing', n:'Testing', s:'learning', note:'Test structure for Django and DRF: fixtures, factories and what to leave to integration tests.', t:['django','drf']},
  {id:'go', n:'Go', s:'developing', note:'Building services with Gin. Concurrency, error handling and project layout.', t:['go','gin']},
  {id:'system-design', n:'System design', s:'studying', note:'Caching, queues, consistency and how services fail under load.', t:['apis','redis','postgresql']},
  {id:'observability', n:'Observability', s:'queued', note:'Structured logs, metrics and tracing for the services above.', t:[]},
  {id:'queues', n:'Message queues', s:'queued', note:'Background work beyond what a Redis list can reasonably carry.', t:['redis']}
],

STATE_DEF: {
  exploring:'first look, broad and curious',
  learning:'structured, working through material',
  studying:'deep reading, theory and trade-offs',
  developing:'building real things with it'
},

LEARN_LINKS: ['networking','go','django','apis'],

LAB: [
  {id:'rate-limiting-in-go', kind:'EXPERIMENT', s:'in progress', t:'Rate limiting in Go', d:'Token bucket against sliding window as a Gin middleware, measured under bursty traffic.', tags:['go','apis','redis']},
  {id:'websocket-fanout', kind:'PROTOTYPE', s:'in progress', t:'WebSocket fan-out', d:'Broadcasting events to many Channels consumers through a Redis channel layer. Where does it saturate first?', tags:['django','websockets','redis']},
  {id:'anatomy-of-a-request', kind:'NOTE', s:'queued', t:'Anatomy of a request', d:'Following one HTTP request from DNS lookup to the database row, using curl, tcpdump and nginx logs.', tags:['networking','linux','nginx']},
  {id:'safe-migrations', kind:'NOTE', s:'queued', t:'Safe migrations', d:'Running Django migrations against a live PostgreSQL table without blocking writes.', tags:['django','postgresql']}
],

LAB_LINKS: ['linux','networking','websockets','redis','go'],

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