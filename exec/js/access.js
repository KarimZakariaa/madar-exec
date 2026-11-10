'use strict';
(()=>{
const MK='مكة المكرمة',MD='المدينة المنورة',NATS=['مصر','عُمان','نيجيريا','بنغلاديش','غينيا','الاتحاد الأوروبي'],ALLN=['عُمان','بنغلاديش','نيجيريا','غينيا','الاتحاد الأوروبي','مصر'];
const SCOPES={all:{n:'الإدارة العامة (مكة والمدينة)',c:[MK,MD]},mecca:{n:'إدارة مكة المكرمة',c:[MK]},madinah:{n:'إدارة المدينة المنورة',c:[MD]}};
const st={scope:'all',role:'mgr',nation:'مصر'};
try{Object.assign(st,JSON.parse(localStorage.getItem('madarExecAccess')||'{}'))}catch(e){}
if(!SCOPES[st.scope])st.scope='all';if(st.role!=='org')st.role='mgr';if(!NATS.includes(st.nation))st.nation=NATS[0];
const save=()=>{try{localStorage.setItem('madarExecAccess',JSON.stringify(st))}catch(e){}};
const isOrg=()=>st.role==='org',cities=()=>SCOPES[st.scope].c;
const centerCity=(id,onlyMk)=>onlyMk||id<=4?MK:MD;
const NO_NATION=['users','kpis','jamarat-bridge'],MK_ONLY=['jamarat-bridge','holy-sites-transport'];
const KIT=['labor','gifts','tawaf','service-proof','incidents','pilgrim-movement','holy-sites-transport','jamarat-bridge','kpis','users'];
const A=window.Access={st,cities,isOrg,SCOPES,NATS,
nation:()=>isOrg()?st.nation:null,
recOk:r=>cities().includes(r.city)&&(!isOrg()||r.nation===st.nation),
moduleHidden:id=>st.scope==='madinah'&&MK_ONLY.includes(id),
apply(cfg){const id=cfg.id,onlyMk=MK_ONLY.includes(id),useNat=isOrg()&&!NO_NATION.includes(id),cs=cities();
cfg.rows.forEach((r,i)=>{if(r.nation===undefined&&!NO_NATION.includes(id))r.nation=ALLN[(i*3+Math.floor(i/5))%6]});
const rows=cfg.rows.filter(r=>{const c=r.city||(r.center>0?centerCity(r.center,onlyMk):null);return(!c||cs.includes(c))&&(!useNat||r.nation===st.nation)});
const sf=cfg.scopeFilters.map(f=>({...f,options:f.options.filter(o=>rows.some(r=>{try{return f.test(r,o.v)}catch(e){return true}}))})).filter(f=>!((f.key==='city'||f.key==='nation')&&f.options.length<=1));
return{...cfg,rows,scopeFilters:sf}},
banner(id){const all=st.scope==='all'&&!isOrg();if(all)return'';const kit=KIT.includes(id)||id==='';const parts=[SCOPES[st.scope].n];if(isOrg())parts.push('منظم · '+st.nation);
let note=kit?(NO_NATION.includes(id)&&isOrg()?'تقييد الجنسية لا ينطبق على هذا الموديول؛ التقييد بالمدينة فقط.':'البيانات المعروضة مقيّدة بهذا النطاق.'):'هذا الموديول يعرض بيانات كل المراكز في النسخة التجريبية (التقييد غير مطبّق عليه بعد).';
return`<div class="accessNote"><b>نطاق العرض:</b> ${parts.join(' · ')}<span>${note}</span></div>`}};
function mount(){const t=document.querySelector('.top .tools');if(!t||document.querySelector('.accessBox'))return;
const o=(m,v)=>Object.entries(m).map(([k,x])=>`<option value="${k}"${k===v?' selected':''}>${x.n}</option>`).join('');
t.insertAdjacentHTML('afterbegin',`<div class="accessBox"><label>نطاق الإدارة<select id="axScope">${o(SCOPES,st.scope)}</select></label><label>الدخول كـ<select id="axRole"><option value="mgr"${st.role==='mgr'?' selected':''}>مدير الإدارة</option><option value="org"${st.role==='org'?' selected':''}>منظم</option></select></label><label id="axNatWrap"${isOrg()?'':' hidden'}>جنسية المنظم<select id="axNat">${NATS.map(n=>`<option${n===st.nation?' selected':''}>${n}</option>`).join('')}</select></label><label>اللغة<select id="axLang">${Object.entries(window.I18N.LANGS).map(([k,v])=>`<option value="${k}"${k===window.I18N.lang?' selected':''}>${v}</option>`).join('')}</select></label></div>`);
const ch=()=>{st.scope=document.querySelector('#axScope').value;st.role=document.querySelector('#axRole').value;st.nation=document.querySelector('#axNat').value;save();location.reload()};
['#axScope','#axRole','#axNat'].forEach(s=>document.querySelector(s).onchange=ch);document.querySelector('#axLang').onchange=e=>window.I18N.set(e.target.value);
const css=document.createElement('style');css.textContent=(st.scope==='all'?'':`.city[data-city="${st.scope==='mecca'?MD:MK}"]{display:none!important}.citygrid{grid-template-columns:1fr!important}.city{pointer-events:none}`);document.head.appendChild(css)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
