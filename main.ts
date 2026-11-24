import {mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
const IN=process.env.MAKEFUN_INPUT_DIR??'/input',OUT=process.env.MAKEFUN_OUTPUT_DIR??'/output',TE=new TextEncoder;
function run(p,g){
 const n=p.length,S=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536);
 let t=0,u=0,l=0,q=0,c=0,k=0;
 const fin=e=>({o:o.slice(0,l),e});
 const under=x=>{if(t<x)throw 2};
 const over=()=>{if(t>=256)throw 3};
 try{for(;;){
  if(k>=1e6)throw 10;
  if(c<0||c>=n)throw 9;
  const b=p[c];
  if(!((b<=7)||(b>=16&&b<=34)||(b>=48&&b<=52)||b===64||b===65||(b>=80&&b<=83)))throw 5;
  const m=b===1?1:b===2?4:b>=48&&b<=51?2:0;
  if(c+m>=n)throw 9;
  k++;
  const nx=c+1+m;c=nx;
  if(b<16){
   if(b===0)return fin(0);
   if(b===1){over();S[t++]=(p[nx-1]<<24)>>24;continue;}
   if(b===2){over();S[t++]=p[nx-4]|p[nx-3]<<8|p[nx-2]<<16|p[nx-1]<<24;continue;}
   if(b===3){under(1);t--;continue;}
   if(b===4){under(1);over();S[t]=S[t-1];t++;continue;}
   if(b===5){under(2);const x=S[t-1];S[t-1]=S[t-2];S[t-2]=x;continue;}
   if(b===6){under(2);over();S[t]=S[t-2];t++;continue;}
   if(b===7){under(3);const x=S[t-3];S[t-3]=S[t-2];S[t-2]=S[t-1];S[t-1]=x;continue;}
  }
  if(b>=16&&b<=34){
   if(b===23){under(1);S[t-1]=-S[t-1]|0;continue;}
   if(b===27){under(1);S[t-1]=~S[t-1];continue;}
   under(2);
   const y=S[t-1],x=S[t-2];let r=0;
   if(b===16)r=x+y|0;
   else if(b===17)r=x-y|0;
   else if(b===18)r=Math.imul(x,y);
   else if(b===19){if(y===0)throw 4;r=x===-2147483648&&y===-1?x:(x/y)|0;}
   else if(b===20){if(y===0)throw 4;r=y===-1?0:x%y|0;}
   else if(b===21){if(y===0)throw 4;r=Math.floor((x>>>0)/(y>>>0))|0;}
   else if(b===22){if(y===0)throw 4;r=(x>>>0)%(y>>>0)|0;}
   else if(b===24)r=x&y;
   else if(b===25)r=x|y;
   else if(b===26)r=x^y;
   else if(b===28)r=x<<(y&31);
   else if(b===29)r=x>>(y&31);
   else if(b===30)r=x>>>(y&31)|0;
   else if(b===32)r=x===y?1:0;
   else if(b===33)r=x<y?1:0;
   else r=(x>>>0)<(y>>>0)?1:0;
   t-=2;S[t++]=r;continue;
  }
  if(b>=48&&b<=52){
   if(b===48){c=nx+(((p[nx-2]|p[nx-1]<<8)<<16)>>16);continue;}
   if(b===49||b===50){under(1);const v=S[--t];if((b===49)===(v===0))c=nx+(((p[nx-2]|p[nx-1]<<8)<<16)>>16);continue;}
   if(b===51){if(u>=64)throw 7;C[u++]=nx;c=p[nx-2]|p[nx-1]<<8;continue;}
   if(u===0)throw 8;c=C[--u];continue;
  }
  if(b===64){under(1);const a=S[t-1];if(a<0||a>255)throw 6;S[t-1]=M[a];continue;}
  if(b===65){under(2);const a=S[t-1],v=S[t-2];if(a<0||a>255)throw 6;t-=2;M[a]=v;continue;}
  if(b===80){under(1);const s=String(S[t-1]),d=TE.encode(s);if(l+d.length>65536)throw 11;t--;o.set(d,l);l+=d.length;continue;}
  if(b===81){under(1);if(l>=65536)throw 11;o[l++]=S[--t]&255;continue;}
  if(b===82){over();S[t++]=q<g.length?g[q++]:-1;continue;}
  if(b===83){under(1);return fin(S[--t]&255);}
  throw 5;
 }}catch(x){return fin(typeof x==='number'?x:1);}
}
for(const id of readdirSync(IN).sort()){
 const r=run(new Uint8Array(readFileSync(join(IN,id,'program.bin'))),new Uint8Array(readFileSync(join(IN,id,'input.bin'))));
 mkdirSync(join(OUT,id),{recursive:true});
 writeFileSync(join(OUT,id,'stdout.bin'),r.o);
 writeFileSync(join(OUT,id,'exit.txt'),r.e+'\n');
}
