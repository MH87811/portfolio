(function(){
'use strict';

/* ============ ADAPTER: the single data integration point ============
   Today: reads window.DevSystemData (developer-system-data.js).
   Later: if the Django template renders
     {{ developer_system_data|json_script:"dev-system-data" }}
   its keys are merged over the defaults, so the page keeps rendering
   even when no server data exists. */
var DevSystemAdapter = {
  load: function(){
    var data = window.DevSystemData || {};
    var el = document.getElementById('dev-system-data');
    if(el){
      try{
        var remote = JSON.parse(el.textContent);
        Object.keys(remote).forEach(function(k){ data[k] = remote[k]; });
      }catch(err){
        if(window.console) console.warn('dev-system-data could not be parsed; using bundled data.', err);
      }
    }
    return data;
  }
};

var D = DevSystemAdapter.load();
var CONFIG = D.CONFIG, DOMAINS = D.DOMAINS, STACK_ORDER = D.STACK_ORDER, GRAPH_ORDER = D.GRAPH_ORDER,
    TECH = D.TECH, PROJ = D.PROJ, LEARN = D.LEARN, STATE_DEF = D.STATE_DEF, LEARN_LINKS = D.LEARN_LINKS,
    LAB = D.LAB, LAB_LINKS = D.LAB_LINKS, ABOUT = D.ABOUT;

/* ============ HELPERS ============ */
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var pad = function(n){ return n < 10 ? '0'+n : ''+n; };
var projById = function(id){ return PROJ.filter(function(p){return p.id===id;})[0]; };
var host = function(u){ return u.replace(/^https?:\/\//,'').replace(/\/$/,''); };
var curWord = 'learning';   /* the rotating "CURRENTLY" word */
var wantFocus = null;       /* stack row to focus after navigating from a case study */

function glyph(s){
  var c = {
    exploring:'<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.6 3.2" class="g-spin"/>',
    learning:'<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor"/>',
    studying:'<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/>',
    developing:'<circle cx="10" cy="10" r="7" class="g-ring" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="10" cy="10" r="3.6" fill="currentColor"/>',
    queued:'<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-opacity=".6"/>'
  };
  return '<svg class="glyph '+s+'" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">'+c[s]+'</svg>';
}
function stat(s){
  var c = {
    completed:'<rect x="2" y="2" width="8" height="8" fill="currentColor"/>',
    active:'<circle cx="6" cy="6" r="2.6" fill="currentColor"/><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1"/>',
    prototype:'<rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 1.6"/>'
  };
  return '<svg class="sg '+s+'" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">'+c[s]+'</svg>';
}
function chips(ids, pin){
  return '<span class="chips">'+ids.map(function(id){
    var t = TECH[id]; if(!t) return '';
    if(pin && t.g) return '<button class="chip" data-pin="'+id+'">'+t.n+'</button>';
    return '<span class="chip">'+t.n+'</span>';
  }).join('')+'</span>';
}
function activeLearn(){ return LEARN.filter(function(l){return l.s!=='queued';}); }
function usedIn(id){ return PROJ.filter(function(p){return p.uses.indexOf(id)>-1;}); }

/* ============ SHELL: rail, crumbs, status ============ */
var NAV = [
  ['home','/'],['about','about/'],['projects','projects/',PROJ.length],['stack','stack/',Object.keys(TECH).length],
  ['learning','learning/',LEARN.length],['lab','lab/',LAB.length],['contact','contact/',3]
];
function buildRail(){
  var h = '<div><span class="lbl">/maziar</span><div class="rlist">';
  NAV.forEach(function(n,i){
    h += '<a href="#'+n[0]+'" data-v="'+n[0]+'"><span class="k">'+i+'</span><span class="rn">'+n[1]+'</span><span class="rm">'+(n[2]?pad(n[2]):'')+'</span></a>';
  });
  h += '</div></div><div class="proc"><span class="lbl">active processes</span>';
  activeLearn().forEach(function(l){
    h += '<a href="#learning">'+glyph(l.s)+'<span>'+l.n.toLowerCase()+'<small>'+l.s+'</small></span></a>';
  });
  h += '</div><div class="rev">rev '+CONFIG.rev+'<br>keys 0 to 6</div>';
  $('#rail').innerHTML = h;
}
function setChrome(r){
  var view = r.v === 'project' ? 'projects' : r.v;
  $('#shell').setAttribute('data-view', r.v === 'home' ? 'home' : view);
  $$('.rlist a').forEach(function(a){ a.classList.toggle('on', a.dataset.v === (r.v==='project'?'projects':r.v)); });
  var segs = [['maziar','#home']];
  if(r.v !== 'home') segs.push([view, '#'+view]);
  if(r.v === 'project') segs.push([r.p.id, '#'+r.p.id]);
  $('#crumbs').innerHTML = segs.map(function(s,i){
    var last = i === segs.length-1;
    return '<i>/</i>' + (last ? '<span class="cur-seg">'+s[0]+'</span>' : '<a href="'+s[1]+'">'+s[0]+'</a>');
  }).join('');
  var path = '/' + segs.map(function(s){return s[0];}).join('/');
  $('#status').innerHTML = '<span><b>'+path+'</b></span><span><span>FOCUS <b>reliable systems</b></span><span>CURRENTLY <b class="cur">'+curWord+'</b></span></span>';
  document.title = 'Personal Developer System';
}

/* ============ ROUTER ============ */
var VIEWS = ['about','projects','stack','learning','lab','contact'];
function route(){
  var h = (location.hash||'').slice(1);
  if(VIEWS.indexOf(h) > -1) return {v:h};
  var p = projById(h); if(p) return {v:'project', p:p};
  return {v:'home'};
}
var booted = false;
function render(){
  var r = route();
  var stage = $('#stage');
  var html = ({home:viewHome, about:viewAbout, projects:viewProjects, stack:viewStack, learning:viewLearning, lab:viewLab, contact:viewContact, project:function(){return viewProject(r.p);}})[r.v]();
  stage.innerHTML = html;
  setChrome(r);
  stage.scrollTop = 0; window.scrollTo(0,0);
  if(r.v === 'home') initMap();
  if(r.v === 'project') initCase();
  if(r.v === 'stack') initStack();
  booted = true;
}
window.addEventListener('hashchange', render);

/* ============ VIEWS ============ */
function head(path, title, lede){
  return '<a class="back" href="#home">‹ /maziar</a><header class="vhead"><p class="eyebrow">'+path+'</p><h1>'+title+'</h1>'+(lede?'<p class="lede">'+lede+'</p>':'')+'</header>';
}

/* ----- home ----- */
var MAP = {rows:'', total:0};
function viewHome(){
  var boot = !booted;
  var rows = [], row = 1, nodes = '';
  GRAPH_ORDER.forEach(function(g, gi){
    var ids = Object.keys(TECH).filter(function(k){return TECH[k].g===g;});
    var start = row;
    ids.forEach(function(id){
      nodes += '<button class="node tech'+(boot?' bnode':'')+'" style="grid-column:3;grid-row:'+row+';--c:3;--r:'+row+'" data-id="'+id+'"><i class="sq"></i><span>'+TECH[id].n+'</span></button>';
      rows.push('32px'); row++;
    });
    nodes += '<button class="node dom'+(boot?' bnode':'')+'" style="grid-column:2;grid-row:'+start+'/'+row+';align-self:center;--c:2;--r:'+start+'" data-id="dom:'+g+'"><b>'+DOMAINS[g].n+'</b><small>'+pad(ids.length)+' components</small></button>';
    if(gi < GRAPH_ORDER.length-1){ rows.push('10px'); row++; }
  });
  var mods = PROJ.map(function(p, i){
    return '<button class="node mod'+(boot?' bnode':'')+'" style="--c:4;--r:'+(i*4)+'" data-id="m:'+p.id+'"><span class="mt"><b>'+p.name+'</b><small>'+p.lang+'</small></span>'+stat(p.status)+'</button>';
  }).join('') +
  '<button class="node mod'+(boot?' bnode':'')+'" style="--c:4;--r:14" data-id="m:learning"><span class="mt"><b>LEARNING</b><small>'+activeLearn().length+' active</small></span>'+glyph('developing').replace('width="20" height="20"','width="14" height="14"')+'</button>' +
  '<button class="node mod'+(boot?' bnode':'')+'" style="--c:4;--r:16" data-id="m:lab"><span class="mt"><b>LAB</b><small>'+LAB.length+' entries</small></span><svg class="sg" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4.5 1.5h3M5 1.5v3.2L2 10h8L7 4.7V1.5" fill="none" stroke="currentColor" stroke-width="1.1"/></svg></button>';
  MAP.rows = rows.join(' '); MAP.total = row;
  return '<section class="view home'+(boot?' boot':'')+'">' +
    '<div class="mapwrap"><div class="map" id="map" style="grid-template-rows:'+MAP.rows+'">' +
    '<svg class="edges" id="edges" aria-hidden="true"></svg>' +
    '<div class="rootcol" style="grid-row:1/'+MAP.total+'">' + rootBlock(boot) + '<i class="port" id="port"></i></div>' +
    nodes + '<div class="mods" style="grid-row:1/'+MAP.total+'">'+mods+'</div>' +
    '</div><aside class="inspect" id="inspect" aria-live="polite"></aside></div>' +
    mobileTree() + '</section>';
}
function rootBlock(boot){
  var r = function(i){ return boot ? ' reveal" style="--i:'+i : ''; };
  return '<p class="eyebrow'+r(0)+'">/maziar</p>' +
    '<h1 class="name'+r(1)+'"><span>MAZIAR</span><span>HEYDARI</span></h1>' +
    '<p class="role'+r(2)+'">BACKEND DEVELOPER</p>' +
    '<p class="sum'+r(3)+'">I build APIs and services with Django, Laravel and Go, and I care about the parts that keep them running.</p>' +
    '<dl class="sys'+r(4)+'"><div><dt>SYSTEM</dt><dd>backend engineer</dd></div><div><dt>FOCUS</dt><dd>reliable systems</dd></div><div><dt>CURRENTLY</dt><dd><span class="cur">'+curWord+'</span></dd></div></dl>' +
    '<div class="rootlinks'+r(5)+'"><a href="#projects">projects →</a><a href="#contact">contact →</a></div>';
}

/* ----- map behavior ----- */
var edges = [], hover = null, pin = null, drewOnce = false, mapObserver = null;
function initMap(){
  hover = null; pin = null; edges = [];
  var map = $('#map'); if(!map) return;
  if(mapObserver) mapObserver.disconnect();
  mapObserver = new ResizeObserver(function(){ drawEdges(); });
  mapObserver.observe(map);
  map.addEventListener('mouseover', function(e){ var n = e.target.closest('[data-id]'); if(n){ hover = n.dataset.id; paint(); } });
  map.addEventListener('mouseleave', function(){ hover = null; paint(); });
  map.addEventListener('focusin', function(e){ var n = e.target.closest('[data-id]'); if(n){ hover = n.dataset.id; paint(); } });
  map.addEventListener('focusout', function(){ hover = null; paint(); });
  map.addEventListener('click', function(e){
    var n = e.target.closest('[data-id]');
    if(n){ pin = (pin === n.dataset.id) ? null : n.dataset.id; }
    else if(!e.target.closest('a')){ pin = null; }
    paint();
  });
  $('#inspect').addEventListener('click', function(e){
    var b = e.target.closest('[data-pin]'); if(b){ pin = b.dataset.pin; hover = null; paint(); }
  });
  drawEdges(); paint();
}
function elbow(x1,y1,x2,y2){
  var dy = y2-y1;
  if(Math.abs(dy) < 1) return 'M'+x1+' '+y1+'H'+x2;
  var xm = x1 + (x2-x1)/2, d = dy>0?1:-1, r = Math.min(8, Math.abs(dy)/2, (x2-x1)/2);
  return 'M'+x1+' '+y1+'H'+(xm-r)+'Q'+xm+' '+y1+' '+xm+' '+(y1+d*r)+'V'+(y2-d*r)+'Q'+xm+' '+y2+' '+(xm+r)+' '+y2+'H'+x2;
}
function drawEdges(){
  var map = $('#map'), svg = $('#edges'); if(!map || !svg) return;
  var mr = map.getBoundingClientRect(); if(!mr.width) return;
  var pt = function(el, side){ var r = el.getBoundingClientRect(); return {x:(side==='r'?r.right:r.left)-mr.left, y:r.top+r.height/2-mr.top}; };
  var port = $('#port'), p0 = pt(port,'r');
  p0.x = port.getBoundingClientRect().left + 3.5 - mr.left;
  var first = !drewOnce && $('.home').classList.contains('boot');
  var out = '', list = [];
  var add = function(a,b,cls,d,i){
    list.push({a:a,b:b});
    out += '<path class="edge '+cls+(first?(cls==='h'?' draw':' fade'):'')+'" data-a="'+a+'" data-b="'+b+'" d="'+d+'"'+(first&&cls==='h'?' pathLength="1" style="--dl:'+(0.35+i*0.05)+'s"':'')+'/>';
  };
  var k = 0;
  GRAPH_ORDER.forEach(function(g){
    var dn = $('[data-id="dom:'+g+'"]'); if(!dn) return;
    var a = pt(dn,'l'), ar = pt(dn,'r');
    add('root','dom:'+g,'h',elbow(p0.x,p0.y,a.x,a.y),k++);
    Object.keys(TECH).filter(function(t){return TECH[t].g===g;}).forEach(function(t){
      var tn = $('[data-id="'+t+'"]'); var b = pt(tn,'l');
      add('dom:'+g,t,'h',elbow(ar.x,ar.y,b.x,b.y),k++);
    });
  });
  var mods = PROJ.map(function(p){return {id:'m:'+p.id, t:p.uses};}).concat([{id:'m:learning',t:LEARN_LINKS},{id:'m:lab',t:LAB_LINKS}]);
  mods.forEach(function(m){
    var mn = $('[data-id="'+m.id+'"]'); var b = pt(mn,'l');
    m.t.forEach(function(t){
      if(!TECH[t] || !TECH[t].g) return;
      var tn = $('[data-id="'+t+'"]'); var a = pt(tn,'r');
      var kx = (b.x-a.x)*0.55;
      add(t,m.id,'d','M'+a.x+' '+a.y+'C'+(a.x+kx)+' '+a.y+' '+(b.x-kx)+' '+b.y+' '+b.x+' '+b.y,0);
    });
  });
  svg.setAttribute('viewBox','0 0 '+mr.width+' '+mr.height);
  svg.innerHTML = out; edges = list; drewOnce = true;
  paint();
}
function domOfTech(t){ return 'dom:'+TECH[t].g; }
function related(id){
  var s = {}; s[id] = 1;
  if(id.indexOf('dom:') === 0){ s.root = 1; edges.forEach(function(e){ if(e.a===id) s[e.b] = 1; }); }
  else if(id.indexOf('m:') === 0){ s.root = 1; edges.forEach(function(e){ if(e.b===id){ s[e.a] = 1; s[domOfTech(e.a)] = 1; } }); }
  else { s.root = 1; s[domOfTech(id)] = 1; edges.forEach(function(e){ if(e.a===id && e.b.indexOf('m:')===0) s[e.b] = 1; }); }
  return s;
}
function paint(){
  var map = $('#map'); if(!map) return;
  var act = pin || hover, s = act ? related(act) : null;
  $$('.node', map).forEach(function(n){
    var id = n.dataset.id;
    n.classList.toggle('dim', !!s && !s[id]);
    n.classList.toggle('is-active', id === act);
  });
  $$('.edge', map).forEach(function(e){
    var on = !!s && s[e.dataset.a] && s[e.dataset.b];
    e.classList.toggle('on', !!on);
    e.classList.toggle('off', !!s && !on);
  });
  $('#inspect').innerHTML = inspectHTML(act);
}
function inspectHTML(id){
  if(!id){
    return '<div><span class="lbl">inspector</span><h3>System map</h3></div>' +
      '<div><p>Hover a node to trace what connects to it. Select one to pin it. Components sit on the left, the work that uses them on the right.</p>' +
      '<ul class="legend"><li><i class="lg h"></i>contains</li><li><i class="lg d"></i>used in</li></ul></div>' +
      '<div class="rel"><div><span class="lbl">at a glance</span><p>'+PROJ.length+' projects · '+Object.keys(TECH).length+' components · '+activeLearn().length+' active learning areas</p></div></div>';
  }
  var kind, name, text, rel = '';
  if(id.indexOf('dom:') === 0){
    var g = id.slice(4); kind = 'domain'; name = DOMAINS[g].n; text = DOMAINS[g].r;
    var ids = Object.keys(TECH).filter(function(t){return TECH[t].g===g;});
    rel = '<div><span class="lbl">components</span>'+chips(ids,true)+'</div>';
  } else if(id.indexOf('m:') === 0){
    var mid = id.slice(2), p = projById(mid), uses;
    if(p){
      kind = 'project · '+p.status; name = p.name; text = p.desc; uses = p.uses;
      rel = '<div><span class="lbl">built with</span>'+chips(uses,true)+'</div><a class="open" href="#'+p.id+'">open case study →</a>';
    } else if(mid === 'learning'){
      kind = 'module'; name = '/learning'; text = 'Areas being worked on right now, with the state each one is in.';
      rel = '<div><span class="lbl">touches</span>'+chips(LEARN_LINKS,true)+'</div><a class="open" href="#learning">open learning →</a>';
    } else {
      kind = 'module'; name = '/lab'; text = 'Experiments, prototypes and notes. Published as they are finished.';
      rel = '<div><span class="lbl">touches</span>'+chips(LAB_LINKS,true)+'</div><a class="open" href="#lab">open lab →</a>';
    }
  } else {
    var t = TECH[id]; kind = 'component · '+DOMAINS[t.d].n.toLowerCase(); name = t.n; text = t.r;
    var req = t.needs, by = Object.keys(TECH).filter(function(k){return TECH[k].needs.indexOf(id)>-1;});
    rel = '<div><span class="lbl">used in</span><span class="chips">' +
      (usedIn(id).map(function(p){return '<button class="chip" data-pin="m:'+p.id+'">'+p.name.toLowerCase()+'</button>';}).join('') +
      (LEARN_LINKS.indexOf(id)>-1?'<button class="chip" data-pin="m:learning">learning</button>':'') +
      (LAB_LINKS.indexOf(id)>-1?'<button class="chip" data-pin="m:lab">lab</button>':'') || '<span class="chip">nothing yet</span>') + '</span></div>';
    if(req.length) rel += '<div><span class="lbl">requires</span>'+chips(req,true)+'</div>';
    if(by.length) rel += '<div><span class="lbl">required by</span>'+chips(by,true)+'</div>';
  }
  return '<div><span class="lbl">'+kind+'</span><h3>'+name+'</h3></div><div><p>'+text+'</p></div><div class="rel">'+rel+'</div>';
}

/* ----- mobile tree ----- */
function mobileTree(){
  var item = function(key, name, meta, body){
    return '<li><button class="tbtn" aria-expanded="false" aria-controls="t-'+key+'"><span class="tn">'+name+'</span><span class="tm">'+meta+'</span><i class="chev"></i></button><div class="tbody" id="t-'+key+'"><div class="tin"><div>'+body+'</div></div></div></li>';
  };
  var about = '<p>'+ABOUT.lede+'</p><a class="open" href="#about">open about →</a>';
  var projects = PROJ.map(function(p){ return '<a class="row" href="#'+p.id+'">'+stat(p.status)+'<span>'+p.name+'<br><small>'+p.lang+'</small></span><small>'+p.status+'</small></a>'; }).join('') + '<a class="open" href="#projects">open projects →</a>';
  var stack = '<dl>' + STACK_ORDER.map(function(d){ return '<div><dt>'+DOMAINS[d].n+'</dt><dd>'+Object.keys(TECH).filter(function(k){return TECH[k].d===d;}).map(function(k){return TECH[k].n;}).join(' · ')+'</dd></div>'; }).join('') + '</dl><a class="open" href="#stack">open stack →</a>';
  var learning = LEARN.map(function(l){ return '<a class="row" href="#learning">'+glyph(l.s)+'<span>'+l.n+'</span><small>'+l.s+'</small></a>'; }).join('') + '<a class="open" href="#learning">open learning →</a>';
  var lab = LAB.map(function(l){ return '<a class="row p2" href="#lab"><span>'+l.t+'</span><small>'+l.s+'</small></a>'; }).join('') + '<a class="open" href="#lab">open lab →</a>';
  var contact = '<dl><div><dt>EMAIL</dt><dd>'+CONFIG.email+'</dd></div><div><dt>GITHUB</dt><dd>'+host(CONFIG.github)+'</dd></div><div><dt>LINKEDIN</dt><dd>'+host(CONFIG.linkedin)+'</dd></div></dl><a class="open" href="#contact">open contact →</a>';
  return '<div class="mtree">' + rootBlock(false).replace('<div class="rootlinks"><a href="#projects">projects →</a><a href="#contact">contact →</a></div>','') +
    '<ul class="tree">' +
    item('about','ABOUT','who and focus',about) +
    item('projects','PROJECTS',pad(PROJ.length)+' modules',projects) +
    item('stack','STACK',pad(Object.keys(TECH).length)+' components',stack) +
    item('learning','LEARNING',activeLearn().length+' active',learning) +
    item('lab','LAB',LAB.length+' entries',lab) +
    item('contact','CONTACT','3 channels',contact) +
    '</ul></div>';
}

/* ----- about ----- */
function viewAbout(){
  var gl = [
    ['WHO','Maziar Heydari, backend developer','#about','about'],
    ['BUILDS','APIs, authentication systems and realtime services','#projects','projects'],
    ['USES','Django, DRF, Laravel and Go on Linux','#stack','stack'],
    ['PROJECTS',PROJ.length+' modules, each with an architecture write-up','#projects','open'],
    ['CONTACT','Email, GitHub and LinkedIn','#contact','open']
  ];
  return '<section class="view">' + head('/maziar/about','About',ABOUT.lede) +
    '<dl class="glance">'+gl.map(function(g){return '<div><dt>'+g[0]+'</dt><dd>'+g[1]+'</dd><a href="'+g[2]+'">'+g[3]+' →</a></div>';}).join('')+'</dl>' +
    '<div class="twocol"><div><div class="prose">'+ABOUT.body.map(function(t){return '<p>'+t+'</p>';}).join('')+'</div>' +
    '<div class="principles">'+ABOUT.principles.map(function(p){return '<div><b>'+p[0]+'</b><span>'+p[1]+'</span></div>';}).join('')+'</div></div>' +
    '<dl class="kv">' + [
      ['ROLE','backend developer'],['FOCUS','reliable systems'],['FRAMEWORKS','Django · DRF · Laravel · Gin'],['LANGUAGES','Python · PHP · Go · JavaScript'],
      ['PLATFORM','Linux'],['DATA','PostgreSQL · MySQL · Redis'],['STATUS',CONFIG.availability]
    ].map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>';}).join('') + '</dl></div></section>';
}

/* ----- projects ----- */
function viewProjects(){
  return '<section class="view">' + head('/maziar/projects','Projects','Each project is a module with an architecture, the decisions behind it, and a repository.') +
    '<div class="plist">' + PROJ.map(function(p){
      return '<article class="pmod"><div class="pmeta"><span class="path">'+p.id+'/</span><span class="pstatus">'+stat(p.status)+' status: '+p.status+'</span></div>' +
        '<div class="pbody"><h2>'+p.name+'</h2><div class="sub"><span>'+p.lang+'</span><i>/</i><span>'+p.kind+'</span></div><p>'+p.desc+'</p>' +
        '<div class="acts"><a class="btn" href="#'+p.id+'" data-sec="architecture">ARCHITECTURE</a><a class="btn" href="#'+p.id+'">DETAILS</a><a class="btn ext" href="'+p.repo+'" target="_blank" rel="noopener">REPOSITORY</a></div></div></article>';
    }).join('') + '</div></section>';
}
var wantSec = null;
document.addEventListener('click', function(e){
  var a = e.target.closest('[data-sec]'); if(a) wantSec = a.dataset.sec;
});

/* ----- case study ----- */
var SECS = [['overview','Overview'],['architecture','Architecture'],['technologies','Technologies'],['decisions','Technical decisions'],['challenges','Challenges'],['repository','Repository']];
function viewProject(p){
  var i = PROJ.indexOf(p), prev = PROJ[(i+PROJ.length-1)%PROJ.length], next = PROJ[(i+1)%PROJ.length];
  var tech = p.uses.map(function(id){ return '<li><a href="#stack" data-focus="'+id+'">'+TECH[id].n+'</a><span>'+TECH[id].r+'</span></li>'; }).join('') +
    p.extras.map(function(x){ return '<li><b>'+x[0]+'</b><span>'+x[1]+'</span></li>'; }).join('');
  var arch = '<div class="arch">' + p.arch.map(function(t){
    return '<div class="tier"><div class="tlabel">'+t.l+'</div><div class="tnodes">'+t.n.map(function(x){return '<div class="anode'+(x.side?' side':'')+'"><b>'+x.t+'</b><span>'+x.s+'</span></div>';}).join('')+'</div></div>';
  }).join('') + '</div>';
  var dec = '<div class="adrs">' + p.decisions.map(function(d,k){
    return '<div class="adr"><span class="id">ADR-'+pad(k+1)+'</span><div><h3>'+d.t+'</h3><p>'+d.w+'</p><p class="tr">trade-off: '+d.x+'</p></div></div>';
  }).join('') + '</div>';
  var chal = '<div class="chals">' + p.challenges.map(function(c){
    return '<div class="chal"><span class="id">problem</span><div><h3>'+c.p+'</h3><p>'+c.r+'</p></div></div>';
  }).join('') + '</div>';
  return '<section class="view case"><a class="back" href="#projects">‹ /projects</a>' +
    '<header class="chead"><p class="eyebrow">/maziar/projects/'+p.id+'</p><h1>'+p.name+'</h1><div class="cmeta"><span>'+p.lang+'</span><span>'+p.kind+'</span><span class="pstatus">'+stat(p.status)+' status: '+p.status+'</span></div></header>' +
    '<div class="cbody"><nav class="cidx" id="cidx" aria-label="Case study sections">'+SECS.map(function(s){return '<button data-to="'+s[0]+'">'+s[0]+'</button>';}).join('')+'</nav>' +
    '<div class="csecs">' +
    '<section class="csec" id="overview"><span class="lbl">overview</span>'+p.overview.map(function(t){return '<p>'+t+'</p>';}).join('')+'</section>' +
    '<section class="csec" id="architecture"><span class="lbl">architecture</span>'+arch+'</section>' +
    '<section class="csec" id="technologies"><span class="lbl">technologies</span><ul class="techlist">'+tech+'</ul></section>' +
    '<section class="csec" id="decisions"><span class="lbl">technical decisions</span>'+dec+'</section>' +
    '<section class="csec" id="challenges"><span class="lbl">challenges</span>'+chal+'</section>' +
    '<section class="csec" id="repository"><span class="lbl">repository</span><div class="repo"><span>'+host(p.repo)+'</span><button class="btn" data-copy="'+p.repo+'">COPY</button><a class="btn ext" href="'+p.repo+'" target="_blank" rel="noopener">OPEN</a></div></section>' +
    '</div></div>' +
    '<nav class="pn"><a href="#'+prev.id+'">‹ previous<b>'+prev.name+'</b></a><a href="#'+next.id+'">next ›<b>'+next.name+'</b></a></nav></section>';
}
function initCase(){
  var stage = $('#stage'), btns = $$('#cidx button');
  var go = function(id){ var el = document.getElementById(id); if(el) el.scrollIntoView({behavior: reduce?'auto':'smooth', block:'start'}); };
  btns.forEach(function(b){ b.addEventListener('click', function(){ go(b.dataset.to); }); });
  var io = new IntersectionObserver(function(es){
    es.forEach(function(en){ if(en.isIntersecting){ btns.forEach(function(b){ b.classList.toggle('on', b.dataset.to === en.target.id); }); } });
  }, {root: window.matchMedia('(max-width:900px)').matches ? null : stage, rootMargin:'-10% 0px -70% 0px'});
  $$('.csec').forEach(function(s){ io.observe(s); });
  btns[0].classList.add('on');
  if(wantSec){ var s = wantSec; wantSec = null; setTimeout(function(){ go(s); }, 60); }
}

/* ----- stack ----- */
function viewStack(){
  return '<section class="view">' + head('/maziar/stack','Stack','Installed components, grouped by layer. Each one lists what it requires and where it is used. Hover a row to trace its dependencies.') +
    '<div class="sgrid" id="sgrid">' + STACK_ORDER.map(function(d){
      var ids = Object.keys(TECH).filter(function(k){return TECH[k].d===d;});
      return '<section class="sdom"><h2>'+DOMAINS[d].n+'<small>'+pad(ids.length)+'</small></h2><p class="sdesc">'+DOMAINS[d].r+'</p>' +
        ids.map(function(id){
          var t = TECH[id], u = usedIn(id);
          var dep = '';
          if(t.needs.length) dep += '<span>requires '+t.needs.map(function(n){return TECH[n].n.toLowerCase();}).join(', ')+'</span>';
          if(u.length) dep += '<span>used in '+u.map(function(p){return '<a href="#'+p.id+'">'+p.id+'</a>';}).join(' ')+'</span>';
          if(!dep) dep = '<span>no dependencies</span>';
          return '<div class="srow" id="s-'+id+'" data-id="'+id+'"><div class="hd"><b>'+t.n+'</b></div><span class="role">'+t.r+'</span><div class="dep">'+dep+'</div></div>';
        }).join('') + '</section>';
    }).join('') + '</div></section>';
}
function initStack(){
  var grid = $('#sgrid'); if(!grid) return;
  var clear = function(){ grid.classList.remove('focus'); $$('.srow',grid).forEach(function(r){ r.classList.remove('self','rel'); }); };
  grid.addEventListener('mouseover', function(e){
    var row = e.target.closest('.srow'); if(!row) return;
    var id = row.dataset.id, rel = {};
    TECH[id].needs.forEach(function(n){ rel[n] = 1; });
    Object.keys(TECH).forEach(function(k){ if(TECH[k].needs.indexOf(id)>-1) rel[k] = 1; });
    grid.classList.add('focus');
    $$('.srow',grid).forEach(function(r){ r.classList.toggle('self', r === row); r.classList.toggle('rel', !!rel[r.dataset.id]); });
  });
  grid.addEventListener('mouseleave', clear);
  /* RECONSTRUCTED: arriving from a case-study technology link highlights that row */
  if(wantFocus){
    var id = wantFocus; wantFocus = null;
    var row = document.getElementById('s-'+id);
    if(row){
      setTimeout(function(){
        row.scrollIntoView({behavior: reduce?'auto':'smooth', block:'center'});
        var rel = {};
        TECH[id].needs.forEach(function(n){ rel[n] = 1; });
        Object.keys(TECH).forEach(function(k){ if(TECH[k].needs.indexOf(id)>-1) rel[k] = 1; });
        grid.classList.add('focus');
        $$('.srow',grid).forEach(function(r){ r.classList.toggle('self', r === row); r.classList.toggle('rel', !!rel[r.dataset.id]); });
        setTimeout(clear, 2600);
      }, 80);
    }
  }
}

/* ----- learning ----- */
function viewLearning(){
  var row = function(l){
    return '<div class="lrow '+l.s+'">'+glyph(l.s)+'<span class="ln">'+l.n+'</span><span class="ls">'+l.s.toUpperCase()+'</span><div><p>'+l.note+'</p>'+(l.t.length?chips(l.t,false):'')+'</div></div>';
  };
  var act = activeLearn(), q = LEARN.filter(function(l){return l.s==='queued';});
  return '<section class="view">' + head('/maziar/learning','Learning','Processes that are running right now. State describes how I am working on something, not how much I know.') +
    '<div class="states">'+Object.keys(STATE_DEF).map(function(s){return '<div>'+glyph(s)+'<b>'+s.toUpperCase()+'</b><small>'+STATE_DEF[s]+'</small></div>';}).join('')+'</div>' +
    '<div class="lgroup"><span class="lbl">running · '+pad(act.length)+'</span>'+act.map(row).join('')+'</div>' +
    '<div class="lgroup"><span class="lbl">queued · '+pad(q.length)+'</span>'+q.map(row).join('')+'</div></section>';
}

/* ----- lab ----- */
function viewLab(){
  var n = function(s){ return LAB.filter(function(l){return l.s===s;}).length; };
  return '<section class="view">' + head('/maziar/lab','Lab','Experiments, prototypes and technical notes. Nothing here is finished by design. Entries move from queued to in progress to published.') +
    '<div class="labnote"><span>in progress <b>'+pad(n('in progress'))+'</b></span><span>queued <b>'+pad(n('queued'))+'</b></span><span>published <b>00</b></span></div>' +
    '<div class="lablist">' + LAB.map(function(l){
      return '<article class="entry '+(l.s==='queued'?'queued':'')+'"><div><div class="fn">'+l.id+'/</div><div class="kind">'+l.kind+'</div></div>' +
        '<div><h3>'+l.t+'</h3><p>'+l.d+'</p>'+chips(l.tags,false)+'</div>' +
        '<div class="est">'+glyph(l.s==='queued'?'queued':'developing').replace('width="20" height="20"','width="14" height="14"')+l.s+'</div></article>';
    }).join('') +
    '<article class="entry reserved"><div><div class="fn">next-entry/</div><div class="kind">RESERVED</div></div><div><h3>Next experiment</h3><p>New entries are added as they are started.</p></div><div class="est"></div></article>' +
    '</div></section>';
}

/* ----- contact ----- */
function viewContact(){
  var ch = [
    ['EMAIL','direct channel',CONFIG.email,null,true],
    ['GITHUB','source code',host(CONFIG.github),CONFIG.github,false],
    ['LINKEDIN','professional profile',host(CONFIG.linkedin),CONFIG.linkedin,false]
  ];
  return '<section class="view">' + head('/maziar/contact','Contact','Three channels. Email is the fastest.') +
    '<div class="eps">' + ch.map(function(c){
      return '<div class="ep"><div><h2>'+c[0]+'</h2><div class="chan">'+c[1].toUpperCase()+'</div></div><div class="addr">'+c[2]+'</div><div class="acts">' +
        (c[4] ? '<button class="btn" data-copy="'+c[2]+'">COPY</button><a class="btn" href="mailto:'+c[2]+'">COMPOSE</a>' : '<a class="btn ext" href="'+c[3]+'" target="_blank" rel="noopener">OPEN</a>') + '</div></div>';
    }).join('') + '</div><p class="reach"><i class="dot"></i>'+CONFIG.availability+'</p></section>';
}

/* ============ GLOBAL EVENTS ============ */
document.addEventListener('click', function(e){
  var c = e.target.closest('[data-copy]');
  if(c){
    var txt = c.dataset.copy, orig = c.textContent;
    var done = function(){ c.textContent = 'COPIED'; setTimeout(function(){ c.textContent = orig; }, 1600); };
    var fallback = function(){
      var ta = document.createElement('textarea'); ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); done(); }catch(err){ c.textContent = 'SELECT TEXT'; }
      document.body.removeChild(ta);
    };
    try{ navigator.clipboard.writeText(txt).then(done, fallback); }catch(err){ fallback(); }
    return;
  }
  /* RECONSTRUCTED: mobile tree expand/collapse */
  var tb = e.target.closest('.tbtn');
  if(tb){
    var open = tb.parentNode.classList.toggle('open');
    tb.setAttribute('aria-expanded', open ? 'true' : 'false');
    return;
  }
  /* RECONSTRUCTED: case-study technology link to stack row */
  var f = e.target.closest('[data-focus]');
  if(f){ wantFocus = f.dataset.focus; }
});

/* RECONSTRUCTED: keys 0 to 6 jump to rail entries (the rail advertises "keys 0 to 6") */
document.addEventListener('keydown', function(e){
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  var t = e.target;
  if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if(/^[0-6]$/.test(e.key)){ location.hash = '#' + NAV[+e.key][0]; }
});

/* RECONSTRUCTED: the CURRENTLY word cycles through active learning areas */
function startCurrentlyRotation(){
  if(reduce) return;
  var words = ['learning'].concat(activeLearn().map(function(l){ return l.n.toLowerCase(); }));
  if(words.length < 2) return;
  var i = 0;
  setInterval(function(){
    i = (i + 1) % words.length;
    var els = $$('.cur');
    els.forEach(function(el){ el.classList.add('swap'); });
    setTimeout(function(){
      curWord = words[i];
      els.forEach(function(el){ el.textContent = curWord; el.classList.remove('swap'); });
    }, 360);
  }, 3600);
}

/* ============ BOOT ============ */
buildRail();
$('#avail').textContent = CONFIG.availability;
render();
startCurrentlyRotation();

})();