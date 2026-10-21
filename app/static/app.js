(function(){
'use strict';

/* ============ SAFE-DATA HELPERS ============ */
var isObj = function(v){ return !!v && typeof v === 'object' && !Array.isArray(v); };
var str = function(v){ return v == null ? '' : String(v); };
/* arr: always returns a clean array (objects keyed by id are accepted too, nulls dropped) */
var arr = function(v){
  if(isObj(v)) v = Object.keys(v).map(function(k){ return v[k]; });
  return Array.isArray(v) ? v.filter(function(x){ return x != null; }) : [];
};
var uniq = function(a){ return a.filter(function(x,i){ return a.indexOf(x) === i; }); };

/* ============ ADAPTER: the single data integration point ============
   Reads window.DevSystemData and/or the Django json_script element
   (<script id="dev-system-data">). Whatever arrives is then normalised
   so that missing, null or partial data can never break rendering. */
var DevSystemAdapter = {
  load: function(){
    var data = isObj(window.DevSystemData) ? window.DevSystemData : {};
    var el = document.getElementById('dev-system-data');
    if(el){
      try{
        var remote = JSON.parse(el.textContent);
        if(isObj(remote)) Object.keys(remote).forEach(function(k){ if(remote[k] != null) data[k] = remote[k]; });
      }catch(err){
        if(window.console) console.warn('dev-system-data could not be parsed; using bundled data.', err);
      }
    }
    return data;
  }
};

var GLYPHS = ['exploring','learning','studying','developing','queued'];
var STATS = ['completed','active','prototype'];
var DEFAULT_STATE_DEF = {
  exploring:'Looking around, no commitment yet.',
  learning:'Working through it step by step.',
  studying:'Going deep on the details.',
  developing:'Building something with it.',
  queued:'Planned, not started.'
};

function normalize(D){
  var N = {};

  var c = isObj(D.CONFIG) ? D.CONFIG : {};
  N.CONFIG = {rev:str(c.rev), email:str(c.email), github:str(c.github), linkedin:str(c.linkedin), availability:str(c.availability)};

  /* domains */
  N.DOMAINS = {};
  var dsrc = isObj(D.DOMAINS) ? D.DOMAINS : {};
  Object.keys(dsrc).forEach(function(k){
    var v = dsrc[k];
    N.DOMAINS[k] = isObj(v) ? {n:str(v.n)||k, r:str(v.r)} : {n:str(v)||k, r:''};
  });
  var ensureDomain = function(k){ if(k && !N.DOMAINS[k]) N.DOMAINS[k] = {n:k, r:''}; };

  /* technologies */
  N.TECH = {};
  var tsrc = isObj(D.TECH) ? D.TECH : {};
  Object.keys(tsrc).forEach(function(id){
    var t = tsrc[id]; if(!isObj(t)) return;
    var d = str(t.d), g = str(t.g);
    if(!d) d = g || 'other';
    ensureDomain(d); ensureDomain(g);
    N.TECH[id] = {n:str(t.n)||id, d:d, g:g, r:str(t.r), needs:arr(t.needs).map(str)};
  });
  Object.keys(N.TECH).forEach(function(id){
    N.TECH[id].needs = uniq(N.TECH[id].needs.filter(function(n){ return n !== id && N.TECH[n]; }));
  });
  var order = function(src, key){
    var o = arr(src).map(str).filter(function(k){ return N.DOMAINS[k]; });
    Object.keys(N.TECH).forEach(function(id){ var k = N.TECH[id][key]; if(k && o.indexOf(k) < 0) o.push(k); });
    return uniq(o);
  };
  N.STACK_ORDER = order(D.STACK_ORDER, 'd');
  N.GRAPH_ORDER = order(D.GRAPH_ORDER, 'g');
  var liveTech = function(a){ return uniq(arr(a).map(str).filter(function(t){ return N.TECH[t]; })); };

  /* projects (fields may live on the project itself or inside project.detail) */
  N.PROJ = [];
  var seen = {};
  arr(D.PROJ).forEach(function(p){
    if(!isObj(p) || !str(p.id) || seen[p.id]) return;
    seen[p.id] = 1;
    var dt = isObj(p.detail) ? p.detail : {};
    var pick = function(k){
      var v = p[k];
      if(v == null || (Array.isArray(v) && !v.length) || v === '') v = dt[k];
      return v;
    };
    var overview = pick('overview'); if(typeof overview === 'string') overview = overview ? [overview] : [];
    N.PROJ.push({
      id:str(p.id), name:str(p.name)||str(p.id), lang:str(pick('lang')), kind:str(pick('kind')),
      status: STATS.indexOf(p.status) > -1 ? p.status : 'prototype',
      desc:str(pick('desc')), repo:str(pick('repo')),
      uses: liveTech(pick('uses')),
      extras: arr(pick('extras')).filter(function(x){ return Array.isArray(x) && x[0] != null; }).map(function(x){ return [str(x[0]), str(x[1])]; }),
      overview: arr(overview).map(str).filter(Boolean),
      arch: arr(pick('arch')).filter(isObj).map(function(t){
        return {l:str(t.l), n:arr(t.n).filter(isObj).map(function(x){ return {t:str(x.t), s:str(x.s), side:!!x.side}; })};
      }).filter(function(t){ return t.n.length; }),
      decisions: arr(pick('decisions')).filter(isObj).map(function(d){ return {t:str(d.t), w:str(d.w), x:str(d.x)}; }),
      challenges: arr(pick('challenges')).filter(isObj).map(function(c){ return {p:str(c.p), r:str(c.r)}; })
    });
  });

  /* learning */
  var sd = isObj(D.STATE_DEF) ? D.STATE_DEF : {};
  N.STATE_DEF = {};
  Object.keys(sd).forEach(function(k){ if(GLYPHS.indexOf(k) > -1) N.STATE_DEF[k] = str(sd[k]); });
  if(!Object.keys(N.STATE_DEF).length) N.STATE_DEF = DEFAULT_STATE_DEF;
  N.LEARN = arr(D.LEARN).filter(function(l){ return isObj(l) && str(l.n); }).map(function(l){
    return {n:str(l.n), s: GLYPHS.indexOf(l.s) > -1 ? l.s : 'queued', note:str(l.note), t:liveTech(l.t)};
  });
  N.LEARN_LINKS = liveTech(D.LEARN_LINKS);

  /* lab */
  N.LAB = arr(D.LAB).filter(isObj).map(function(l, i){
    return {id:str(l.id)||('entry-'+(i+1)), t:str(l.t)||('Entry '+(i+1)), kind:str(l.kind), d:str(l.d),
            s:str(l.s).toLowerCase()||'queued', tags:liveTech(l.tags)};
  });
  N.LAB_LINKS = liveTech(D.LAB_LINKS);

  /* about */
  var a = isObj(D.ABOUT) ? D.ABOUT : {};
  N.ABOUT = {
    lede:str(a.lede),
    body:arr(a.body).map(str).filter(Boolean),
    principles:arr(a.principles).filter(function(p){ return Array.isArray(p) && p[0] != null; }).map(function(p){ return [str(p[0]), str(p[1])]; })
  };
  return N;
}

var D = normalize(DevSystemAdapter.load());
var CONFIG = D.CONFIG, DOMAINS = D.DOMAINS, STACK_ORDER = D.STACK_ORDER, GRAPH_ORDER = D.GRAPH_ORDER,
    TECH = D.TECH, PROJ = D.PROJ, LEARN = D.LEARN, STATE_DEF = D.STATE_DEF, LEARN_LINKS = D.LEARN_LINKS,
    LAB = D.LAB, LAB_LINKS = D.LAB_LINKS, ABOUT = D.ABOUT;

/* ============ HELPERS ============ */
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
var pad = function(n){ return n < 10 ? '0'+n : ''+n; };
var projById = function(id){ return PROJ.filter(function(p){return p.id===id;})[0]; };
var host = function(u){ return str(u).replace(/^https?:\/\//,'').replace(/\/$/,''); };
var domName = function(k){ return (DOMAINS[k] && DOMAINS[k].n) || k || ''; };
var domText = function(k){ return (DOMAINS[k] && DOMAINS[k].r) || ''; };
var techIds = function(key, val){ return Object.keys(TECH).filter(function(k){ return TECH[k][key] === val; }); };
var graphGroups = function(){ return GRAPH_ORDER.filter(function(g){ return techIds('g', g).length; }); };
var stackGroups = function(){ return STACK_ORDER.filter(function(d){ return techIds('d', d).length; }); };
var empty = function(t){ return '<p class="empty-note">'+t+'</p>'; };
var curWord = 'learning';   /* the rotating "CURRENTLY" word */
var wantFocus = null;       /* stack row to focus after navigating from a case study */

(function(){
  var s = document.createElement('style');
  s.textContent = '.empty-note{margin:0;padding:16px 0;opacity:.6;font-size:13px;letter-spacing:.02em}';
  document.head.appendChild(s);
})();

function glyph(s){
  if(GLYPHS.indexOf(s) < 0) s = 'queued';
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
  if(STATS.indexOf(s) < 0) s = 'prototype';
  var c = {
    completed:'<rect x="2" y="2" width="8" height="8" fill="currentColor"/>',
    active:'<circle cx="6" cy="6" r="2.6" fill="currentColor"/><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1"/>',
    prototype:'<rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 1.6"/>'
  };
  return '<svg class="sg '+s+'" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">'+c[s]+'</svg>';
}
function chips(ids, pin){
  return '<span class="chips">'+arr(ids).map(function(id){
    var t = TECH[id]; if(!t) return '';
    if(pin && t.g) return '<button class="chip" data-pin="'+id+'">'+t.n+'</button>';
    return '<span class="chip">'+t.n+'</span>';
  }).join('')+'</span>';
}
function activeLearn(){ return LEARN.filter(function(l){return l.s!=='queued';}); }
function usedIn(id){ return PROJ.filter(function(p){return p.uses.indexOf(id)>-1;}); }
function contactChannels(){
  var ch = [];
  if(CONFIG.email) ch.push(['EMAIL','direct channel',CONFIG.email,null,true]);
  if(CONFIG.github) ch.push(['GITHUB','source code',host(CONFIG.github),CONFIG.github,false]);
  if(CONFIG.linkedin) ch.push(['LINKEDIN','professional profile',host(CONFIG.linkedin),CONFIG.linkedin,false]);
  return ch;
}

/* ============ SHELL: rail, crumbs, status ============ */
var NAV = [
  ['home','/'],['about','about/'],['projects','projects/',PROJ.length],['stack','stack/',Object.keys(TECH).length],
  ['learning','learning/',LEARN.length],['lab','lab/',LAB.length],['contact','contact/',contactChannels().length]
];
function buildRail(){
  var rail = $('#rail'); if(!rail) return;
  var h = '<div><span class="lbl">/maziar</span><div class="rlist">';
  NAV.forEach(function(n,i){
    h += '<a href="#'+n[0]+'" data-v="'+n[0]+'"><span class="k">'+i+'</span><span class="rn">'+n[1]+'</span><span class="rm">'+(n[2]?pad(n[2]):'')+'</span></a>';
  });
  h += '</div></div><div class="proc"><span class="lbl">active processes</span>';
  var act = activeLearn();
  if(act.length){
    act.forEach(function(l){
      h += '<a href="#learning">'+glyph(l.s)+'<span>'+l.n.toLowerCase()+'<small>'+l.s+'</small></span></a>';
    });
  } else {
    h += '<span class="empty-note">none running</span>';
  }
  h += '</div><div class="rev">'+(CONFIG.rev ? 'rev '+CONFIG.rev+'<br>' : '')+'keys 0 to 6</div>';
  rail.innerHTML = h;
}
function setChrome(r){
  var view = r.v === 'project' ? 'projects' : r.v;
  var shell = $('#shell');
  if(shell) shell.setAttribute('data-view', r.v === 'home' ? 'home' : view);
  $$('.rlist a').forEach(function(a){ a.classList.toggle('on', a.dataset.v === (r.v==='project'?'projects':r.v)); });
  var segs = [['maziar','#home']];
  if(r.v !== 'home') segs.push([view, '#'+view]);
  if(r.v === 'project') segs.push([r.p.id, '#'+r.p.id]);
  var crumbs = $('#crumbs');
  if(crumbs) crumbs.innerHTML = segs.map(function(s,i){
    var last = i === segs.length-1;
    return '<i>/</i>' + (last ? '<span class="cur-seg">'+s[0]+'</span>' : '<a href="'+s[1]+'">'+s[0]+'</a>');
  }).join('');
  var path = '/' + segs.map(function(s){return s[0];}).join('/');
  var status = $('#status');
  if(status) status.innerHTML = '<span><b>'+path+'</b></span><span><span>FOCUS <b>reliable systems</b></span><span>CURRENTLY <b class="cur">'+curWord+'</b></span></span>';
  document.title = 'Personal Developer System';
}

/* ============ ROUTER ============ */
var VIEWS = ['about','projects','stack','learning','lab','contact'];
function route(){
  var h = (location.hash||'').slice(1);
  try{ h = decodeURIComponent(h); }catch(err){}
  if(VIEWS.indexOf(h) > -1) return {v:h};
  var p = projById(h); if(p) return {v:'project', p:p};
  return {v:'home'};
}
var booted = false;
function render(){
  var r = route();
  var stage = $('#stage'); if(!stage) return;
  if(r.v !== 'home' && mapObserver){ mapObserver.disconnect(); mapObserver = null; }
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
var MAP = {rows:'', total:2};
function viewHome(){
  var boot = !booted;
  var rows = [], row = 1, nodes = '';
  var groups = graphGroups();   /* only groups that really contain components */
  groups.forEach(function(g, gi){
    var ids = techIds('g', g);
    var start = row;
    ids.forEach(function(id){
      nodes += '<button class="node tech'+(boot?' bnode':'')+'" style="grid-column:3;grid-row:'+row+';--c:3;--r:'+row+'" data-id="'+id+'"><i class="sq"></i><span>'+TECH[id].n+'</span></button>';
      rows.push('32px'); row++;
    });
    nodes += '<button class="node dom'+(boot?' bnode':'')+'" style="grid-column:2;grid-row:'+start+'/'+row+';align-self:center;--c:2;--r:'+start+'" data-id="dom:'+g+'"><b>'+domName(g)+'</b><small>'+pad(ids.length)+' components</small></button>';
    if(gi < groups.length-1){ rows.push('10px'); row++; }
  });
  /* Trailing flexible row: the root column and the module column span every row.
     With few or no components the fixed 32px rows are shorter than that content,
     which made the columns overlap. This row absorbs whatever extra height they need. */
  rows.push('minmax(0,1fr)'); row++;

  var base = PROJ.length * 4;
  var mods = PROJ.map(function(p, i){
    return '<button class="node mod'+(boot?' bnode':'')+'" style="--c:4;--r:'+(i*4)+'" data-id="m:'+p.id+'"><span class="mt"><b>'+p.name+'</b><small>'+p.lang+'</small></span>'+stat(p.status)+'</button>';
  }).join('') +
  '<button class="node mod'+(boot?' bnode':'')+'" style="--c:4;--r:'+(base+2)+'" data-id="m:learning"><span class="mt"><b>LEARNING</b><small>'+activeLearn().length+' active</small></span>'+glyph('developing').replace('width="20" height="20"','width="14" height="14"')+'</button>' +
  '<button class="node mod'+(boot?' bnode':'')+'" style="--c:4;--r:'+(base+4)+'" data-id="m:lab"><span class="mt"><b>LAB</b><small>'+LAB.length+' entries</small></span><svg class="sg" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4.5 1.5h3M5 1.5v3.2L2 10h8L7 4.7V1.5" fill="none" stroke="currentColor" stroke-width="1.1"/></svg></button>';
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
  if(mapObserver){ mapObserver.disconnect(); mapObserver = null; }
  if(window.ResizeObserver){
    mapObserver = new ResizeObserver(function(){ drawEdges(); });
    mapObserver.observe(map);
  } else {
    window.addEventListener('resize', drawEdges);
  }
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
  var insp = $('#inspect');
  if(insp) insp.addEventListener('click', function(e){
    var b = e.target.closest('[data-pin]'); if(b){ pin = b.dataset.pin; hover = null; paint(); }
  });
  drawEdges(); paint();
}
function elbow(x1,y1,x2,y2){
  var dy = y2-y1;
  if(Math.abs(dy) < 1) return 'M'+x1+' '+y1+'H'+x2;
  var xm = x1 + (x2-x1)/2, d = dy>0?1:-1, r = Math.min(8, Math.abs(dy)/2, Math.abs(x2-x1)/2);
  return 'M'+x1+' '+y1+'H'+(xm-r)+'Q'+xm+' '+y1+' '+xm+' '+(y1+d*r)+'V'+(y2-d*r)+'Q'+xm+' '+y2+' '+(xm+r)+' '+y2+'H'+x2;
}
function drawEdges(){
  var map = $('#map'), svg = $('#edges'), port = $('#port');
  if(!map || !svg || !port) return;
  var mr = map.getBoundingClientRect(); if(!mr.width) return;
  var pt = function(el, side){
    if(!el) return null;
    var r = el.getBoundingClientRect();
    return {x:(side==='r'?r.right:r.left)-mr.left, y:r.top+r.height/2-mr.top};
  };
  var p0 = pt(port,'r');
  p0.x = port.getBoundingClientRect().left + 3.5 - mr.left;
  var homeEl = $('.home');
  var first = !drewOnce && !!homeEl && homeEl.classList.contains('boot');
  var out = '', list = [];
  var add = function(a,b,cls,d,i){
    list.push({a:a,b:b});
    out += '<path class="edge '+cls+(first?(cls==='h'?' draw':' fade'):'')+'" data-a="'+a+'" data-b="'+b+'" d="'+d+'"'+(first&&cls==='h'?' pathLength="1" style="--dl:'+(0.35+i*0.05)+'s"':'')+'/>';
  };
  var k = 0;
  graphGroups().forEach(function(g){
    var dn = $('[data-id="dom:'+g+'"]'); if(!dn) return;
    var a = pt(dn,'l'), ar = pt(dn,'r');
    add('root','dom:'+g,'h',elbow(p0.x,p0.y,a.x,a.y),k++);
    techIds('g', g).forEach(function(t){
      var tn = $('[data-id="'+t+'"]'); if(!tn) return;
      var b = pt(tn,'l');
      add('dom:'+g,t,'h',elbow(ar.x,ar.y,b.x,b.y),k++);
    });
  });
  var mods = PROJ.map(function(p){return {id:'m:'+p.id, t:p.uses};}).concat([{id:'m:learning',t:LEARN_LINKS},{id:'m:lab',t:LAB_LINKS}]);
  mods.forEach(function(m){
    var mn = $('[data-id="'+m.id+'"]'); if(!mn) return;
    var b = pt(mn,'l');
    arr(m.t).forEach(function(t){
      if(!TECH[t] || !TECH[t].g) return;
      var tn = $('[data-id="'+t+'"]'); if(!tn) return;
      var a = pt(tn,'r');
      var kx = (b.x-a.x)*0.55;
      add(t,m.id,'d','M'+a.x+' '+a.y+'C'+(a.x+kx)+' '+a.y+' '+(b.x-kx)+' '+b.y+' '+b.x+' '+b.y,0);
    });
  });
  svg.setAttribute('viewBox','0 0 '+mr.width+' '+mr.height);
  svg.innerHTML = out; edges = list; drewOnce = true;
  paint();
}
function domOfTech(t){ return TECH[t] && TECH[t].g ? 'dom:'+TECH[t].g : 'root'; }
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
  var insp = $('#inspect');
  if(insp) insp.innerHTML = inspectHTML(act);
}
function inspectIdle(){
  return '<div><span class="lbl">inspector</span><h3>System map</h3></div>' +
    '<div><p>Hover a node to trace what connects to it. Select one to pin it. Components sit on the left, the work that uses them on the right.</p>' +
    '<ul class="legend"><li><i class="lg h"></i>contains</li><li><i class="lg d"></i>used in</li></ul></div>' +
    '<div class="rel"><div><span class="lbl">at a glance</span><p>'+PROJ.length+' projects · '+Object.keys(TECH).length+' components · '+activeLearn().length+' active learning areas</p></div></div>';
}
function inspectHTML(id){
  if(!id) return inspectIdle();
  var kind, name, text, rel = '';
  if(id.indexOf('dom:') === 0){
    var g = id.slice(4);
    if(!DOMAINS[g]) return inspectIdle();
    kind = 'domain'; name = domName(g); text = domText(g);
    rel = '<div><span class="lbl">components</span>'+chips(techIds('g', g),true)+'</div>';
  } else if(id.indexOf('m:') === 0){
    var mid = id.slice(2), p = projById(mid);
    if(p){
      kind = 'project · '+p.status; name = p.name; text = p.desc;
      rel = (p.uses.length ? '<div><span class="lbl">built with</span>'+chips(p.uses,true)+'</div>' : '') + '<a class="open" href="#'+p.id+'">open case study →</a>';
    } else if(mid === 'learning'){
      kind = 'module'; name = '/learning'; text = 'Areas being worked on right now, with the state each one is in.';
      rel = (LEARN_LINKS.length ? '<div><span class="lbl">touches</span>'+chips(LEARN_LINKS,true)+'</div>' : '') + '<a class="open" href="#learning">open learning →</a>';
    } else if(mid === 'lab'){
      kind = 'module'; name = '/lab'; text = 'Experiments, prototypes and notes. Published as they are finished.';
      rel = (LAB_LINKS.length ? '<div><span class="lbl">touches</span>'+chips(LAB_LINKS,true)+'</div>' : '') + '<a class="open" href="#lab">open lab →</a>';
    } else return inspectIdle();
  } else {
    var t = TECH[id]; if(!t) return inspectIdle();
    kind = 'component · '+domName(t.d).toLowerCase(); name = t.n; text = t.r;
    var req = t.needs, by = Object.keys(TECH).filter(function(k){return TECH[k].needs.indexOf(id)>-1;});
    rel = '<div><span class="lbl">used in</span><span class="chips">' +
      (usedIn(id).map(function(p){return '<button class="chip" data-pin="m:'+p.id+'">'+p.name.toLowerCase()+'</button>';}).join('') +
      (LEARN_LINKS.indexOf(id)>-1?'<button class="chip" data-pin="m:learning">learning</button>':'') +
      (LAB_LINKS.indexOf(id)>-1?'<button class="chip" data-pin="m:lab">lab</button>':'') || '<span class="chip">nothing yet</span>') + '</span></div>';
    if(req.length) rel += '<div><span class="lbl">requires</span>'+chips(req,true)+'</div>';
    if(by.length) rel += '<div><span class="lbl">required by</span>'+chips(by,true)+'</div>';
  }
  return '<div><span class="lbl">'+kind+'</span><h3>'+name+'</h3></div>'+(text?'<div><p>'+text+'</p></div>':'')+'<div class="rel">'+rel+'</div>';
}

/* ----- mobile tree ----- */
function mobileTree(){
  var item = function(key, name, meta, body){
    return '<li><button class="tbtn" aria-expanded="false" aria-controls="t-'+key+'"><span class="tn">'+name+'</span><span class="tm">'+meta+'</span><i class="chev"></i></button><div class="tbody" id="t-'+key+'"><div class="tin"><div>'+body+'</div></div></div></li>';
  };
  var about = (ABOUT.lede ? '<p>'+ABOUT.lede+'</p>' : '') + '<a class="open" href="#about">open about →</a>';
  var projects = PROJ.map(function(p){ return '<a class="row" href="#'+p.id+'">'+stat(p.status)+'<span>'+p.name+'<br><small>'+p.lang+'</small></span><small>'+p.status+'</small></a>'; }).join('') + '<a class="open" href="#projects">open projects →</a>';
  var stack = '<dl>' + stackGroups().map(function(d){ return '<div><dt>'+domName(d)+'</dt><dd>'+techIds('d', d).map(function(k){return TECH[k].n;}).join(' · ')+'</dd></div>'; }).join('') + '</dl><a class="open" href="#stack">open stack →</a>';
  var learning = LEARN.map(function(l){ return '<a class="row" href="#learning">'+glyph(l.s)+'<span>'+l.n+'</span><small>'+l.s+'</small></a>'; }).join('') + '<a class="open" href="#learning">open learning →</a>';
  var lab = LAB.map(function(l){ return '<a class="row p2" href="#lab"><span>'+l.t+'</span><small>'+l.s+'</small></a>'; }).join('') + '<a class="open" href="#lab">open lab →</a>';
  var ch = contactChannels();
  var contact = '<dl>' + ch.map(function(c){ return '<div><dt>'+c[0]+'</dt><dd>'+c[2]+'</dd></div>'; }).join('') + '</dl><a class="open" href="#contact">open contact →</a>';
  return '<div class="mtree">' + rootBlock(false).replace('<div class="rootlinks"><a href="#projects">projects →</a><a href="#contact">contact →</a></div>','') +
    '<ul class="tree">' +
    item('about','ABOUT','who and focus',about) +
    item('projects','PROJECTS',pad(PROJ.length)+' modules',projects) +
    item('stack','STACK',pad(Object.keys(TECH).length)+' components',stack) +
    item('learning','LEARNING',activeLearn().length+' active',learning) +
    item('lab','LAB',LAB.length+' entries',lab) +
    item('contact','CONTACT',ch.length+' channels',contact) +
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
  var kv = [
    ['ROLE','backend developer'],['FOCUS','reliable systems'],['FRAMEWORKS','Django · DRF · Laravel · Gin'],['LANGUAGES','Python · PHP · Go · JavaScript'],
    ['PLATFORM','Linux'],['DATA','PostgreSQL · MySQL · Redis'],['STATUS',CONFIG.availability]
  ].filter(function(r){ return r[1]; });
  return '<section class="view">' + head('/maziar/about','About',ABOUT.lede) +
    '<dl class="glance">'+gl.map(function(g){return '<div><dt>'+g[0]+'</dt><dd>'+g[1]+'</dd><a href="'+g[2]+'">'+g[3]+' →</a></div>';}).join('')+'</dl>' +
    '<div class="twocol"><div>' +
    '<div class="prose">'+(ABOUT.body.length ? ABOUT.body.map(function(t){return '<p>'+t+'</p>';}).join('') : empty('Nothing written here yet.'))+'</div>' +
    (ABOUT.principles.length ? '<div class="principles">'+ABOUT.principles.map(function(p){return '<div><b>'+p[0]+'</b><span>'+p[1]+'</span></div>';}).join('')+'</div>' : '') +
    '</div>' +
    '<dl class="kv">' + kv.map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>';}).join('') + '</dl></div></section>';
}

/* ----- projects ----- */
function viewProjects(){
  return '<section class="view">' + head('/maziar/projects','Projects','Each project is a module with an architecture, the decisions behind it, and a repository.') +
    '<div class="plist">' + (PROJ.length ? PROJ.map(function(p){
      return '<article class="pmod"><div class="pmeta"><span class="path">'+p.id+'/</span><span class="pstatus">'+stat(p.status)+' status: '+p.status+'</span></div>' +
        '<div class="pbody"><h2>'+p.name+'</h2>' +
        ((p.lang || p.kind) ? '<div class="sub">'+(p.lang?'<span>'+p.lang+'</span>':'')+(p.lang&&p.kind?'<i>/</i>':'')+(p.kind?'<span>'+p.kind+'</span>':'')+'</div>' : '') +
        (p.desc ? '<p>'+p.desc+'</p>' : '') +
        '<div class="acts">' + (p.arch.length ? '<a class="btn" href="#'+p.id+'" data-sec="architecture">ARCHITECTURE</a>' : '') +
        '<a class="btn" href="#'+p.id+'">DETAILS</a>' +
        (p.repo ? '<a class="btn ext" href="'+p.repo+'" target="_blank" rel="noopener">REPOSITORY</a>' : '') + '</div></div></article>';
    }).join('') : empty('No projects published yet.')) + '</div></section>';
}
var wantSec = null;
document.addEventListener('click', function(e){
  var a = e.target.closest('[data-sec]'); if(a) wantSec = a.dataset.sec;
});

/* ----- case study ----- */
var SECS = [['overview','Overview'],['architecture','Architecture'],['technologies','Technologies'],['decisions','Technical decisions'],['challenges','Challenges'],['repository','Repository']];
function viewProject(p){
  var i = PROJ.indexOf(p), prev = PROJ[(i+PROJ.length-1)%PROJ.length], next = PROJ[(i+1)%PROJ.length];
  var techItems = p.uses.map(function(id){ return '<li><a href="#stack" data-focus="'+id+'">'+TECH[id].n+'</a><span>'+TECH[id].r+'</span></li>'; }).concat(
    p.extras.map(function(x){ return '<li><b>'+x[0]+'</b><span>'+x[1]+'</span></li>'; }));
  var secs = {};
  if(p.overview.length) secs.overview = '<section class="csec" id="overview"><span class="lbl">overview</span>'+p.overview.map(function(t){return '<p>'+t+'</p>';}).join('')+'</section>';
  if(p.arch.length) secs.architecture = '<section class="csec" id="architecture"><span class="lbl">architecture</span><div class="arch">' + p.arch.map(function(t){
    return '<div class="tier">'+(t.l?'<div class="tlabel">'+t.l+'</div>':'')+'<div class="tnodes">'+t.n.map(function(x){return '<div class="anode'+(x.side?' side':'')+'"><b>'+x.t+'</b>'+(x.s?'<span>'+x.s+'</span>':'')+'</div>';}).join('')+'</div></div>';
  }).join('') + '</div></section>';
  if(techItems.length) secs.technologies = '<section class="csec" id="technologies"><span class="lbl">technologies</span><ul class="techlist">'+techItems.join('')+'</ul></section>';
  if(p.decisions.length) secs.decisions = '<section class="csec" id="decisions"><span class="lbl">technical decisions</span><div class="adrs">' + p.decisions.map(function(d,k){
    return '<div class="adr"><span class="id">ADR-'+pad(k+1)+'</span><div><h3>'+d.t+'</h3>'+(d.w?'<p>'+d.w+'</p>':'')+(d.x?'<p class="tr">trade-off: '+d.x+'</p>':'')+'</div></div>';
  }).join('') + '</div></section>';
  if(p.challenges.length) secs.challenges = '<section class="csec" id="challenges"><span class="lbl">challenges</span><div class="chals">' + p.challenges.map(function(c){
    return '<div class="chal"><span class="id">problem</span><div><h3>'+c.p+'</h3>'+(c.r?'<p>'+c.r+'</p>':'')+'</div></div>';
  }).join('') + '</div></section>';
  if(p.repo) secs.repository = '<section class="csec" id="repository"><span class="lbl">repository</span><div class="repo"><span>'+host(p.repo)+'</span><button class="btn" data-copy="'+p.repo+'">COPY</button><a class="btn ext" href="'+p.repo+'" target="_blank" rel="noopener">OPEN</a></div></section>';
  var avail = SECS.filter(function(s){ return secs[s[0]]; });
  var metaBits = (p.lang?'<span>'+p.lang+'</span>':'') + (p.kind?'<span>'+p.kind+'</span>':'');
  return '<section class="view case"><a class="back" href="#projects">‹ /projects</a>' +
    '<header class="chead"><p class="eyebrow">/maziar/projects/'+p.id+'</p><h1>'+p.name+'</h1><div class="cmeta">'+metaBits+'<span class="pstatus">'+stat(p.status)+' status: '+p.status+'</span></div></header>' +
    '<div class="cbody"><nav class="cidx" id="cidx" aria-label="Case study sections">'+avail.map(function(s){return '<button data-to="'+s[0]+'">'+s[0]+'</button>';}).join('')+'</nav>' +
    '<div class="csecs">' + (avail.length ? avail.map(function(s){ return secs[s[0]]; }).join('') : (p.desc ? '<section class="csec"><p>'+p.desc+'</p></section>' : empty('No details published for this project yet.'))) +
    '</div></div>' +
    (PROJ.length > 1 ? '<nav class="pn"><a href="#'+prev.id+'">‹ previous<b>'+prev.name+'</b></a><a href="#'+next.id+'">next ›<b>'+next.name+'</b></a></nav>' : '') + '</section>';
}
function initCase(){
  var stage = $('#stage'), btns = $$('#cidx button');
  var go = function(id){ var el = document.getElementById(id); if(el) el.scrollIntoView({behavior: reduce?'auto':'smooth', block:'start'}); };
  btns.forEach(function(b){ b.addEventListener('click', function(){ go(b.dataset.to); }); });
  var secs = $$('.csec[id]');
  if(btns.length && secs.length && window.IntersectionObserver){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(en){ if(en.isIntersecting){ btns.forEach(function(b){ b.classList.toggle('on', b.dataset.to === en.target.id); }); } });
    }, {root: window.matchMedia('(max-width:900px)').matches ? null : stage, rootMargin:'-10% 0px -70% 0px'});
    secs.forEach(function(s){ io.observe(s); });
  }
  if(btns[0]) btns[0].classList.add('on');
  if(wantSec){ var s = wantSec; wantSec = null; setTimeout(function(){ go(s); }, 60); }
}

/* ----- stack ----- */
function viewStack(){
  var groups = stackGroups();   /* categories without components are not rendered */
  return '<section class="view">' + head('/maziar/stack','Stack','Installed components, grouped by layer. Each one lists what it requires and where it is used. Hover a row to trace its dependencies.') +
    '<div class="sgrid" id="sgrid">' + (groups.length ? groups.map(function(d){
      var ids = techIds('d', d);
      return '<section class="sdom"><h2>'+domName(d)+'<small>'+pad(ids.length)+'</small></h2>'+(domText(d)?'<p class="sdesc">'+domText(d)+'</p>':'') +
        ids.map(function(id){
          var t = TECH[id], u = usedIn(id);
          var dep = '';
          if(t.needs.length) dep += '<span>requires '+t.needs.map(function(n){return TECH[n].n.toLowerCase();}).join(', ')+'</span>';
          if(u.length) dep += '<span>used in '+u.map(function(p){return '<a href="#'+p.id+'">'+p.id+'</a>';}).join(' ')+'</span>';
          if(!dep) dep = '<span>no dependencies</span>';
          return '<div class="srow" id="s-'+id+'" data-id="'+id+'"><div class="hd"><b>'+t.n+'</b></div><span class="role">'+t.r+'</span><div class="dep">'+dep+'</div></div>';
        }).join('') + '</section>';
    }).join('') : empty('No components registered yet.')) + '</div></section>';
}
function initStack(){
  var grid = $('#sgrid'); if(!grid) return;
  var clear = function(){ grid.classList.remove('focus'); $$('.srow',grid).forEach(function(r){ r.classList.remove('self','rel'); }); };
  var focusRow = function(row){
    var id = row.dataset.id; if(!TECH[id]) return;
    var rel = {};
    TECH[id].needs.forEach(function(n){ rel[n] = 1; });
    Object.keys(TECH).forEach(function(k){ if(TECH[k].needs.indexOf(id)>-1) rel[k] = 1; });
    grid.classList.add('focus');
    $$('.srow',grid).forEach(function(r){ r.classList.toggle('self', r === row); r.classList.toggle('rel', !!rel[r.dataset.id]); });
  };
  grid.addEventListener('mouseover', function(e){ var row = e.target.closest('.srow'); if(row) focusRow(row); });
  grid.addEventListener('mouseleave', clear);
  /* arriving from a case-study technology link highlights that row */
  if(wantFocus){
    var id = wantFocus; wantFocus = null;
    var row = document.getElementById('s-'+id);
    if(row){
      setTimeout(function(){
        row.scrollIntoView({behavior: reduce?'auto':'smooth', block:'center'});
        focusRow(row);
        setTimeout(clear, 2600);
      }, 80);
    }
  }
}

/* ----- learning ----- */
function viewLearning(){
  var row = function(l){
    return '<div class="lrow '+l.s+'">'+glyph(l.s)+'<span class="ln">'+l.n+'</span><span class="ls">'+l.s.toUpperCase()+'</span><div>'+(l.note?'<p>'+l.note+'</p>':'')+(l.t.length?chips(l.t,false):'')+'</div></div>';
  };
  var act = activeLearn(), q = LEARN.filter(function(l){return l.s==='queued';});
  var group = function(label, list){
    return list.length ? '<div class="lgroup"><span class="lbl">'+label+' · '+pad(list.length)+'</span>'+list.map(row).join('')+'</div>' : '';
  };
  return '<section class="view">' + head('/maziar/learning','Learning','Processes that are running right now. State describes how I am working on something, not how much I know.') +
    '<div class="states">'+Object.keys(STATE_DEF).map(function(s){return '<div>'+glyph(s)+'<b>'+s.toUpperCase()+'</b><small>'+STATE_DEF[s]+'</small></div>';}).join('')+'</div>' +
    (LEARN.length ? group('running', act) + group('queued', q) : '<div class="lgroup">'+empty('Nothing listed yet.')+'</div>') + '</section>';
}

/* ----- lab ----- */
function labGlyph(s){ return s === 'queued' ? 'queued' : (s === 'published' ? 'studying' : 'developing'); }
function viewLab(){
  var n = function(s){ return LAB.filter(function(l){return l.s===s;}).length; };
  return '<section class="view">' + head('/maziar/lab','Lab','Experiments, prototypes and technical notes. Nothing here is finished by design. Entries move from queued to in progress to published.') +
    '<div class="labnote"><span>in progress <b>'+pad(n('in progress'))+'</b></span><span>queued <b>'+pad(n('queued'))+'</b></span><span>published <b>'+pad(n('published'))+'</b></span></div>' +
    '<div class="lablist">' + LAB.map(function(l){
      return '<article class="entry '+(l.s==='queued'?'queued':'')+'"><div><div class="fn">'+l.id+'/</div>'+(l.kind?'<div class="kind">'+l.kind+'</div>':'')+'</div>' +
        '<div><h3>'+l.t+'</h3>'+(l.d?'<p>'+l.d+'</p>':'')+(l.tags.length?chips(l.tags,false):'')+'</div>' +
        '<div class="est">'+glyph(labGlyph(l.s)).replace('width="20" height="20"','width="14" height="14"')+l.s+'</div></article>';
    }).join('') +
    '<article class="entry reserved"><div><div class="fn">next-entry/</div><div class="kind">RESERVED</div></div><div><h3>Next experiment</h3><p>New entries are added as they are started.</p></div><div class="est"></div></article>' +
    '</div></section>';
}

/* ----- contact ----- */
function viewContact(){
  var ch = contactChannels();
  var words = ['','One channel.','Two channels.','Three channels.'];
  return '<section class="view">' + head('/maziar/contact','Contact', ch.length ? words[ch.length]+(CONFIG.email?' Email is the fastest.':'') : '') +
    '<div class="eps">' + (ch.length ? ch.map(function(c){
      return '<div class="ep"><div><h2>'+c[0]+'</h2><div class="chan">'+c[1].toUpperCase()+'</div></div><div class="addr">'+c[2]+'</div><div class="acts">' +
        (c[4] ? '<button class="btn" data-copy="'+c[2]+'">COPY</button><a class="btn" href="mailto:'+c[2]+'">COMPOSE</a>' : '<a class="btn ext" href="'+c[3]+'" target="_blank" rel="noopener">OPEN</a>') + '</div></div>';
    }).join('') : empty('No contact channels listed yet.')) + '</div>' +
    (CONFIG.availability ? '<p class="reach"><i class="dot"></i>'+CONFIG.availability+'</p>' : '') + '</section>';
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
  /* mobile tree expand/collapse */
  var tb = e.target.closest('.tbtn');
  if(tb){
    var open = tb.parentNode.classList.toggle('open');
    tb.setAttribute('aria-expanded', open ? 'true' : 'false');
    return;
  }
  /* case-study technology link to stack row */
  var f = e.target.closest('[data-focus]');
  if(f){ wantFocus = f.dataset.focus; }
});

/* keys 0 to 6 jump to rail entries (the rail advertises "keys 0 to 6") */
document.addEventListener('keydown', function(e){
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  var t = e.target;
  if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if(/^[0-6]$/.test(e.key)){ location.hash = '#' + NAV[+e.key][0]; }
});

/* the CURRENTLY word cycles through active learning areas */
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
      $$('.cur').forEach(function(el){ el.textContent = curWord; el.classList.remove('swap'); });
    }, 360);
  }, 3600);
}

/* ============ BOOT ============ */
buildRail();
var availEl = $('#avail');
if(availEl) availEl.textContent = CONFIG.availability;
render();
startCurrentlyRotation();

})();