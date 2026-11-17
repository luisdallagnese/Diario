(()=>{
const MESES="JANEIRO FEVEREIRO MARÇO ABRIL MAIO JUNHO JULHO AGOSTO SETEMBRO OUTUBRO NOVEMBRO DEZEMBRO".split(" "),RH=11.34,X0=229.6,X1=705.8,NC=42,CW=(X1-X0)/NC;
const num=v=>{v=parseFloat(String(v??'').replace(',','.'));return isNaN(v)?null:v},up=x=>Math.ceil(Math.round(x*2*1e6)/1e6)/2,fmt=v=>v.toFixed(1).replace('.',',');
const DEF=()=>[{id:'av',nome:'Avaliação',peso:70},{id:'li',nome:'Lista de exercícios',peso:30}];
async function pagew(doc,i){const pg=await doc.getPage(i),H=pg.getViewport({scale:1}).height,ws=[];for(const it of(await pg.getTextContent()).items){const s=it.str;if(!s.trim())continue;const x=it.transform[4],y=it.transform[5],h=it.height||Math.abs(it.transform[3]),re=/\S+/g;let m;while(m=re.exec(s))ws.push({text:m[0],x0:x+it.width*m.index/s.length,top:H-y-.8*h,bottom:H-y+.2*h})}return ws}
function limite(ws){const fl=ws.filter(w=>w.text.toUpperCase()=='FALTAS'&&w.top<112).sort((a,b)=>a.top-b.top)[0],nums=ws.filter(w=>/^\d{1,3}$/.test(w.text)&&+w.text>=5&&w.top<112);if(!nums.length)return null;let n;if(fl)n=[...nums].sort((a,b)=>Math.abs(a.x0-fl.x0)-Math.abs(b.x0-fl.x0))[0];else if(nums.length==2)n=[...nums].sort((a,b)=>b.x0-a.x0)[0];return n?+n.text:null}
async function scan(files){const found={};
 for(const f of files){let ws,lim;try{const doc=await PDFJS.getDocument({data:f.bytes.slice(),standardFontDataUrl:globalThis.FONTURL}).promise;ws=await pagew(doc,1);lim={1:limite(ws),2:doc.numPages>1?limite(await pagew(doc,2)):null}}catch(e){continue}
  ws.sort((a,b)=>a.x0-b.x0);const band=ws.filter(w=>w.top>50&&w.top<66),cut=(a,b)=>band.filter(w=>w.x0>=a&&w.x0<b).map(w=>w.text).join(' '),
  nome=cut(0,370),turma=cut(560,610),sem=cut(760,900),al=[];
  for(let i=0;i<38;i++){const a=124.7+RH*i,r=ws.filter(w=>{const c=(w.top+w.bottom)/2;return c>=a&&c<a+RH}),nm=r.filter(w=>w.x0>=90&&w.x0<229).map(w=>w.text).join(' ');
   if(nm)al.push({n:i+1,ra:r.filter(w=>w.x0<70).map(w=>w.text).join(' '),nome:nm})}
  if(!nome||!turma)continue;const k=[nome,sem,turma].join('\u0001');
  if(!found[k]||f.m>found[k].v.m)found[k]={nome,sem,turma,v:{f:f.name,al,m:f.m,dup:!!found[k],lim}}}
 const discs={};for(const x of Object.values(found)){const d=discs[x.nome+'|'+x.sem]??={nome:x.nome,sem:x.sem,turmas:{}};d.turmas[x.turma]=x.v}return discs}
const feriados=t=>{const s=new Set();for(const x of t.replace(/,/g,' ').split(/\s+/)){const m=x.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(m)s.add(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`)}return s};
function datas(c,fer,ini,fim){const P=s=>/^\d{4}-\d\d-\d\d$/.test(s||'')?new Date(s+'T00:00:00Z'):null;ini=P(ini);fim=P(fim);const av=P(c.aval1);if(!ini||!fim||!av||!c.ciclo.length)return[];
 const out=[],DY=864e5;let seg=new Date(ini.getTime()-((ini.getUTCDay()+6)%7)*DY),k=0;
 while(seg<=fim){for(const e of[...c.ciclo[k%c.ciclo.length]].sort((a,b)=>a.dia-b.dia)){const d=new Date(seg.getTime()+e.dia*DY),s=d.toISOString().slice(0,10);if(d>=ini&&d<=fim&&!fer.has(s))out.push({d:s,n:+e.n,bim:d<=av?1:2})}seg=new Date(seg.getTime()+7*DY);k++}for(const e of c.extras||[]){if(!/^\d{4}-\d\d-\d\d$/.test(e.d))continue;const o=out.find(q=>q.d==e.d);if(o)o.n+=+e.n;else out.push({d:e.d,n:+e.n,bim:new Date(e.d+'T00:00:00Z')<=av?1:2})}return out.sort((a,b)=>a.d<b.d?-1:1)}
function loadS(S,info){S=S&&S.v?S:{v:2};S.feriados??='';S.disc??={};for(const k of['inicio','fim'])S[k]??=Object.values(S.disc).map(c=>c[k]).find(Boolean)||'';
 for(const k in info)S.disc[k]??={aval1:'',ciclo:[[{dia:1,n:2}]],aulas:{},notas:{},comp:{1:DEF(),2:DEF()}};for(const c of Object.values(S.disc))c.comp??={1:DEF(),2:DEF()};return S}
function unir(info,S){const u=S.uni||{},root=k=>{let n=0;while(u[k]&&info[u[k]]&&n++<9)k=u[k];return k},o={};
 for(const k in info)if(root(k)==k)o[k]={...info[k],turmas:{}};
 for(const k in info)for(const[t,v]of Object.entries(info[k].turmas))o[root(k)].turmas[t]={...v,nome:info[k].nome};
 for(const p in o){const ns=[...new Set(Object.values(o[p].turmas).map(v=>v.nome))];if(ns.length>1)o[p].nome=ns.join(' / ')}return o}
const alld=S=>{const f=feriados(S.feriados),o={};for(const k in S.disc)o[k]=datas(S.disc[k],f,S.inicio,S.fim);return o};
function mediaBim(comp,vals){let s=0,p=0;for(const k of comp){const v=num((vals||{})[k.id]);if(v==null)return null;s+=v*k.peso;p+=+k.peso}return p?up(s/p):null}
function final(m1,m2,ex){if(m1==null||m2==null)return[null,false];const x=up((m1+m2)/2);return x>=4&&x<7?[ex!=null?up((x+ex)/2):null,true]:[x,false]}
function cont(cf,ds,iso){const c=(cf.aulas[iso]||{}).conteudo;if(c)return c;if(ds.length&&ds[0].d==iso)return'Apresentação da Disciplina';if(cf.aval1==iso)return'Avaliação Bimestral';return''}
async function pdf(d,cf,ds,turma,t,bytes){const doc=await PDFLib.PDFDocument.load(bytes),pgs=doc.getPages(),H=pgs[0].getHeight(),F=await doc.embedFont(PDFLib.StandardFonts.Helvetica),FB=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold),notas=cf.notas[turma]||{};let pg;
 const san=(s,f)=>[...String(s).replace(/\s+/g,' ')].map(ch=>{try{f.encodeText(ch);return ch}catch{return'?'}}).join('');
 const txt=(xa,xb,ta,tb,s,sz=7,left=false,bold=false)=>{const f=bold?FB:F;s=san(s,f);while(f.widthOfTextAtSize(s,sz)>xb-xa-2&&sz>3)sz-=.3;const y=H-(ta+tb)/2-sz*.35;
  pg.drawText(s,{x:left?xa+1.5:(xa+xb)/2-f.widthOfTextAtSize(s,sz)/2,y,size:sz,font:f})};
 const dd=iso=>iso.split('-').reverse().join('/');
 for(const bim of[1,2]){pg=pgs[bim-1];const cs=ds.filter(x=>x.bim==bim).flatMap(x=>Array(x.n).fill(x.d)).slice(0,NC);
  cs.forEach((iso,j)=>txt(X0+CW*j,X0+CW*(j+1),113.4,124.7,iso.slice(8),6.5));
  for(let j=0;j<cs.length;){const m=+cs[j].slice(5,7);let e=j;while(e+1<cs.length&&+cs[e+1].slice(5,7)==m)e++;const xa=X0+CW*j,xb=X0+CW*(e+1);txt(xa,xb,102,113.4,MESES[m-1],7,false,true);pg.drawLine({start:{x:xb,y:H-102},end:{x:xb,y:H-113.4},thickness:.5});j=e+1}
  for(const a of t.al){const ta=124.7+RH*(a.n-1),tb=ta+RH,nt=notas[a.ra]||{};let fl=null;
   cs.forEach((iso,j)=>{const l=((cf.aulas[iso]||{}).falt||{})[turma];if(!l)return;const f=l.includes(a.ra);fl=(fl||0)+f;txt(X0+CW*j,X0+CW*(j+1),ta,tb,f?'F':'C')});
   if(fl!==null)txt(X1,728.5,ta,tb,String(fl));
   const m1=mediaBim(cf.comp[1],nt[1]),m2=mediaBim(cf.comp[2],nt[2]),ex=num(nt.ex),[fin,prec]=final(m1,m2,ex);
   if(bim==1&&m1!=null)txt(785.2,807.9,ta,tb,fmt(m1));
   if(bim==2){if(m2!=null)txt(728.5,754,ta,tb,fmt(m2));if(prec&&ex!=null)txt(754,779.5,ta,tb,fmt(ex));if(fin!=null)txt(779.5,807.9,ta,tb,fmt(fin))}}}
 for(const bim of[1,2]){pg=pgs[bim+1];let i=0;ds.forEach((x,k)=>{if(x.bim!=bim)return;const n=i++;if(n>=42)return;const cx=n<21?[28.4,85,107.7,411]:[411,467.7,496.1,807.9],ta=121.9+14.17*(n%21),tb=ta+14.17;
  txt(cx[0],cx[1],ta,tb,dd(x.d),7.5);txt(cx[1],cx[2],ta,tb,String(k+1),7.5);txt(cx[2],cx[3],ta,tb,cont(cf,ds,x.d),7.5,true)})}
 return doc.save()}
async function gerar(files,S,info,dk){const D=alld(S),out=[];
 for(const k in info){if(dk&&k!=dk)continue;for(const turma in info[k].turmas){const t=info[k].turmas[turma],o=files.find(f=>f.name==t.f);
  out.push({name:`${t.nome||info[k].nome} - ${turma}.pdf`.replace(/[\/\\:*?"<>|]/g,'-'),bytes:await pdf(info[k],S.disc[k],D[k],turma,t,o.bytes)})}}return out}
globalThis.Motor={v:6,cont,unir,scan,loadS,alld,gerar};
})();
