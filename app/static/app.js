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
/* esc/md: all NEW rendering escapes data. md() then allows `inline code` only
   (adapted from versions: "technical edotorial/maziyar Heydari.html", md()). */
var esc = function(v){ return str(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var md = function(v){ return esc(v).replace(/`([^`]+)`/g,'<code>$1</code>'); };
var isoDay = function(v){ var m = /^(\d{4}-\d{2}-\d{2})/.exec(str(v)); return m ? m[1] : ''; };
var paras = function(v){ if(typeof v === 'string') v = v ? [v] : []; return arr(v).map(str).filter(Boolean); };
var slug = function(v){ return str(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); };
var BLOCKS = ['p','h','list','code','terminal','diagram'];
/* long-form body: [{type:'p'|'h'|'list'|'code'|'terminal'|'diagram', text, items, caption}] (plain strings count as paragraphs) */
function blocks(v){
  return arr(v).map(function(b){
    if(typeof b === 'string') return {type:'p', text:b, items:[], caption:''};
    if(!isObj(b)) return null;
    var t = str(b.type).toLowerCase(); if(BLOCKS.indexOf(t) < 0) return null;
    return {type:t, text:str(b.text), items:arr(b.items).map(str).filter(Boolean), caption:str(b.caption)};
  }).filter(function(b){ return b && (b.text || b.items.length); });
}

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

var I18N = window.DSI18N;
var tr = I18N.t;          /* interface string for the current language (dictionary: i18n.js) */
var dg = I18N.digits;     /* digits localised for the current language */

var GLYPHS = ['exploring','learning','studying','developing','queued'];
var STATS = ['completed','active','prototype'];
var DEFAULT_STATE_DEF = {
  exploring:'Looking around, no commitment yet.',
  learning:'Working through it step by step.',
  studying:'Going deep on the details.',
  developing:'Building something with it.',
  queued:'Planned, not started.'
};
var LANGS = ['fa','en'];

/* ---- per-type normalisers: each takes raw data and returns the complete normalised object ---- */
function normDomain(k, v){ return isObj(v) ? {n:str(v.n)||k, r:str(v.r)} : {n:str(v)||k, r:''}; }
function normTech(id, t){
  var d = str(t.d), g = str(t.g);
  if(!d) d = g || 'other';
  return {n:str(t.n)||id, d:d, g:g, r:str(t.r), needs:arr(t.needs).map(str)};
}
function normProj(p){
  var dt = isObj(p.detail) ? p.detail : {};
  var pick = function(k){
    var v = p[k];
    if(v == null || (Array.isArray(v) && !v.length) || v === '') v = dt[k];
    return v;
  };
  var overview = pick('overview'); if(typeof overview === 'string') overview = overview ? [overview] : [];
  return {
    id:str(p.id), name:str(p.name)||str(p.id), lang:str(pick('lang')), kind:str(pick('kind')),
    status: STATS.indexOf(p.status) > -1 ? p.status : 'prototype',
    desc:str(pick('desc')), repo:str(pick('repo')),
    uses: arr(pick('uses')).map(str),
    extras: arr(pick('extras')).filter(function(x){ return Array.isArray(x) && x[0] != null; }).map(function(x){ return [str(x[0]), str(x[1])]; }),
    overview: arr(overview).map(str).filter(Boolean),
    arch: arr(pick('arch')).filter(isObj).map(function(t){
      return {l:str(t.l), n:arr(t.n).filter(isObj).map(function(x){ return {t:str(x.t), s:str(x.s), side:!!x.side}; })};
    }).filter(function(t){ return t.n.length; }),
    problem: paras(pick('problem')),
    outcome: paras(pick('outcome')),
    limitations: paras(pick('limitations')),
    body: blocks(pick('body')),
    updated: isoDay(pick('updated')),
    decisions: arr(pick('decisions')).filter(isObj).map(function(d){ return {t:str(d.t), w:str(d.w), x:str(d.x)}; }),
    challenges: arr(pick('challenges')).filter(isObj).map(function(c){ return {p:str(c.p), r:str(c.r)}; })
  };
}
function normLearn(l, id){
  return {id:id, n:str(l.n), s: GLYPHS.indexOf(l.s) > -1 ? l.s : 'queued', note:str(l.note), t:arr(l.t).map(str), updated:isoDay(l.updated)};
}
function normLab(l, i){
  return {id:str(l.id)||('entry-'+(i+1)), t:str(l.t)||('Entry '+(i+1)), kind:str(l.kind), d:str(l.d),
          s:str(l.s).toLowerCase()||'queued', tags:arr(l.tags).map(str), body:blocks(l.body), updated:isoDay(l.updated)};
}
function normAbout(a){
  return {
    lede:str(a.lede),
    body:arr(a.body).map(str).filter(Boolean),
    principles:arr(a.principles).filter(function(p){ return Array.isArray(p) && p[0] != null; }).map(function(p){ return [str(p[0]), str(p[1])]; }),
    /* optional extra narrative blocks: [{t:'Title', p:['paragraph', ...]}] (journey, infrastructure experience, ...) */
    sections:arr(a.sections).filter(isObj).map(function(x){ return {t:str(x.t||x.title), p:paras(x.p||x.body)}; }).filter(function(x){ return x.t && x.p.length; })
  };
}
var copyObj = function(x, o){ var c = {}; Object.keys(x).forEach(function(k){ c[k] = x[k]; }); if(o) Object.keys(o).forEach(function(k){ c[k] = o[k]; }); return c; };

/* ---- localised content --------------------------------------------------------------------
   Content is never machine-translated here. A second language exists only when somebody supplied it:
     a) Django, per item:   item.i18n = {fa: {<same keys as the item, translated>}}   (see the backend checklist)
     b) data.js, per type:  I18N_CONTENT = {fa: {PROJ:{<id>:{...}}, LEARN:{...}, LAB:{...}, DOMAINS:{...}, TECH:{...},
                            ABOUT:{...}, CONFIG:{availability}, COPY:{'copy.hero.sum': '...'}, STATE_DEF:{...}}}
   Only the fields that were supplied replace the base text; everything else keeps the original and is
   shown as it is (marked with its own lang/dir, plus a page notice when the whole page is in the other language). */
function normalize(D){
  var N = {loc:{fa:{}, en:{}}};
  var OV = isObj(D.I18N_CONTENT) ? D.I18N_CONTENT : {};
  var overlay = function(raw, type, id, lang){
    var a = isObj(OV[lang]) && isObj(OV[lang][type]) && isObj(OV[lang][type][id]) ? OV[lang][type][id] : null;
    var b = isObj(raw) && isObj(raw.i18n) && isObj(raw.i18n[lang]) ? raw.i18n[lang] : null;
    return (a || b) ? copyObj(a || {}, b) : null;     /* Django's value wins over the bundled one */
  };
  /* keeps only the fields the overlay really supplied, already normalised with the same code as the base */
  var localise = function(obj, raw, type, id, fn){
    LANGS.forEach(function(lang){
      var over = overlay(raw, type, id, lang); if(!over) return;
      var full = fn(copyObj(raw, over)), out = {}, any = false;
      Object.keys(over).forEach(function(k){
        var v = over[k];
        if(k === 'i18n' || v == null || v === '' || (Array.isArray(v) && !v.length) || !(k in full)) return;
        out[k] = full[k]; any = true;
      });
      if(any){ obj.loc = obj.loc || {}; obj.loc[lang] = out; }
    });
    return obj;
  };

  var c = isObj(D.CONFIG) ? D.CONFIG : {};
  N.CONFIG = {rev:str(c.rev), email:str(c.email), github:str(c.github), linkedin:str(c.linkedin), availability:str(c.availability)};
  LANGS.forEach(function(lang){
    var o = isObj(OV[lang]) && isObj(OV[lang].CONFIG) ? OV[lang].CONFIG : null;
    if(o && str(o.availability)) N.loc[lang].CONFIG = {availability:str(o.availability)};
    if(isObj(OV[lang]) && isObj(OV[lang].COPY)) N.loc[lang].COPY = OV[lang].COPY;
    if(isObj(OV[lang]) && isObj(OV[lang].STATE_DEF)) N.loc[lang].STATE_DEF = OV[lang].STATE_DEF;
  });

  /* domains */
  N.DOMAINS = {};
  var dsrc = isObj(D.DOMAINS) ? D.DOMAINS : {};
  Object.keys(dsrc).forEach(function(k){
    N.DOMAINS[k] = localise(normDomain(k, dsrc[k]), isObj(dsrc[k]) ? dsrc[k] : {n:str(dsrc[k])}, 'DOMAINS', k, function(r){ return normDomain(k, r); });
  });
  var ensureDomain = function(k){ if(k && !N.DOMAINS[k]) N.DOMAINS[k] = {n:k, r:''}; };

  /* technologies */
  N.TECH = {};
  var tsrc = isObj(D.TECH) ? D.TECH : {};
  Object.keys(tsrc).forEach(function(id){
    var t = tsrc[id]; if(!isObj(t)) return;
    var n = normTech(id, t);
    ensureDomain(n.d); ensureDomain(n.g);
    N.TECH[id] = localise(n, t, 'TECH', id, function(r){ return normTech(id, r); });
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
    var n = normProj(p);
    n.uses = liveTech(n.uses);
    N.PROJ.push(localise(n, p, 'PROJ', n.id, normProj));
  });

  var featuredIds = {};
  arr(D.FEATURED_PROJ).forEach(function(p){
    if(isObj(p) && str(p.id)) featuredIds[p.id] = 1;
  });
  N.FEATURED_IDS = featuredIds;

  /* learning */
  var sd = isObj(D.STATE_DEF) ? D.STATE_DEF : {};
  N.STATE_DEF = {};
  Object.keys(sd).forEach(function(k){ if(GLYPHS.indexOf(k) > -1) N.STATE_DEF[k] = str(sd[k]); });
  if(!Object.keys(N.STATE_DEF).length) N.STATE_DEF = DEFAULT_STATE_DEF;
  var lseen = {};
  N.LEARN = arr(D.LEARN).filter(function(l){ return isObj(l) && str(l.n); }).map(function(l, i){
    var id = str(l.id) || slug(l.n) || ('item-'+(i+1));
    if(lseen[id]) id += '-'+(i+1);
    lseen[id] = 1;
    var n = normLearn(l, id); n.t = liveTech(n.t);
    return localise(n, l, 'LEARN', id, function(r){ return normLearn(r, id); });
  });
  N.LEARN_LINKS = liveTech(D.LEARN_LINKS);

  /* lab */
  N.LAB = arr(D.LAB).filter(isObj).map(function(l, i){
    var n = normLab(l, i); n.tags = liveTech(n.tags);
    return localise(n, l, 'LAB', n.id, function(r){ return normLab(r, i); });
  });
  N.LAB_LINKS = liveTech(D.LAB_LINKS);

  /* about */
  var a = isObj(D.ABOUT) ? D.ABOUT : {};
  N.ABOUT = normAbout(a);
  /* ABOUT is a single object: its overlay is I18N_CONTENT.<lang>.ABOUT (no id level) or ABOUT.i18n.<lang> */
  LANGS.forEach(function(lang){
    var o = isObj(OV[lang]) && isObj(OV[lang].ABOUT) ? OV[lang].ABOUT : null;
    var b = isObj(a.i18n) && isObj(a.i18n[lang]) ? a.i18n[lang] : null;
    if(!o && !b) return;
    var over = copyObj(o || {}, b), full = normAbout(copyObj(a, over)), out = {};
    Object.keys(over).forEach(function(k){
      var v = over[k]; if(v == null || v === '' || (Array.isArray(v) && !v.length) || !(k in full)) return;
      out[k] = full[k];
    });
    if(Object.keys(out).length) N.loc[lang].ABOUT = out;
  });
  return N;
}

/* the normalised data with one language's content laid over it */
function ov(x, lang){
  var o = x && x.loc && x.loc[lang];
  if(!o) return x;
  var c = copyObj(x, o);
  c._loc = Object.keys(o);          /* which fields really are in this language */
  return c;
}
function localize(N, lang){
  var L = {}, g = N.loc[lang] || {};
  L.CONFIG = copyObj(N.CONFIG, g.CONFIG);
  L.DOMAINS = {}; Object.keys(N.DOMAINS).forEach(function(k){ L.DOMAINS[k] = ov(N.DOMAINS[k], lang); });
  L.TECH = {};    Object.keys(N.TECH).forEach(function(k){ L.TECH[k] = ov(N.TECH[k], lang); });
  L.STACK_ORDER = N.STACK_ORDER; L.GRAPH_ORDER = N.GRAPH_ORDER;
  L.PROJ = N.PROJ.map(function(p){ return ov(p, lang); });
  L.FEATURED_PROJ = L.PROJ.filter(function(p){ return !!N.FEATURED_IDS[p.id]; });
  L.LEARN = N.LEARN.map(function(l){ return ov(l, lang); });
  L.LAB = N.LAB.map(function(l){ return ov(l, lang); });
  L.LEARN_LINKS = N.LEARN_LINKS; L.LAB_LINKS = N.LAB_LINKS;
  L.ABOUT = copyObj(N.ABOUT, g.ABOUT);
  L.ABOUT._loc = g.ABOUT ? Object.keys(g.ABOUT) : [];
  L.COPY = g.COPY || {};
  /* state legend: owner data (data.js) for English; the dictionary for other languages unless the owner supplied text */
  L.STATE_DEF = {};
  Object.keys(N.STATE_DEF).forEach(function(k){
    var own = g.STATE_DEF && str(g.STATE_DEF[k]);
    L.STATE_DEF[k] = own || (lang === 'en' ? N.STATE_DEF[k] : tr('state.'+k, null, lang));
  });
  return L;
}

var BASE = normalize(DevSystemAdapter.load());
var D, CONFIG, DOMAINS, STACK_ORDER, GRAPH_ORDER, TECH, PROJ, FEATURED_PROJ, LEARN, STATE_DEF, LEARN_LINKS, LAB, LAB_LINKS, ABOUT;
function applyLocale(lang){
  D = localize(BASE, lang);
  CONFIG = D.CONFIG; DOMAINS = D.DOMAINS; STACK_ORDER = D.STACK_ORDER; GRAPH_ORDER = D.GRAPH_ORDER;
  TECH = D.TECH; PROJ = D.PROJ; FEATURED_PROJ = D.FEATURED_PROJ;
  LEARN = D.LEARN; STATE_DEF = D.STATE_DEF; LEARN_LINKS = D.LEARN_LINKS;
  LAB = D.LAB; LAB_LINKS = D.LAB_LINKS; ABOUT = D.ABOUT;
}
applyLocale(I18N.lang);

/* ============ HELPERS ============ */
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
var pad = function(n){ return dg(n < 10 ? '0'+n : ''+n); };
/* label of a data value (status, kind, ...) in the current language; unknown values stay as they are */
var lbl = function(prefix, v){ return I18N.has(prefix+v, 'en') ? tr(prefix+v) : v; };
var pstat = function(v){ return lbl('p.', v); };
var lstate = function(v){ return lbl('l.', v); };
var labStatus = function(v){ return lbl('lab.s.', v); };
var labKind = function(v){ return lbl('lab.k.', String(v).toLowerCase()); };
/* upper-case only where the language has case (the design uses upper-case mono labels in English) */
/* a middle dot next to Persian digits reads as a Persian zero, so Persian uses a dash there */
var sepN = function(){ return I18N.lang === 'fa' ? ' — ' : ' · '; };
var up = function(v){ return I18N.lang === 'en' ? String(v).toUpperCase() : String(v); };
/* attributes for a block of authored content: dir=auto always, lang only when its script differs from the page */
var ca = function(text){ var l = I18N.detect(text); return ' dir="auto"' + (l && l !== I18N.lang ? ' lang="'+l+'"' : ''); };
/* technical strings (paths, ids, URLs, e-mail) keep left-to-right order inside right-to-left text */
var ltr = function(v){ return '<bdi dir="ltr">'+esc(v)+'</bdi>'; };
/* owner-authored copy that lives in the frontend: Persian only if the owner supplied it, otherwise English, labelled as such */
function copyT(key){
  var c = D.COPY && D.COPY[key];
  if(c) return {t:str(c), l:I18N.lang};
  if(I18N.has(key)) return {t:tr(key), l:I18N.lang};
  return {t:tr(key, null, 'en'), l:'en'};
}
var copyAttr = function(c){ return c.l !== I18N.lang ? ' lang="'+c.l+'" dir="'+I18N.DIRS[c.l]+'"' : ''; };
/* when the main text of a page is in the other language, say so instead of leaving it unexplained */
function langNotice(texts){
  var c = I18N.count(texts.filter(Boolean).join(' ')), total = c.fa + c.en;
  if(total < 12) return '';
  var other = I18N.lang === 'fa' ? 'en' : 'fa';
  return c[other] / total >= 0.6 ? '<p class="lnote" role="note">'+tr('notice.only.'+other)+'</p>' : '';
}
var projById = function(id){ return PROJ.filter(function(p){return p.id===id;})[0]; };
var noteById = function(id){ return LAB.filter(function(l){return l.id===id;})[0]; };
var techName = function(id){ return TECH[id] ? TECH[id].n : id; };
var shared = function(a, b){ return a.filter(function(x){ return b.indexOf(x) > -1; }); };
/* Cross-links are derived from shared technology tags (the only relationship the data contract carries). */
function relatedFor(techs, skip){
  skip = skip || {};
  var rank = function(list, get, skipId){
    return list.map(function(x){ return {x:x, sh:shared(techs, get(x))}; })
      .filter(function(r){ return r.sh.length && r.x.id !== skipId; })
      .sort(function(a, b){ return b.sh.length - a.sh.length; });
  };
  return {
    projects: rank(PROJ, function(p){ return p.uses; }, skip.project),
    notes: rank(LAB, function(l){ return l.tags; }, skip.note),
    learn: rank(LEARN, function(l){ return l.t; }, skip.learn)
  };
}
function relatedHTML(rel){
  var row = function(href, name, sh, anchor){
    return '<li><a href="'+esc(href)+'"'+(anchor?' data-anchor="'+esc(anchor)+'"':'')+ca(name)+'>'+esc(name)+'</a><small>'+esc(sh.map(techName).join(' · '))+'</small></li>';
  };
  var grp = function(label, rows, mk){
    if(!rows.length) return '';
    var cap = 4;
    return '<div class="relgrp"><span class="lbl">'+label+sepN()+pad(rows.length)+'</span><ul>'+rows.slice(0, cap).map(mk).join('')+'</ul>'+(rows.length > cap ? '<small class="more">'+tr('more',{n:dg(rows.length-cap)})+'</small>' : '')+'</div>';
  };
  return grp(tr('rel.projects'), rel.projects, function(r){ return row('#'+r.x.id, r.x.name, r.sh); }) +
         grp(tr('rel.notes'), rel.notes, function(r){ return row('#lab/'+r.x.id, r.x.t, r.sh); }) +
         grp(tr('rel.learning'), rel.learn, function(r){ return row('#learning', r.x.n, r.sh, 'l-'+r.x.id); });
}
function relatedSec(rel){
  var h = relatedHTML(rel);
  return h ? '<section class="csec" id="related"><span class="lbl">'+tr('sec.related')+'</span><p class="relnote">'+tr('rel.note')+'</p><div class="relgrid">'+h+'</div></section>' : '';
}
function techLinks(ids){
  return '<span class="chips">'+arr(ids).map(function(id){
    return TECH[id] ? '<a class="chip" href="#stack" data-focus="'+esc(id)+'" dir="auto">'+esc(TECH[id].n)+'</a>' : '';
  }).join('')+'</span>';
}
function techListHTML(ids){
  return '<ul class="techlist">'+ids.map(function(id){ return '<li><a href="#stack" data-focus="'+esc(id)+'">'+esc(TECH[id].n)+'</a><span'+ca(TECH[id].r)+'>'+esc(TECH[id].r)+'</span></li>'; }).join('')+'</ul>';
}
var host = function(u){ return str(u).replace(/^https?:\/\//,'').replace(/\/$/,''); };
var domName = function(k){ return (DOMAINS[k] && DOMAINS[k].n) || k || ''; };
var domText = function(k){ return (DOMAINS[k] && DOMAINS[k].r) || ''; };
var techIds = function(key, val){ return Object.keys(TECH).filter(function(k){ return TECH[k][key] === val; }); };
var graphGroups = function(){ return GRAPH_ORDER.filter(function(g){ return techIds('g', g).length; }); };
var stackGroups = function(){ return STACK_ORDER.filter(function(d){ return techIds('d', d).length; }); };
var empty = function(t){ return '<p class="empty-note">'+t+'</p>'; };
var curWord = tr('word.learning');   /* the rotating "CURRENTLY" word */
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
    if(pin && t.g) return '<button class="chip" data-pin="'+id+'" dir="auto">'+esc(t.n)+'</button>';
    return '<span class="chip" dir="auto">'+esc(t.n)+'</span>';
  }).join('')+'</span>';
}
function activeLearn(){ return LEARN.filter(function(l){return l.s!=='queued';}); }
function usedIn(id){ return PROJ.filter(function(p){return p.uses.indexOf(id)>-1;}); }
function contactChannels(){
  var ch = [];
  if(CONFIG.email) ch.push([tr('ch.EMAIL'),tr('ch.direct'),CONFIG.email,null,true]);
  if(CONFIG.github) ch.push([tr('ch.GITHUB'),tr('ch.source'),host(CONFIG.github),CONFIG.github,false]);
  if(CONFIG.linkedin) ch.push([tr('ch.LINKEDIN'),tr('ch.pro'),host(CONFIG.linkedin),CONFIG.linkedin,false]);
  return ch;
}

/* ============ SHELL: rail, crumbs, status ============ */
var NAV = [];
function buildNav(){
  NAV = [
    ['home',tr('nav.home')],['about',tr('nav.about')],['projects',tr('nav.projects'),PROJ.length],['stack',tr('nav.stack'),Object.keys(TECH).length],
    ['learning',tr('nav.learning'),LEARN.length],['lab',tr('nav.lab'),LAB.length],['contact',tr('nav.contact'),contactChannels().length]
  ];
}
function buildRail(){
  var rail = $('#rail'); if(!rail) return;
  var h = '<div><span class="lbl"><bdi dir="ltr">/maziyar</bdi></span><div class="rlist">';
  NAV.forEach(function(n,i){
    h += '<a href="#'+n[0]+'" data-v="'+n[0]+'"><span class="k">'+dg(i)+'</span><span class="rn">'+esc(n[1])+'</span><span class="rm">'+(n[2]?pad(n[2]):'')+'</span></a>';
  });
  h += '</div></div><div class="proc"><span class="lbl">'+tr('rail.processes')+'</span>';
  var act = activeLearn();
  if(act.length){
    act.forEach(function(l){
      h += '<a href="#learning">'+glyph(l.s)+'<span'+ca(l.n)+'>'+esc(l.n.toLowerCase())+'<small>'+esc(lstate(l.s))+'</small></span></a>';
    });
  } else {
    h += '<span class="empty-note">'+tr('rail.none')+'</span>';
  }
  h += '</div><div class="rev">'+(CONFIG.rev ? tr('rail.rev',{v:ltr(CONFIG.rev)})+'<br>' : '')+tr('rail.keys')+'</div>';
  rail.innerHTML = h;
}
function viewOf(r){ return r.v === 'project' ? 'projects' : (r.v === 'note' ? 'lab' : r.v); }
function pageTitle(r){
  var t = r.v === 'project' ? r.p.name : (r.v === 'note' ? r.n.t : (r.v === 'home' ? '' : tr('name.'+r.v)));
  return t ? t + ' · ' + tr('doc.title') : tr('doc.title');
}
function setChrome(r){
  var view = viewOf(r);
  var shell = $('#shell');
  if(shell) shell.setAttribute('data-view', r.v === 'home' ? 'home' : view);
  $$('.rlist a').forEach(function(a){ a.classList.toggle('on', a.dataset.v === view); });
  /* ids are technical path segments (always left-to-right); labels are what the visitor reads */
  var segs = [['maziyar', '#home', tr('crumb.maziyar'), false]];
  if(r.v !== 'home') segs.push([view, '#'+view, tr('crumb.'+view), false]);
  if(r.v === 'project') segs.push([r.p.id, '#'+r.p.id, r.p.id, true]);
  if(r.v === 'note') segs.push([r.n.id, '#lab/'+r.n.id, r.n.id, true]);
  var crumbs = $('#crumbs');
  if(crumbs) crumbs.innerHTML = segs.map(function(s,i){
    var last = i === segs.length-1;
    var label = s[3] ? ltr(s[2]) : esc(s[2]);
    return '<i>/</i>' + (last ? '<span class="cur-seg" aria-current="page">'+label+'</span>' : '<a href="'+esc(s[1])+'">'+label+'</a>');
  }).join('');
  var path = '/' + segs.map(function(s){return s[0];}).join('/');
  var status = $('#status');
  var focus = copyT('copy.hero.focus');
  if(status) status.innerHTML = '<span><b dir="ltr">'+esc(path)+'</b></span><span><span>'+tr('status.focus')+' <b'+copyAttr(focus)+'>'+esc(focus.t)+'</b></span><span>'+tr('status.now')+' <b class="cur">'+esc(curWord)+'</b></span></span>';
  document.title = pageTitle(r);
}

/* ============ ROUTER ============ */
var VIEWS = ['about','projects','stack','learning','lab','contact'];
function route(){
  var h = (location.hash||'').slice(1);
  try{ h = decodeURIComponent(h); }catch(err){}
  if(VIEWS.indexOf(h) > -1) return {v:h};
  var p = projById(h); if(p) return {v:'project', p:p};
  var m = /^lab\/(.+)$/.exec(h);
  if(m){ var n = noteById(m[1]); return n ? {v:'note', n:n} : {v:'lab'}; }
  return {v:'home'};
}
var booted = false;
var wantAnchor = null;   /* element id to scroll to and flash after navigating */
var tocOn = false;       /* true while a long view (case study / note) is on screen */
function settleAnchor(){
  if(!wantAnchor) return;
  var id = wantAnchor; wantAnchor = null;
  setTimeout(function(){
    var el = document.getElementById(id); if(!el) return;
    el.scrollIntoView({behavior: reduce?'auto':'smooth', block:'center'});
    el.classList.add('flash');
    setTimeout(function(){ el.classList.remove('flash'); }, 2200);
  }, 80);
}
function render(opts){
  opts = opts || {};
  var keep = opts.keep || null;   /* set when only the language changed: stay where the visitor is */
  var r = route();
  var stage = $('#stage'); if(!stage) return;
  if(r.v !== 'home' && mapObserver){ mapObserver.disconnect(); mapObserver = null; }
  tocOn = false;
  var tt = $('#totop'); if(tt) tt.hidden = true;
  var html = ({home:viewHome, about:viewAbout, projects:viewProjects, stack:viewStack, learning:viewLearning, lab:viewLab, contact:viewContact,
    project:function(){return viewProject(r.p);}, note:function(){return viewNote(r.n);}})[r.v]();
  stage.innerHTML = html;
  setChrome(r);
  if(!keep){
    stage.scrollTop = 0; window.scrollTo(0,0);
    if(booted && stage.focus) stage.focus({preventScroll:true});   /* move keyboard/AT context to the new view */
  }
  if(r.v === 'home') initMap();
  if(r.v === 'project' || r.v === 'note') initToc();
  if(r.v === 'stack') initStack();
  if(r.v === 'lab') initLab();
  if(keep) restoreSnap(keep); else settleAnchor();
  booted = true;
}
window.addEventListener('hashchange', function(){ render(); });
/* A language switch re-renders in place. These two keep the visitor's reading position:
   the section (or row) at the top of the viewport and how far into it they were. Element ids are language neutral. */
function viewSnap(){
  var st = $('#stage'); if(!st) return null;
  var mob = mq900.matches, base = mob ? 0 : st.getBoundingClientRect().top, p = scrollPos();
  var snap = {y:p.y, max:Math.max(p.h - p.vh, 1), id:'', off:0};
  var els = $$('.csec[id], .lrow[id], .srow[id], .lgroup, .entry', st);
  for(var i = 0; i < els.length; i++){
    var r = els[i].getBoundingClientRect();
    if(r.bottom > base + 8){ if(els[i].id){ snap.id = els[i].id; snap.off = base - r.top; } break; }
  }
  return snap;
}
function restoreSnap(snap){
  var st = $('#stage'); if(!st || !snap) return;
  var mob = mq900.matches, base = mob ? 0 : st.getBoundingClientRect().top, y;
  var el = snap.id ? document.getElementById(snap.id) : null;
  if(el) y = scrollPos().y + (el.getBoundingClientRect().top - base) + snap.off;
  else { var p = scrollPos(); y = (snap.y / snap.max) * Math.max(p.h - p.vh, 0); }
  if(mob) window.scrollTo(0, y); else st.scrollTop = y;
}
/* programmatic navigation (command palette): works even when the hash is unchanged */
function go(hash, o){
  o = o || {};
  wantFocus = o.focus || null; wantAnchor = o.anchor || null;
  if(location.hash === hash) render(); else location.hash = hash;
}

/* ============ VIEWS ============ */
function head(path, title, lede, notice){
  return '<a class="back" href="#home">'+tr('back.home')+'</a><header class="vhead"><p class="eyebrow">'+ltr(path)+'</p><h1>'+title+'</h1>'+(lede?'<p class="lede"'+ca(lede)+'>'+esc(lede)+'</p>':'')+'</header>'+(notice||'');
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
      nodes += '<button class="node tech'+(boot?' bnode':'')+'" style="grid-column:3;grid-row:'+row+';--c:3;--r:'+row+'" data-id="'+id+'"><i class="sq"></i><span dir="auto">'+esc(TECH[id].n)+'</span></button>';
      rows.push('32px'); row++;
    });
    nodes += '<button class="node dom'+(boot?' bnode':'')+'" style="grid-column:2;grid-row:'+start+'/'+row+';align-self:center;--c:2;--r:'+start+'" data-id="dom:'+g+'"><b>'+domName(g)+'</b><small>'+tr('node.components',{n:pad(ids.length)})+'</small></button>';
    if(gi < groups.length-1){ rows.push('10px'); row++; }
  });
  /* Trailing flexible row: the root column and the module column span every row.
     With few or no components the fixed 32px rows are shorter than that content,
     which made the columns overlap. This row absorbs whatever extra height they need. */
  rows.push('minmax(0,1fr)'); row++;

  var base = FEATURED_PROJ.length * 4;
  var mods = FEATURED_PROJ.map(function(p, i){
    return '<button class="node mod'+(boot?' bnode':'')+'" style="--c:4;--r:'+(i*4)+'" data-id="m:'+p.id+'"><span class="mt"><b'+ca(p.name)+'>'+esc(p.name)+'</b><small'+ca(p.lang)+'>'+esc(p.lang)+'</small></span>'+stat(p.status)+'</button>';
  }).join('') +
  '<button class="node mod'+(boot?' bnode':'')+'" style="--c:4;--r:'+(base+2)+'" data-id="m:learning"><span class="mt"><b>'+tr('node.learning')+'</b><small>'+tr('node.active',{n:dg(activeLearn().length)})+'</small></span>'+glyph('developing').replace('width="20" height="20"','width="14" height="14"')+'</button>' +
  '<button class="node mod'+(boot?' bnode':'')+'" style="--c:4;--r:'+(base+4)+'" data-id="m:lab"><span class="mt"><b>'+tr('node.lab')+'</b><small>'+tr('node.entries',{n:dg(LAB.length)})+'</small></span><svg class="sg" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4.5 1.5h3M5 1.5v3.2L2 10h8L7 4.7V1.5" fill="none" stroke="currentColor" stroke-width="1.1"/></svg></button>';
  MAP.rows = rows.join(' '); MAP.total = row;
  return '<section class="view home'+(boot?' boot':'')+'">' +
    '<div class="mapwrap"><div class="map" id="map" role="group" aria-label="'+esc(tr('map.aria'))+'" style="grid-template-rows:'+MAP.rows+'">' +
    '<svg class="edges" id="edges" aria-hidden="true"></svg>' +
    '<div class="rootcol" style="grid-row:1/'+MAP.total+'">' + rootBlock(boot) + '<i class="port" id="port"></i></div>' +
    nodes + '<div class="mods" style="grid-row:1/'+MAP.total+'">'+mods+'</div>' +
    '</div><aside class="inspect" id="inspect" aria-live="polite"></aside></div>' +
    mobileTree() + '</section>';
}
function rootBlock(boot, noLinks){
  var r = function(i){ return boot ? ' reveal" style="--i:'+i : ''; };
  var sum = copyT('copy.hero.sum'), foc = copyT('copy.hero.focus');
  return '<p class="eyebrow'+r(0)+'"><bdi dir="ltr">/maziyar</bdi></p>' +
    '<h1 class="name'+r(1)+'" lang="en"><span>MAZIYAR</span><span>HEYDARI</span></h1>' +
    '<p class="role'+r(2)+'">'+esc(tr('hero.role'))+'</p>' +
    '<p class="sum'+r(3)+'"'+copyAttr(sum)+'>'+esc(sum.t)+'</p>' +
    '<dl class="sys'+r(4)+'"><div><dt>'+tr('hero.system')+'</dt><dd>'+esc(tr('role.system'))+'</dd></div><div><dt>'+tr('hero.focus')+'</dt><dd'+copyAttr(foc)+'>'+esc(foc.t)+'</dd></div><div><dt>'+tr('hero.now')+'</dt><dd><span class="cur">'+esc(curWord)+'</span></dd></div></dl>' +
    (noLinks ? '' : '<div class="rootlinks'+r(5)+'"><a href="#projects">'+tr('hero.projects')+'</a><a href="#contact">'+tr('hero.contact')+'</a></div>');
}

/* ----- map behavior ----- */
var edges = [], hover = null, pin = null, drewOnce = false, mapObserver = null, carryPin = null;
function initMap(){
  hover = null; pin = carryPin; carryPin = null; edges = [];   /* a pinned node survives a language switch */
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
    var b = e.target.closest('[data-pin]'); if(b){ pin = b.dataset.pin; hover = null; paint(); return; }
    if(e.target.closest('[data-clear]')){ pin = null; hover = null; paint(); }
  });
  drawEdges(); paint();
}
function elbow(x1,y1,x2,y2){
  var dy = y2-y1;
  if(Math.abs(dy) < 1) return 'M'+x1+' '+y1+'H'+x2;
  var sx = x2 >= x1 ? 1 : -1;   /* the graph flows right-to-left in a right-to-left page */
  var xm = x1 + (x2-x1)/2, d = dy>0?1:-1, r = Math.min(8, Math.abs(dy)/2, Math.abs(x2-x1)/2);
  return 'M'+x1+' '+y1+'H'+(xm-sx*r)+'Q'+xm+' '+y1+' '+xm+' '+(y1+d*r)+'V'+(y2-d*r)+'Q'+xm+' '+y2+' '+(xm+sx*r)+' '+y2+'H'+x2;
}
function drawEdges(){
  var map = $('#map'), svg = $('#edges'), port = $('#port');
  if(!map || !svg || !port) return;
  var mr = map.getBoundingClientRect(); if(!mr.width) return;
  /* 's' = the inline-start edge of a node, 'e' = its inline-end edge (left/right in English, right/left in Persian) */
  var rtl = document.documentElement.dir === 'rtl';
  var pt = function(el, side){
    if(!el) return null;
    var r = el.getBoundingClientRect();
    var right = (side === 'e') ? !rtl : rtl;
    return {x:(right?r.right:r.left)-mr.left, y:r.top+r.height/2-mr.top};
  };
  var p0 = pt(port,'e');
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
    var a = pt(dn,'s'), ar = pt(dn,'e');
    add('root','dom:'+g,'h',elbow(p0.x,p0.y,a.x,a.y),k++);
    techIds('g', g).forEach(function(t){
      var tn = $('[data-id="'+t+'"]'); if(!tn) return;
      var b = pt(tn,'s');
      add('dom:'+g,t,'h',elbow(ar.x,ar.y,b.x,b.y),k++);
    });
  });
  var mods = FEATURED_PROJ.map(function(p){
    return {id:'m:'+p.id, t:p.uses};
  }).concat([
    {id:'m:learning', t:LEARN_LINKS},
    {id:'m:lab', t:LAB_LINKS}
  ]);
  mods.forEach(function(m){
    var mn = $('[data-id="'+m.id+'"]'); if(!mn) return;
    var b = pt(mn,'s');
    arr(m.t).forEach(function(t){
      if(!TECH[t] || !TECH[t].g) return;
      var tn = $('[data-id="'+t+'"]'); if(!tn) return;
      var a = pt(tn,'e');
      var kx = (b.x-a.x)*0.55;
      add(t,m.id,'d','M'+a.x+' '+a.y+'C'+(a.x+kx)+' '+a.y+' '+(b.x-kx)+' '+b.y+' '+b.x+' '+b.y,0);
    });
  });
  svg.setAttribute('viewBox','0 0 '+mr.width+' '+mr.height);
  svg.innerHTML = out; edges = list; drewOnce = true;
  paint();
}
function domOfTech(t){ return TECH[t] && TECH[t].g ? 'dom:'+TECH[t].g : 'root'; }
/* components linked to a technology through requires / required-by (shown softly, not dimmed) */
function softRelated(id){
  var s = {};
  if(!TECH[id]) return s;
  TECH[id].needs.forEach(function(n){ s[n] = 1; });
  Object.keys(TECH).forEach(function(k){ if(TECH[k].needs.indexOf(id) > -1) s[k] = 1; });
  return s;
}
function related(id){
  var s = {}; s[id] = 1;
  if(id.indexOf('dom:') === 0){ s.root = 1; edges.forEach(function(e){ if(e.a===id) s[e.b] = 1; }); }
  else if(id.indexOf('m:') === 0){ s.root = 1; edges.forEach(function(e){ if(e.b===id){ s[e.a] = 1; s[domOfTech(e.a)] = 1; } }); }
  else { s.root = 1; s[domOfTech(id)] = 1; edges.forEach(function(e){ if(e.a===id && e.b.indexOf('m:')===0) s[e.b] = 1; }); }
  return s;
}
function paint(){
  var map = $('#map'); if(!map) return;
  var act = pin || hover, s = act ? related(act) : null, soft = act ? softRelated(act) : {};
  $$('.node', map).forEach(function(n){
    var id = n.dataset.id;
    n.classList.toggle('dim', !!s && !s[id] && !soft[id]);
    n.classList.toggle('is-rel', !!s && !s[id] && !!soft[id]);
    n.classList.toggle('is-active', id === act);
    n.setAttribute('aria-pressed', id === pin ? 'true' : 'false');
  });
  $$('.edge', map).forEach(function(e){
    var on = !!s && s[e.dataset.a] && s[e.dataset.b];
    e.classList.toggle('on', !!on);
    e.classList.toggle('off', !!s && !on);
  });
  var insp = $('#inspect');
  /* Only rewrite the inspector when its content changes. Rewriting on every hover/focus event
     replaced the link under the pointer between mousedown and mouseup, so clicks on it were lost. */
  if(insp){ var h = inspectHTML(act); if(insp.dataset.h !== h){ insp.innerHTML = h; insp.dataset.h = h; } }
}
function inspectIdle(){
  return '<div><span class="lbl">'+tr('insp.label')+'</span><h3>'+tr('insp.title')+'</h3></div>' +
    '<div><p>'+tr('insp.hint')+'</p>' +
    '<ul class="legend"><li><i class="lg h"></i>'+tr('legend.contains')+'</li><li><i class="lg d"></i>'+tr('legend.usedIn')+'</li></ul></div>' +
    '<div class="rel"><div><span class="lbl">'+tr('insp.glance')+'</span><p>'+tr('insp.counts',{p:dg(PROJ.length), c:dg(Object.keys(TECH).length), l:dg(activeLearn().length)})+'</p></div></div>';
}
function inspectHTML(id){
  if(!id) return inspectIdle();
  var kind, name, text, rel = '', nameAttr = '', textAttr = '';
  var noteChips = function(list, cap){
    return '<span class="chips">'+list.slice(0,cap).map(function(l){ return '<a class="chip" href="#lab/'+esc(l.id)+'"'+ca(l.t)+'>'+esc(l.t)+'</a>'; }).join('')+(list.length > cap ? '<a class="chip" href="#lab">'+esc(tr('more',{n:dg(list.length-cap)}))+'</a>' : '')+'</span>';
  };
  if(id.indexOf('dom:') === 0){
    var g = id.slice(4);
    if(!DOMAINS[g]) return inspectIdle();
    kind = tr('insp.kind.domain'); name = domName(g); text = domText(g);
    nameAttr = ca(name); textAttr = ca(text);
    rel = '<div><span class="lbl">'+tr('insp.components')+'</span>'+chips(techIds('g', g),true)+'</div>';
  } else if(id.indexOf('m:') === 0){
    var mid = id.slice(2), p = projById(mid);
    if(p){
      kind = tr('insp.kind.project',{s:pstat(p.status)}); name = p.name; text = p.desc;
      nameAttr = ca(name); textAttr = ca(text);
      rel = (p.uses.length ? '<div><span class="lbl">'+tr('insp.builtWith')+'</span>'+chips(p.uses,true)+'</div>' : '') + '<a class="open" href="#'+p.id+'">'+tr('insp.openCase')+'</a>';
    } else if(mid === 'learning'){
      kind = tr('insp.kind.module'); name = tr('insp.learningName'); text = tr('insp.learningText');
      rel = (LEARN_LINKS.length ? '<div><span class="lbl">'+tr('insp.touches')+'</span>'+chips(LEARN_LINKS,true)+'</div>' : '') +
        (LEARN.length ? '<div><span class="lbl">'+tr('insp.areas')+'</span><span class="chips">'+LEARN.slice(0,5).map(function(l){ return '<a class="chip" href="#learning" data-anchor="l-'+esc(l.id)+'"'+ca(l.n)+'>'+esc(l.n)+'</a>'; }).join('')+'</span></div>' : '') + '<a class="open" href="#learning">'+tr('insp.openLearning')+'</a>';
    } else if(mid === 'lab'){
      kind = tr('insp.kind.module'); name = tr('insp.labName'); text = tr('insp.labText');
      rel = (LAB_LINKS.length ? '<div><span class="lbl">'+tr('insp.touches')+'</span>'+chips(LAB_LINKS,true)+'</div>' : '') +
        (LAB.length ? '<div><span class="lbl">'+tr('insp.entries')+'</span>'+noteChips(LAB,5)+'</div>' : '') + '<a class="open" href="#lab">'+tr('insp.openLab')+'</a>';
    } else return inspectIdle();
  } else {
    var t = TECH[id]; if(!t) return inspectIdle();
    kind = tr('insp.kind.component',{d:domName(t.d).toLowerCase()}); name = t.n; text = t.r; textAttr = ca(text);
    var req = t.needs, by = Object.keys(TECH).filter(function(k){return TECH[k].needs.indexOf(id)>-1;});
    rel = '<div><span class="lbl">'+tr('insp.usedIn')+'</span><span class="chips">' +
      (usedIn(id).map(function(p){return '<button class="chip" data-pin="m:'+p.id+'">'+esc(p.name.toLowerCase())+'</button>';}).join('') +
      (LEARN_LINKS.indexOf(id)>-1?'<button class="chip" data-pin="m:learning">'+esc(tr('name.learning').toLowerCase())+'</button>':'') +
      (LAB_LINKS.indexOf(id)>-1?'<button class="chip" data-pin="m:lab">'+esc(tr('name.lab').toLowerCase())+'</button>':'') || '<span class="chip">'+tr('insp.nothing')+'</span>') + '</span></div>';
    if(req.length) rel += '<div><span class="lbl">'+tr('insp.requires')+'</span>'+chips(req,true)+'</div>';
    if(by.length) rel += '<div><span class="lbl">'+tr('insp.requiredBy')+'</span>'+chips(by,true)+'</div>';
    var ns = LAB.filter(function(l){ return l.tags.indexOf(id) > -1; });
    if(ns.length) rel += '<div><span class="lbl">'+tr('insp.notes')+'</span>'+noteChips(ns,4)+'</div>';
    rel += '<a class="open" href="#stack" data-focus="'+esc(id)+'">'+tr('insp.openStack')+'</a>';
  }
  var clr = pin ? '<button type="button" class="chip clr" data-clear>'+tr('insp.clear')+'</button>' : '';
  return '<div><span class="lbl">'+kind+'</span><h3'+nameAttr+'>'+esc(name)+'</h3>'+clr+'</div>'+(text?'<div><p'+textAttr+'>'+esc(text)+'</p></div>':'')+'<div class="rel">'+rel+'</div>';
}

/* ----- mobile tree ----- */
function mobileTree(){
  var item = function(key, name, meta, body){
    return '<li><button class="tbtn" aria-expanded="false" aria-controls="t-'+key+'"><span class="tn">'+name+'</span><span class="tm">'+meta+'</span><i class="chev"></i></button><div class="tbody" id="t-'+key+'"><div class="tin"><div>'+body+'</div></div></div></li>';
  };
  var about = (ABOUT.lede ? '<p'+ca(ABOUT.lede)+'>'+esc(ABOUT.lede)+'</p>' : '') + '<a class="open" href="#about">'+tr('open.about')+'</a>';
  var projects = FEATURED_PROJ.map(function(p){ return '<a class="row" href="#'+p.id+'">'+stat(p.status)+'<span><bdi'+ca(p.name)+'>'+esc(p.name)+'</bdi><br><small'+ca(p.lang)+'>'+esc(p.lang)+'</small></span><small>'+esc(pstat(p.status))+'</small></a>'; }).join('') + '<a class="open" href="#projects">'+tr('open.projects')+'</a>';
  var stack = '<dl>' + stackGroups().map(function(d){ return '<div><dt'+ca(domName(d))+'>'+esc(domName(d))+'</dt><dd>'+techIds('d', d).map(function(k){return '<a href="#stack" data-focus="'+esc(k)+'">'+esc(TECH[k].n)+'</a>';}).join(' · ')+'</dd></div>'; }).join('') + '</dl><a class="open" href="#stack">'+tr('open.stack')+'</a>';
  var learning = LEARN.map(function(l){ return '<a class="row" href="#learning" data-anchor="l-'+esc(l.id)+'">'+glyph(l.s)+'<span'+ca(l.n)+'>'+esc(l.n)+'</span><small>'+esc(lstate(l.s))+'</small></a>'; }).join('') + '<a class="open" href="#learning">'+tr('open.learning')+'</a>';
  var lab = LAB.map(function(l){ return '<a class="row p2" href="#lab/'+esc(l.id)+'"><span'+ca(l.t)+'>'+esc(l.t)+'</span><small>'+esc(labStatus(l.s))+'</small></a>'; }).join('') + '<a class="open" href="#lab">'+tr('open.lab')+'</a>';
  var ch = contactChannels();
  var contact = '<dl>' + ch.map(function(c){ return '<div><dt>'+esc(c[0])+'</dt><dd>'+ltr(c[2])+'</dd></div>'; }).join('') + '</dl><a class="open" href="#contact">'+tr('open.contact')+'</a>';
  return '<div class="mtree">' + rootBlock(false, true) +
    '<ul class="tree">' +
    item('about',tr('tree.about'),tr('tree.aboutMeta'),about) +
    item('projects',tr('tree.projects'),tr('tree.projectsMeta',{n:pad(FEATURED_PROJ.length)}),projects) +
    item('stack',tr('tree.stack'),tr('tree.stackMeta',{n:pad(Object.keys(TECH).length)}),stack) +
    item('learning',tr('tree.learning'),tr('tree.learningMeta',{n:dg(activeLearn().length)}),learning) +
    item('lab',tr('tree.lab'),tr('tree.labMeta',{n:dg(LAB.length)}),lab) +
    item('contact',tr('tree.contact'),tr('tree.contactMeta',{n:dg(ch.length)}),contact) +
    '</ul></div>';
}

/* ----- about ----- */
function aboutExtras(){
  var h = '';
  ABOUT.sections.forEach(function(x){
    h += '<div class="asec"><span class="lbl"'+ca(x.t)+'>'+esc(x.t)+'</span>'+x.p.map(function(t){ return '<p'+ca(t)+'>'+md(t)+'</p>'; }).join('')+'</div>';
  });
  var act = activeLearn();
  if(act.length) h += '<div class="asec"><span class="lbl">'+tr('about.progress',{n:pad(act.length)})+'</span><ul class="alist">'+act.map(function(l){
    return '<li><a href="#learning" data-anchor="l-'+esc(l.id)+'">'+glyph(l.s)+'<span'+ca(l.n)+'>'+esc(l.n)+'</span><small>'+esc(lstate(l.s))+'</small></a></li>';
  }).join('')+'</ul></div>';
  return h;
}
function viewAbout(){
  var builds = copyT('copy.about.builds'), uses = copyT('copy.about.uses'), focus = copyT('copy.hero.focus');
  var gl = [
    [tr('glance.WHO'), esc(tr('about.who')), '#about', tr('glance.about'), ''],
    [tr('glance.BUILDS'), esc(builds.t), '#projects', tr('glance.projects'), copyAttr(builds)],
    [tr('glance.USES'), esc(uses.t), '#stack', tr('glance.stack'), copyAttr(uses)],
    [tr('glance.PROJECTS'), esc(tr('about.projectsGlance',{n:dg(PROJ.length)})), '#projects', tr('glance.open'), ''],
    [tr('glance.CONTACT'), esc(tr('about.contactGlance')), '#contact', tr('glance.open'), '']
  ];
  var kv = [
    [tr('kv.ROLE'), esc(tr('role')), ''], [tr('kv.FOCUS'), esc(focus.t), copyAttr(focus)],
    [tr('kv.FRAMEWORKS'), 'Django · DRF · Laravel · Gin', ''], [tr('kv.LANGUAGES'), 'Python · PHP · Go · JavaScript', ''],
    [tr('kv.PLATFORM'), 'Linux', ''], [tr('kv.DATA'), 'PostgreSQL · MySQL · Redis', ''], [tr('kv.STATUS'), esc(CONFIG.availability), ca(CONFIG.availability)]
  ].filter(function(r){ return r[1]; });
  return '<section class="view">' + head('/maziyar/about', tr('about.title'), ABOUT.lede, langNotice([ABOUT.lede].concat(ABOUT.body))) +
    '<dl class="glance">'+gl.map(function(g){return '<div><dt>'+g[0]+'</dt><dd'+g[4]+'>'+g[1]+'</dd><a href="'+g[2]+'">'+g[3]+'</a></div>';}).join('')+'</dl>' +
    '<div class="twocol"><div>' +
    '<div class="prose">'+(ABOUT.body.length ? ABOUT.body.map(function(t){return '<p'+ca(t)+'>'+esc(t)+'</p>';}).join('') : empty(tr('about.empty')))+'</div>' +
    (ABOUT.principles.length ? '<div class="principles">'+ABOUT.principles.map(function(p){return '<div><b'+ca(p[0])+'>'+esc(p[0])+'</b><span'+ca(p[1])+'>'+esc(p[1])+'</span></div>';}).join('')+'</div>' : '') +
    aboutExtras() +
    '</div>' +
    '<dl class="kv">' + kv.map(function(r){return '<div><dt>'+r[0]+'</dt><dd'+r[2]+'>'+r[1]+'</dd></div>';}).join('') + '</dl></div></section>';
}

/* ----- projects ----- */
function viewProjects(){
  return '<section class="view">' + head('/maziyar/projects', tr('name.projects'), tr('projects.lede'), langNotice(PROJ.map(function(p){ return p.desc; }))) +
    '<div class="plist">' + (PROJ.length ? PROJ.map(function(p){
      var nm = esc(p.name);
      return '<article class="pmod"><div class="pmeta"><span class="path" dir="ltr">'+esc(p.id)+'/</span><span class="pstatus">'+stat(p.status)+' '+esc(tr('status.label',{s:pstat(p.status)}))+'</span></div>' +
        '<div class="pbody"><h2'+ca(p.name)+'>'+nm+'</h2>' +
        ((p.lang || p.kind) ? '<div class="sub">'+(p.lang?'<span'+ca(p.lang)+'>'+esc(p.lang)+'</span>':'')+(p.lang&&p.kind?'<i>/</i>':'')+(p.kind?'<span'+ca(p.kind)+'>'+esc(p.kind)+'</span>':'')+'</div>' : '') +
        (p.desc ? '<p'+ca(p.desc)+'>'+esc(p.desc)+'</p>' : '') +
        '<div class="acts">' + (p.arch.length ? '<a class="btn" href="#'+p.id+'" data-sec="architecture" aria-label="'+esc(tr('btn.architecture.for',{n:p.name}))+'">'+tr('btn.architecture')+'</a>' : '') +
        '<a class="btn" href="#'+p.id+'" aria-label="'+esc(tr('btn.details.for',{n:p.name}))+'">'+tr('btn.details')+'</a>' +
        (p.repo ? '<a class="btn ext" href="'+esc(p.repo)+'" target="_blank" rel="noopener" aria-label="'+esc(tr('btn.repo.for',{n:p.name})+' '+tr('ext.newtab'))+'">'+tr('btn.repo')+'</a>' : '') + '</div></div></article>';
    }).join('') : empty(tr('projects.empty'))) + '</div></section>';
}
var wantSec = null;
document.addEventListener('click', function(e){
  var a = e.target.closest('[data-sec]'); if(a) wantSec = a.dataset.sec;
});

/* ----- case study ----- */
var SECS = ['overview','problem','architecture','technologies','decisions','challenges','body','outcome','limitations','related','repository'];
/* problem / outcome / limitations render only when the data carries them; nothing is invented. */
function proseSec(id, list){
  return list.length ? '<section class="csec" id="'+id+'"><span class="lbl">'+tr('sec.'+id)+'</span>'+list.map(function(t){ return '<p'+ca(t)+'>'+md(t)+'</p>'; }).join('')+'</section>' : '';
}
function viewProject(p){
  var i = PROJ.indexOf(p), prev = PROJ[(i+PROJ.length-1)%PROJ.length], next = PROJ[(i+1)%PROJ.length];
  var techItems = p.uses.map(function(id){ return '<li><a href="#stack" data-focus="'+esc(id)+'">'+esc(TECH[id].n)+'</a><span'+ca(TECH[id].r)+'>'+esc(TECH[id].r)+'</span></li>'; }).concat(
    p.extras.map(function(x){ return '<li><b'+ca(x[0])+'>'+esc(x[0])+'</b><span'+ca(x[1])+'>'+esc(x[1])+'</span></li>'; }));
  var secs = {};
  if(p.overview.length) secs.overview = '<section class="csec" id="overview"><span class="lbl">'+tr('sec.overview')+'</span>'+p.overview.map(function(t){return '<p'+ca(t)+'>'+esc(t)+'</p>';}).join('')+'</section>';
  if(p.arch.length) secs.architecture = '<section class="csec" id="architecture"><span class="lbl">'+tr('sec.architecture')+'</span><div class="arch">' + p.arch.map(function(t){
    return '<div class="tier">'+(t.l?'<div class="tlabel"'+ca(t.l)+'>'+esc(t.l)+'</div>':'')+'<div class="tnodes">'+t.n.map(function(x){return '<div class="anode'+(x.side?' side':'')+'"><b'+ca(x.t)+'>'+esc(x.t)+'</b>'+(x.s?'<span'+ca(x.s)+'>'+esc(x.s)+'</span>':'')+'</div>';}).join('')+'</div></div>';
  }).join('') + '</div></section>';
  if(techItems.length) secs.technologies = '<section class="csec" id="technologies"><span class="lbl">'+tr('sec.technologies')+'</span><ul class="techlist">'+techItems.join('')+'</ul></section>';
  if(p.decisions.length) secs.decisions = '<section class="csec" id="decisions"><span class="lbl">'+tr('sec.decisions')+'</span><div class="adrs">' + p.decisions.map(function(d,k){
    return '<div class="adr"><span class="id" dir="ltr">ADR-'+(k < 9 ? '0' : '')+(k+1)+'</span><div><h3'+ca(d.t)+'>'+esc(d.t)+'</h3>'+(d.w?'<p'+ca(d.w)+'>'+esc(d.w)+'</p>':'')+(d.x?'<p class="tr"'+ca(d.x)+'>'+esc(tr('case.tradeoff'))+esc(d.x)+'</p>':'')+'</div></div>';
  }).join('') + '</div></section>';
  if(p.challenges.length) secs.challenges = '<section class="csec" id="challenges"><span class="lbl">'+tr('sec.challenges')+'</span><div class="chals">' + p.challenges.map(function(c){
    return '<div class="chal"><span class="id">'+tr('case.problem')+'</span><div><h3'+ca(c.p)+'>'+esc(c.p)+'</h3>'+(c.r?'<p'+ca(c.r)+'>'+esc(c.r)+'</p>':'')+'</div></div>';
  }).join('') + '</div></section>';
  if(p.repo) secs.repository = '<section class="csec" id="repository"><span class="lbl">'+tr('sec.repository')+'</span><div class="repo"><span dir="ltr">'+esc(host(p.repo))+'</span><button class="btn" data-copy="'+esc(p.repo)+'">'+tr('btn.copy')+'</button><a class="btn ext" href="'+esc(p.repo)+'" target="_blank" rel="noopener" aria-label="'+esc(tr('btn.open')+': '+host(p.repo)+' '+tr('ext.newtab'))+'">'+tr('btn.open')+'</a></div></section>';
  secs.problem = proseSec('problem', p.problem);
  secs.outcome = proseSec('outcome', p.outcome);
  if(p.body.length){
    var lf = longform(p.body);

    var bodyHtml = lf.html
      .replace(/id="h-(\d+)"/g, 'id="project-h-$1"')
      .replace(/(<section class="csec lf" id=")[^"]+(")/, '$1body$2');

    secs.body = bodyHtml;
  }
  if(p.limitations.length) secs.limitations = '<section class="csec" id="limitations"><span class="lbl">'+tr('sec.limitations')+'</span><ul class="lflist"'+ca(p.limitations.join(' '))+'>'+p.limitations.map(function(t){ return '<li'+ca(t)+'>'+md(t)+'</li>'; }).join('')+'</ul></section>';
  secs.related = relatedSec(relatedFor(p.uses, {project:p.id}));
  var avail = SECS.filter(function(id){ return secs[id]; });
  var metaBits = (p.lang?'<span'+ca(p.lang)+'>'+esc(p.lang)+'</span>':'') + (p.kind?'<span'+ca(p.kind)+'>'+esc(p.kind)+'</span>':'') + (p.updated?'<span class="upd">'+tr('updated',{d:ltr(p.updated)})+'</span>':'');
  var notice = langNotice([p.desc].concat(p.overview, p.problem, p.outcome, p.limitations, p.decisions.map(function(d){ return d.w; }), p.body.map(function(b){ return b.type === 'p' ? b.text : ''; })));
  return '<section class="view case"><a class="back" href="#projects">'+tr('case.back')+'</a>' +
    '<header class="chead"><p class="eyebrow">'+ltr('/maziyar/projects/'+p.id)+'</p><h1'+ca(p.name)+'>'+esc(p.name)+'</h1><div class="cmeta">'+metaBits+'<span class="pstatus">'+stat(p.status)+' '+esc(tr('status.label',{s:pstat(p.status)}))+'</span></div></header>' + notice +
    '<div class="cbody"><nav class="cidx" id="cidx" aria-label="'+esc(tr('case.sections.aria'))+'">'+avail.map(function(id){return '<button type="button" data-to="'+id+'">'+tr('cidx.'+id)+'</button>';}).join('')+'</nav>' +
    '<div class="csecs">' + (avail.length ? avail.map(function(id){ return secs[id]; }).join('') : (p.desc ? '<section class="csec"><p'+ca(p.desc)+'>'+esc(p.desc)+'</p></section>' : empty(tr('case.empty')))) +
    '</div></div>' +
    (PROJ.length > 1 ? '<nav class="pn" aria-label="'+esc(tr('pn.projects.aria'))+'"><a href="#'+prev.id+'">'+tr('pn.prev')+'<b'+ca(prev.name)+'>'+esc(prev.name)+'</b></a><a href="#'+next.id+'">'+tr('pn.next')+'<b'+ca(next.name)+'>'+esc(next.name)+'</b></a></nav>' : '') + '</section>';
}
function initToc(){
  var stage = $('#stage'), btns = $$('#cidx button');
  tocOn = true;
  var go = function(id){ var el = document.getElementById(id); if(el) el.scrollIntoView({behavior: reduce?'auto':'smooth', block:'start'}); };
  btns.forEach(function(b){ b.addEventListener('click', function(){ go(b.dataset.to); }); });
  var secs = $$('.csec[id]');
  if(btns.length && secs.length && window.IntersectionObserver){
    var io = new IntersectionObserver(function(es){
      if(atBottom()) return;   /* at the end the last item stays active */
      es.forEach(function(en){ if(en.isIntersecting){ btns.forEach(function(b){ var on = b.dataset.to === en.target.id; b.classList.toggle('on', on); if(on) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current'); }); } });
    }, {root: mq900.matches ? null : stage, rootMargin:'-10% 0px -70% 0px'});
    secs.forEach(function(s){ io.observe(s); });
  }
  if(btns[0]) btns[0].classList.add('on');
  if(wantSec){ var s = wantSec; wantSec = null; setTimeout(function(){ go(s); }, 60); }
}
/* back-to-top + "last section is active at the bottom" (short final sections never reach the observer band) */
var mq900 = window.matchMedia ? window.matchMedia('(max-width:900px)') : {matches:false};
function scrollPos(){
  var st = $('#stage'), mob = mq900.matches;
  return {y: mob ? (window.pageYOffset || document.documentElement.scrollTop || 0) : st.scrollTop,
          vh: mob ? window.innerHeight : st.clientHeight,
          h: mob ? document.documentElement.scrollHeight : st.scrollHeight};
}
function atBottom(){ var p = scrollPos(); return p.y > 0 && p.y + p.vh >= p.h - 4; }
function onScroll(){
  if(!tocOn) return;
  var tt = $('#totop'); if(tt) tt.hidden = scrollPos().y < 480;
  if(atBottom()){
    var btns = $$('#cidx button');
    btns.forEach(function(b, i){ b.classList.toggle('on', i === btns.length-1); });
  }
}
function toTop(){
  var st = $('#stage');
  if(mq900.matches) window.scrollTo({top:0, behavior: reduce?'auto':'smooth'});
  else if(st) st.scrollTo({top:0, behavior: reduce?'auto':'smooth'});
  var h = $('.chead h1'); if(h){ h.setAttribute('tabindex','-1'); h.focus({preventScroll:true}); }
}

/* ----- stack: short preview + "Read more" for long descriptions ----- */
var PREVIEW_SENTENCES = 2;   /* preview = first 2 sentences ... */
var PREVIEW_MAX = 160;       /* ... but never more than ~160 characters */
var PREVIEW_MIN_REST = 40;   /* hiding less than this is pointless: show everything */
/* Splits the ONE stored description into a visible head and a hidden rest. head + rest === the full text. */
function splitDesc(text){
  var full = str(text).trim();
  if(full.length <= PREVIEW_MAX) return {head:full, rest:'', ell:false};
  var re = /[.!?\u061F\u06D4\u2026]+["'\u201D\u2019)\]\u00BB]*(?=\s|$)/g;   /* . ! ? , Persian ؟ and ۔ , … */
  var end = 0, n = 0, m, cut = false;
  while(n < PREVIEW_SENTENCES && (m = re.exec(full))){
    var e = m.index + m[0].length;
    if(n > 0 && e > PREVIEW_MAX) break;      /* the 2nd sentence would make the preview too long */
    end = e; n++;
    if(e > PREVIEW_MAX) break;
  }
  if(!end) end = full.length;                /* no sentence ending found */
  if(end > PREVIEW_MAX){                     /* one very long sentence: cut at a word boundary */
    var sp = full.slice(0, PREVIEW_MAX).search(/\s\S*$/);
    end = sp > PREVIEW_MAX / 2 ? sp : PREVIEW_MAX;
    cut = true;
  }
  if(full.length - end < PREVIEW_MIN_REST) return {head:full, rest:'', ell:false};
  return {head:full.slice(0, end), rest:full.slice(end), ell:cut};
}
function techDesc(id, text){
  var d = splitDesc(text), did = 'sd-'+esc(id);
  if(!d.rest) return '<span class="role" dir="auto">'+esc(d.head)+'</span>';
  return '<span class="role" dir="auto"><span id="'+did+'">'+esc(d.head)+
    (d.ell ? '<span class="ell" aria-hidden="true">\u2026</span>' : '')+
    '<span class="more" hidden>'+esc(d.rest)+'</span></span>'+
    '<button type="button" class="more-btn" data-more aria-expanded="false" aria-controls="'+did+'">Read more</button></span>';
}

/* ----- stack ----- */
function viewStack(){
  var groups = stackGroups();   /* categories without components are not rendered */
  var sep = I18N.lang === 'fa' ? '، ' : ', ';
  var notice = langNotice(Object.keys(TECH).map(function(k){ return TECH[k].r; }).concat(groups.map(domText)));
  return '<section class="view">' + head('/maziyar/stack', tr('name.stack'), tr('stack.lede'), notice) +
    '<div class="sgrid" id="sgrid">' + (groups.length ? groups.map(function(d){
      var ids = techIds('d', d);
      return '<section class="sdom"><h2'+ca(domName(d))+'>'+esc(domName(d))+'<small>'+pad(ids.length)+'</small></h2>'+(domText(d)?'<p class="sdesc"'+ca(domText(d))+'>'+esc(domText(d))+'</p>':'') +
        ids.map(function(id){
          var t = TECH[id], u = usedIn(id);
          var by = Object.keys(TECH).filter(function(k){ return TECH[k].needs.indexOf(id) > -1; });
          var ns = LAB.filter(function(l){ return l.tags.indexOf(id) > -1; });
          var ls = LEARN.filter(function(l){ return l.t.indexOf(id) > -1; });
          var jump = function(k){ return '<a href="#stack" data-rowjump="'+esc(k)+'" dir="auto">'+esc(TECH[k].n.toLowerCase())+'</a>'; };
          var dep = '';
          if(t.needs.length) dep += '<span>'+tr('dep.requires')+' '+t.needs.map(jump).join(sep)+'</span>';
          if(by.length) dep += '<span>'+tr('dep.requiredBy')+' '+by.map(jump).join(sep)+'</span>';
          if(u.length) dep += '<span>'+tr('dep.usedIn')+' '+u.map(function(p){return '<a href="#'+esc(p.id)+'" dir="ltr">'+esc(p.id)+'</a>';}).join(' ')+'</span>';
          if(ns.length) dep += '<span>'+tr('dep.notes')+' '+ns.slice(0,3).map(function(l){ return '<a href="#lab/'+esc(l.id)+'" dir="ltr">'+esc(l.id)+'</a>'; }).join(' ')+(ns.length > 3 ? ' <a href="#lab">+'+dg(ns.length-3)+'</a>' : '')+'</span>';
          if(ls.length) dep += '<span>'+tr('dep.learning')+' '+ls.map(function(l){ return '<a href="#learning" data-anchor="l-'+esc(l.id)+'"'+ca(l.n)+'>'+esc(l.n.toLowerCase())+'</a>'; }).join(' ')+'</span>';
          if(!dep) dep = '<span>'+tr('dep.none')+'</span>';
          return '<div class="srow" id="s-'+id+'" data-id="'+id+'"><div class="hd"><b>'+esc(t.n)+'</b></div>'+techDesc(id, t.r)+'<div class="dep">'+dep+'</div></div>';
        }).join('') + '</section>';
    }).join('') : empty(tr('stack.empty'))) + '</div></section>';
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
  var reveal = function(id){
    var row = document.getElementById('s-'+id); if(!row) return;
    row.scrollIntoView({behavior: reduce?'auto':'smooth', block:'center'});
    focusRow(row);
    setTimeout(clear, 2600);
  };
  grid.addEventListener('mouseover', function(e){ var row = e.target.closest('.srow'); if(row) focusRow(row); });
  grid.addEventListener('mouseleave', clear);
  /* keyboard focus traces dependencies the same way hover does */
  grid.addEventListener('focusin', function(e){ var row = e.target.closest('.srow'); if(row) focusRow(row); });
  grid.addEventListener('focusout', function(e){ if(!e.relatedTarget || !grid.contains(e.relatedTarget)) clear(); });
  /* requires / required by: jump to that row without leaving the page */
    /* Read more / Show less: purely local, in-place toggle (no re-render, no navigation) */
  grid.addEventListener('click', function(e){
    var b = e.target.closest('[data-more]'); if(!b) return;
    var box = document.getElementById(b.getAttribute('aria-controls')); if(!box) return;
    var open = b.getAttribute('aria-expanded') !== 'true';
    var more = box.querySelector('.more'), ell = box.querySelector('.ell');
    if(more) more.hidden = !open;
    if(ell) ell.hidden = open;
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.textContent = open ? 'Show less' : 'Read more';
  });
  grid.addEventListener('click', function(e){ var j = e.target.closest('[data-rowjump]'); if(j){ e.preventDefault(); reveal(j.dataset.rowjump); } });
  /* arriving from a technology link (case study, note, learning, palette) highlights that row */
  if(wantFocus){
    var id = wantFocus; wantFocus = null;
    setTimeout(function(){ reveal(id); }, 80);
  }
}

/* ----- learning ----- */
function viewLearning(){
  var row = function(l){
    var rel = relatedFor(l.t, {learn:l.id});
    var work = rel.projects.slice(0,3).map(function(r){ return '<a href="#'+esc(r.x.id)+'"'+ca(r.x.name)+'>'+esc(r.x.name.toLowerCase())+'</a>'; })
      .concat(rel.notes.slice(0,3).map(function(r){ return '<a href="#lab/'+esc(r.x.id)+'" dir="ltr">'+esc(r.x.id)+'</a>'; }));
    return '<div class="lrow '+l.s+'" id="l-'+esc(l.id)+'">'+glyph(l.s)+'<span class="ln"'+ca(l.n)+'>'+esc(l.n)+'</span><span class="ls">'+esc(up(lstate(l.s)))+'</span><div>'+
      (l.note?'<p'+ca(l.note)+'>'+esc(l.note)+'</p>':'')+(l.t.length?techLinks(l.t):'')+
      (work.length ? '<p class="lwork"><span class="lbl">'+tr('learning.related')+'</span>'+work.join(' ')+'</p>' : '')+
      (l.updated ? '<p class="upd">'+tr('updated',{d:ltr(l.updated)})+'</p>' : '')+'</div></div>';
  };
  var act = activeLearn(), q = LEARN.filter(function(l){return l.s==='queued';});
  var group = function(label, list){
    return list.length ? '<div class="lgroup"><span class="lbl">'+label+sepN()+pad(list.length)+'</span>'+list.map(row).join('')+'</div>' : '';
  };
  return '<section class="view">' + head('/maziyar/learning', tr('name.learning'), tr('learning.lede'), langNotice(LEARN.map(function(l){ return l.note; }))) +
    '<div class="states">'+Object.keys(STATE_DEF).map(function(s){return '<div>'+glyph(s)+'<b>'+esc(up(lstate(s)))+'</b><small'+ca(STATE_DEF[s])+'>'+esc(STATE_DEF[s])+'</small></div>';}).join('')+'</div>' +
    (LEARN.length ? group(tr('learning.running'), act) + group(tr('learning.queued'), q) : '<div class="lgroup">'+empty(tr('learning.empty'))+'</div>') + '</section>';
}

/* ----- lab / engineering notes ----- */
function labGlyph(s){ return s === 'queued' ? 'queued' : (s === 'published' ? 'studying' : 'developing'); }
var small = function(svg){ return svg.replace('width="20" height="20"','width="14" height="14"'); };
var labFilter = {kind:'', status:'', tech:'', q:''};
function labList(){
  var q = I18N.norm(labFilter.q).trim().split(/\s+/).filter(Boolean);
  return LAB.filter(function(l){
    if(labFilter.kind && l.kind.toLowerCase() !== labFilter.kind) return false;
    if(labFilter.status && l.s !== labFilter.status) return false;
    if(labFilter.tech && l.tags.indexOf(labFilter.tech) < 0) return false;
    if(q.length){
      var hay = I18N.norm(l.t+' '+l.d+' '+l.tags.map(techName).join(' '));
      if(q.some(function(w){ return hay.indexOf(w) < 0; })) return false;
    }
    return true;
  });
}
function labEntryHTML(l){
  var href = '#lab/'+esc(l.id);
  return '<article class="entry '+(l.s==='queued'?'queued':'')+'"><div><div class="fn"><a href="'+href+'" dir="ltr">'+esc(l.id)+'/</a></div>'+(l.kind?'<div class="kind">'+esc(up(labKind(l.kind)))+'</div>':'')+'</div>' +
    '<div><h3><a href="'+href+'"'+ca(l.t)+'>'+esc(l.t)+'</a></h3>'+(l.d?'<p'+ca(l.d)+'>'+esc(l.d)+'</p>':'')+(l.tags.length?techLinks(l.tags):'')+(l.updated?'<p class="upd">'+tr('updated',{d:ltr(l.updated)})+'</p>':'')+'</div>' +
    '<div class="est">'+small(glyph(labGlyph(l.s)))+esc(labStatus(l.s))+'</div></article>';
}
function labItemsHTML(){
  var list = labList(), any = labFilter.kind || labFilter.status || labFilter.tech || labFilter.q.trim();
  var h = '';
  if(!LAB.length) h += '<p class="empty-note lempty">'+tr('lab.empty')+'</p>';
  else if(!list.length) h += '<p class="empty-note lempty">'+tr('lab.noMatch')+' <button type="button" class="lnk" data-lclear>'+tr('lab.clear')+'</button></p>';
  else h += list.map(labEntryHTML).join('');
  if(!any) h += '<article class="entry reserved"><div><div class="fn" dir="ltr">next-entry/</div><div class="kind">'+esc(up(tr('lab.reserved')))+'</div></div><div><h3>'+tr('lab.next')+'</h3><p>'+tr('lab.nextText')+'</p></div><div class="est"></div></article>';
  return h;
}
function labCount(){ return tr('lab.count',{a:dg(labList().length), b:dg(LAB.length)}); }
function labFilterHTML(){
  var chipGroup = function(key, label, vals, fmt){
    return '<div class="fgroup" role="group" aria-label="'+esc(label)+'"><span class="lbl">'+esc(label)+'</span><span class="fchips">' +
      [''].concat(vals).map(function(v){ return '<button type="button" class="fchip" data-fk="'+key+'" data-fv="'+esc(v)+'" aria-pressed="'+(labFilter[key]===v?'true':'false')+'">'+esc(v ? fmt(v) : tr('lab.all'))+'</button>'; }).join('') + '</span></div>';
  };
  var kinds = uniq(LAB.map(function(l){ return l.kind.toLowerCase(); }).filter(Boolean));
  var sts = ['in progress','queued','published'].filter(function(s){ return LAB.some(function(l){ return l.s === s; }); });
  var techs = uniq([].concat.apply([], LAB.map(function(l){ return l.tags; }))).sort(function(a, b){ return techName(a).localeCompare(techName(b), I18N.lang); });
  return '<div class="lfilter">' +
    '<div class="fgroup"><label class="lbl" for="labq">'+tr('lab.search')+'</label><input id="labq" type="search" dir="auto" placeholder="'+esc(tr('lab.ph'))+'" autocomplete="off" value="'+esc(labFilter.q)+'"></div>' +
    (kinds.length > 1 ? chipGroup('kind',tr('lab.kind'),kinds,labKind) : '') +
    (sts.length > 1 ? chipGroup('status',tr('lab.status'),sts,labStatus) : '') +
    (techs.length ? '<div class="fgroup"><label class="lbl" for="labt">'+tr('lab.tech')+'</label><select id="labt"><option value="">'+tr('lab.all')+'</option>'+techs.map(function(t){ return '<option value="'+esc(t)+'"'+(labFilter.tech===t?' selected':'')+'>'+esc(techName(t))+'</option>'; }).join('')+'</select></div>' : '') +
    '<p class="lcount" id="lcount" role="status" aria-live="polite">'+labCount()+'</p></div>';
}
function viewLab(){
  var n = function(s){ return LAB.filter(function(l){return l.s===s;}).length; };
  return '<section class="view" id="labview">' + head('/maziyar/lab', tr('name.lab'), tr('lab.lede'), langNotice(LAB.map(function(l){ return l.d || l.t; }))) +
    '<div class="labnote"><span>'+esc(labStatus('in progress'))+' <b>'+pad(n('in progress'))+'</b></span><span>'+esc(labStatus('queued'))+' <b>'+pad(n('queued'))+'</b></span><span>'+esc(labStatus('published'))+' <b>'+pad(n('published'))+'</b></span></div>' +
    (LAB.length ? labFilterHTML() : '') +
    '<div class="lablist" id="lablist">' + labItemsHTML() + '</div></section>';
}
function initLab(){
  var root = $('#labview'); if(!root) return;
  var refresh = function(){
    $('#lablist').innerHTML = labItemsHTML();
    var c = $('#lcount'); if(c) c.textContent = labCount();
    $$('.fchip', root).forEach(function(b){ b.setAttribute('aria-pressed', labFilter[b.dataset.fk] === b.dataset.fv ? 'true' : 'false'); });
    var q = $('#labq'); if(q && q.value !== labFilter.q) q.value = labFilter.q;
    var t = $('#labt'); if(t && t.value !== labFilter.tech) t.value = labFilter.tech;
  };
  root.addEventListener('click', function(e){
    var b = e.target.closest('.fchip');
    if(b){ labFilter[b.dataset.fk] = b.dataset.fv; refresh(); return; }
    if(e.target.closest('[data-lclear]')){ labFilter = {kind:'', status:'', tech:'', q:''}; refresh(); var q = $('#labq'); if(q) q.focus(); }
  });
  var q = $('#labq'); if(q) q.addEventListener('input', function(){ labFilter.q = q.value; refresh(); });
  var t = $('#labt'); if(t) t.addEventListener('change', function(){ labFilter.tech = t.value; refresh(); });
}

/* ----- note detail (editorial layout) ----- */
function figure(b){
  var label = b.caption || tr('fig.'+b.type);
  return '<figure class="fig '+b.type+'"'+(b.type === 'diagram' ? ' role="img" aria-label="'+esc(tr('fig.diagram.aria',{l:label}))+'"' : '')+'><figcaption'+ca(label)+'>'+esc(label)+'</figcaption><pre dir="ltr" tabindex="0"><code>'+esc(b.text)+'</code></pre></figure>';
}
function longform(list){
  var toc = [], html = '', open = false, k = 0;
  var close = function(){ if(open){ html += '</section>'; open = false; } };
  var begin = function(id, title){ close(); html += '<section class="csec lf" id="'+id+'">'+(title ? '<h2 class="lfh"'+ca(title)+'>'+md(title)+'</h2>' : '<span class="lbl">'+tr('lab.writeup')+'</span>'); open = true; };
  list.forEach(function(b){
    if(b.type === 'h'){ k++; begin('h-'+k, b.text); toc.push(['h-'+k, b.text.length > 34 ? b.text.slice(0,33)+'…' : b.text]); return; }
    if(!open) begin('writeup', '');
    if(b.type === 'p') html += '<p'+ca(b.text)+'>'+md(b.text)+'</p>';
    else if(b.type === 'list') html += '<ul class="lflist"'+ca(b.items.join(' '))+'>'+b.items.map(function(x){ return '<li>'+md(x)+'</li>'; }).join('')+'</ul>';
    else html += figure(b);
  });
  close();
  return {html:html, toc:toc};
}
function viewNote(n){
  var i = LAB.indexOf(n), prev = LAB[(i+LAB.length-1)%LAB.length], next = LAB[(i+1)%LAB.length];
  var toc = [], secs = '';
  if(n.d){ toc.push(['summary',tr('lab.summary')]); secs += '<section class="csec" id="summary"><span class="lbl">'+tr('lab.summary')+'</span><p'+ca(n.d)+'>'+md(n.d)+'</p></section>'; }
  if(n.body.length){ var lf = longform(n.body); secs += lf.html; toc = toc.concat(lf.toc); }
  else secs += '<section class="csec" id="writeup"><span class="lbl">'+tr('lab.writeup')+'</span><p class="faint-p">'+tr('lab.nowriteup')+'</p></section>';
  if(n.tags.length){ toc.push(['technologies',tr('lab.technologies')]); secs += '<section class="csec" id="technologies"><span class="lbl">'+tr('lab.technologies')+'</span>'+techListHTML(n.tags)+'</section>'; }
  var rel = relatedSec(relatedFor(n.tags, {note:n.id}));
  if(rel){ toc.push(['related',tr('lab.related')]); secs += rel; }
  var useToc = toc.length >= 3;
  var notice = langNotice([n.d, n.t].concat(n.body.map(function(b){ return b.type === 'p' || b.type === 'h' ? b.text : (b.type === 'list' ? b.items.join(' ') : ''); })));
  return '<section class="view case note"><a class="back" href="#lab">'+tr('lab.back')+'</a>' +
    '<header class="chead"><p class="eyebrow">'+ltr('/maziyar/lab/'+n.id)+'</p><h1'+ca(n.t)+'>'+esc(n.t)+'</h1><div class="cmeta">'+(n.kind?'<span>'+esc(up(labKind(n.kind)))+'</span>':'')+
    '<span class="pstatus">'+small(glyph(labGlyph(n.s)))+' '+esc(tr('status.label',{s:labStatus(n.s)}))+'</span>'+(n.updated?'<span class="upd">'+tr('updated',{d:ltr(n.updated)})+'</span>':'')+'</div></header>' + notice +
    '<div class="cbody'+(useToc?'':' solo')+'">' + (useToc ? '<nav class="cidx" id="cidx" aria-label="'+esc(tr('sections.aria'))+'">'+toc.map(function(t){ return '<button type="button" data-to="'+esc(t[0])+'">'+esc(t[1])+'</button>'; }).join('')+'</nav>' : '') +
    '<div class="csecs">'+secs+'</div></div>' +
    (LAB.length > 1 ? '<nav class="pn" aria-label="'+esc(tr('pn.notes.aria'))+'"><a href="#lab/'+esc(prev.id)+'">'+tr('pn.prev')+'<b'+ca(prev.t)+'>'+esc(prev.t)+'</b></a><a href="#lab/'+esc(next.id)+'">'+tr('pn.next')+'<b'+ca(next.t)+'>'+esc(next.t)+'</b></a></nav>' : '') + '</section>';
}

/* ----- contact ----- */
function viewContact(){
  var ch = contactChannels();
  var words = ['', tr('contact.n1'), tr('contact.n2'), tr('contact.n3')];
  return '<section class="view">' + head('/maziyar/contact', tr('contact.title'), ch.length ? words[ch.length]+(CONFIG.email?tr('contact.fastest'):'') : '') +
    '<div class="eps">' + (ch.length ? ch.map(function(c){
      return '<div class="ep"><div><h2>'+esc(c[0])+'</h2><div class="chan">'+esc(up(c[1]))+'</div></div><div class="addr" dir="ltr">'+esc(c[2])+'</div><div class="acts">' +
        (c[4] ? '<button class="btn" data-copy="'+esc(c[2])+'">'+tr('btn.copy')+'</button><a class="btn" href="mailto:'+esc(c[2])+'">'+tr('btn.compose')+'</a>' : '<a class="btn ext" href="'+esc(c[3])+'" target="_blank" rel="noopener" aria-label="'+esc(tr('btn.open')+': '+c[0]+' '+tr('ext.newtab'))+'">'+tr('btn.open')+'</a>') + '</div></div>';
    }).join('') : empty(tr('contact.empty'))) + '</div>' +
    (CONFIG.availability ? '<p class="reach"><i class="dot"></i><span'+ca(CONFIG.availability)+'>'+esc(CONFIG.availability)+'</span></p>' : '') + '</section>';
}

/* ============ GLOBAL EVENTS ============ */
document.addEventListener('click', function(e){
  var c = e.target.closest('[data-copy]');
  if(c){
    var txt = c.dataset.copy, orig = c.textContent;
    var done = function(){ c.textContent = tr('btn.copied'); setTimeout(function(){ c.textContent = orig; }, 1600); };
    var fallback = function(){
      var ta = document.createElement('textarea'); ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); done(); }catch(err){ c.textContent = tr('btn.select'); }
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
  /* links that land on a specific learning row etc. */
  var an = e.target.closest('[data-anchor]');
  if(an){
    wantAnchor = an.dataset.anchor;
    if(location.hash === an.getAttribute('href')){ e.preventDefault(); settleAnchor(); }
  }
  /* case-study technology link to stack row */
  var f = e.target.closest('[data-focus]');
  if(f){
    wantFocus = f.dataset.focus;
    if(location.hash === f.getAttribute('href')){ e.preventDefault(); render(); }
  }
});

/* Esc clears a pinned graph node (palette handles its own Esc) */
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && pin && $('#map') && !(pal.el && pal.el.open)){ pin = null; hover = null; paint(); }
});

/* keys 0 to 6 jump to rail entries (the rail advertises "keys 0 to 6") */
document.addEventListener('keydown', function(e){
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  if(pal.el && pal.el.open) return;   /* the open palette owns the keyboard: digits must not navigate the page behind it */
  var t = e.target;
  if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  var dk = I18N.norm(e.key);   /* ۰-۶ on a Persian keyboard layout count as 0-6 */
  if(/^[0-6]$/.test(dk)){ location.hash = '#' + NAV[+dk][0]; }
});

/* the CURRENTLY word cycles through active learning areas */
function startCurrentlyRotation(){
  if(reduce) return;
  var wordsNow = function(){ return [tr('word.learning')].concat(activeLearn().map(function(l){ return l.n.toLowerCase(); })); };
  if(wordsNow().length < 2) return;
  var i = 0;
  setInterval(function(){
    var words = wordsNow();
    i = (i + 1) % words.length;
    var els = $$('.cur');
    els.forEach(function(el){ el.classList.add('swap'); });
    setTimeout(function(){
      curWord = words[i];
      $$('.cur').forEach(function(el){ el.textContent = curWord; el.classList.remove('swap'); });
    }, 360);
  }, 3600);
}

/* ============ COMMAND PALETTE (Jump to) ============
   Adapted from versions: "develper workspace/maziyar Heydari, Developer Workspace.html"
   (command bar: CSS .cmd*, markup #cmd, JS commands()/renderCmd()/runCmd()).
   Differences: native <dialog> (focus trap, inert page, Esc), flat ranked results across pages,
   projects, notes, technologies and learning, escaped output, IME-safe Enter, touch layout. */
var pal = {el:null, input:null, list:null, live:null, items:[], all:[], sel:0, ret:null};
var PAL_GROUP = ['Pages','Projects','Notes','Technologies','Learning'];
function palItems(){
  var out = [];
  NAV.forEach(function(n){ out.push({g:'Pages', t:n[0] === 'home' ? tr('name.home') : tr('name.'+n[0]), h:n[0] === 'home' ? '/' : n[1], k:n[0]+' '+(n[0] === 'home' ? 'home' : ''), hash:'#'+n[0]}); });
  PROJ.forEach(function(p){ out.push({g:'Projects', t:p.name, h:p.lang || p.kind, k:[p.kind, p.desc, p.uses.map(techName).join(' ')].join(' '), hash:'#'+p.id}); });
  LAB.forEach(function(l){ out.push({g:'Notes', t:l.t, h:[labKind(l.kind), labStatus(l.s)].filter(Boolean).join(' · '), k:[l.d, l.kind, l.s, l.tags.map(techName).join(' ')].join(' '), hash:'#lab/'+l.id}); });
  Object.keys(TECH).forEach(function(id){ var t = TECH[id]; out.push({g:'Technologies', t:t.n, h:domName(t.d).toLowerCase(), k:t.r, hash:'#stack', focus:id}); });
  LEARN.forEach(function(l){ out.push({g:'Learning', t:l.n, h:lstate(l.s), k:[l.note, l.s, l.t.map(techName).join(' ')].join(' '), hash:'#learning', anchor:'l-'+l.id}); });
  return out;
}
function palFilter(q){
  var words = I18N.norm(q).split(/\s+/).filter(Boolean);   /* one spelling per Persian/Arabic letter, no ZWNJ, Persian digits as Latin */
  var res = pal.all.map(function(it, idx){
    var t = I18N.norm(it.t), h = I18N.norm(it.h), hay = t+' '+h+' '+I18N.norm(it.k), s = 0;
    for(var i = 0; i < words.length; i++){
      var w = words[i]; if(hay.indexOf(w) < 0) return null;
      s += t.indexOf(w) === 0 ? 4 : (t.indexOf(w) > -1 ? 3 : (h.indexOf(w) > -1 ? 2 : 1));
    }
    return {it:it, s:s, i:idx};
  }).filter(Boolean);
  if(words.length) res.sort(function(a, b){ return (b.s - a.s) || (PAL_GROUP.indexOf(a.it.g) - PAL_GROUP.indexOf(b.it.g)) || (a.i - b.i); });
  return res.slice(0, words.length ? 40 : 30).map(function(r){ return r.it; });
}
function palSelect(i, scroll){
  var opts = $$('li[role="option"]', pal.list); if(!opts.length) return;
  pal.sel = Math.max(0, Math.min(i, opts.length-1));
  opts.forEach(function(li, k){ li.setAttribute('aria-selected', k === pal.sel ? 'true' : 'false'); });
  pal.input.setAttribute('aria-activedescendant', opts[pal.sel].id);
  if(scroll) palReveal(opts[pal.sel]);
}
/* keep the selected result visible by scrolling only the results list, never the page behind the dialog */
function palReveal(li){
  var l = pal.list, lr = l.getBoundingClientRect(), ir = li.getBoundingClientRect();
  if(ir.top < lr.top) l.scrollTop -= lr.top - ir.top;
  else if(ir.bottom > lr.bottom) l.scrollTop += ir.bottom - lr.bottom;
}

function renderPal(){
  var q = pal.input.value.trim();
  pal.items = palFilter(q);
  pal.list.innerHTML = pal.items.length ? pal.items.map(function(it, i){
    return '<li role="option" id="po'+i+'" data-i="'+i+'" aria-selected="false"><span class="pt"'+ca(it.t)+'>'+esc(it.t)+'</span><span class="pg">'+esc(tr('pal.type.'+it.g))+'</span><span class="ph"'+ca(it.h)+'>'+esc(it.h)+'</span></li>';
  }).join('') : '<li class="pal-empty" role="presentation">'+tr('pal.empty',{q:esc(q)})+'</li>';
  pal.input.setAttribute('aria-expanded', pal.items.length ? 'true' : 'false');
  pal.input.removeAttribute('aria-activedescendant');
  if(pal.items.length) palSelect(0, false);
  if(pal.live) pal.live.textContent = pal.items.length ? tr('pal.n',{n:dg(pal.items.length)}) : tr('pal.none');
}
function openPal(){
  if(!pal.el || pal.el.open) return;
  pal.ret = document.activeElement;
  pal.all = palItems(); pal.input.value = ''; renderPal();
  if(pal.el.showModal) pal.el.showModal(); else pal.el.setAttribute('open','');
  pal.input.focus({preventScroll:true});
}
function closePal(){
  if(!pal.el || !pal.el.open) return;
  if(pal.el.close) pal.el.close(); else { pal.el.removeAttribute('open'); palRestore(); }
}
function palRestore(){ var r = pal.ret; pal.ret = null; if(r && r.focus && document.contains(r)) r.focus({preventScroll:true}); }
function runPal(i){
  var it = pal.items[i]; if(!it) return;
  pal.ret = null;                 /* the destination view takes focus instead */
  closePal();
  go(it.hash, {focus:it.focus, anchor:it.anchor});
}
function initPalette(){
  pal.el = $('#palette'); if(!pal.el) return;
  pal.input = $('#palIn'); pal.list = $('#palList'); pal.live = $('#palLive');
  var key = $('#jumpKey');
  if(key) key.textContent = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '') ? '⌘K' : 'Ctrl K';
  var btn = $('#jump'); if(btn) btn.addEventListener('click', openPal);
  var x = $('#palX'); if(x) x.addEventListener('click', closePal);
  pal.el.addEventListener('close', palRestore);
  pal.el.addEventListener('click', function(e){ if(e.target === pal.el) closePal(); });   /* backdrop */
  pal.input.addEventListener('input', renderPal);
  pal.input.addEventListener('keydown', function(e){
    if(e.isComposing) return;     /* IME composition (Persian, CJK): Enter confirms text, not a result */
    if(e.key === 'ArrowDown'){ e.preventDefault(); palSelect((pal.sel + 1) % Math.max(pal.items.length, 1), true); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); palSelect((pal.sel - 1 + pal.items.length) % Math.max(pal.items.length, 1), true); }
    else if(e.key === 'Home' && e.ctrlKey){ e.preventDefault(); palSelect(0, true); }
    else if(e.key === 'End' && e.ctrlKey){ e.preventDefault(); palSelect(pal.items.length-1, true); }
    else if(e.key === 'Enter'){ e.preventDefault(); runPal(pal.sel); }
    else if(e.key === 'Escape'){ e.preventDefault(); closePal(); }
    else if(e.key === 'Tab'){ e.preventDefault(); }     /* the input is the only stop inside the dialog */
  });
  pal.list.addEventListener('click', function(e){ var li = e.target.closest('li[data-i]'); if(li) runPal(+li.dataset.i); });
  pal.list.addEventListener('mousemove', function(e){ var li = e.target.closest('li[data-i]'); if(li && +li.dataset.i !== pal.sel) palSelect(+li.dataset.i, false); });
  document.addEventListener('keydown', function(e){
    /* e.code keeps Ctrl/⌘+K working on a Persian keyboard layout, where e.key is a Persian letter */
    if((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && ((e.key || '').toLowerCase() === 'k' || e.code === 'KeyK')){
      e.preventDefault();
      if(pal.el.open) closePal(); else openPal();
    }
  });
}

/* ============ LANGUAGE SWITCH ============ */
function setAvail(){
  var a = $('#avail'); if(!a) return;
  a.textContent = CONFIG.availability;
  var l = I18N.detect(CONFIG.availability);
  if(l && l !== I18N.lang){ a.setAttribute('lang', l); a.setAttribute('dir', I18N.DIRS[l]); } else { a.removeAttribute('lang'); a.removeAttribute('dir'); }
}
/* Fired by i18n.js after <html lang dir> and the static labels were already updated. Everything built from
   data is rebuilt in the new language; the page, scroll position, pinned graph node and lab filters stay. */
function onLangChange(){
  var snap = viewSnap();
  carryPin = pin;
  applyLocale(I18N.lang);
  buildNav(); buildRail();
  curWord = tr('word.learning');
  setAvail();
  render({keep:snap});
  carryPin = null;
  var live = $('#langLive'); if(live) live.textContent = tr('lang.live');
  if(pal.el && pal.el.open){ pal.all = palItems(); renderPal(); }
}
function initLang(){
  I18N.apply();
  var box = $('#lang');
  if(box) box.addEventListener('click', function(e){
    var b = e.target.closest('[data-lang-btn]'); if(b) I18N.set(b.getAttribute('data-lang-btn'));
  });
  I18N.onChange(onLangChange);
}

/* ============ BOOT ============ */
initLang();
buildNav();
buildRail();
setAvail();
render();
initPalette();
(function(){
  var st = $('#stage'); if(st) st.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('scroll', onScroll, {passive:true});
  var tt = $('#totop'); if(tt) tt.addEventListener('click', toTop);
})();
startCurrentlyRotation();

})();