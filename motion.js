import {denku} from './denku.js';
const coin='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#ffdc71" stroke="#b88425" stroke-width="3"/><circle cx="24" cy="24" r="14" fill="none" stroke="#fff4b9" stroke-width="2"/><text x="24" y="30" text-anchor="middle" font-size="17" font-weight="700" fill="#946b20">Rp</text></svg>';
const note='<svg viewBox="0 0 70 48" aria-hidden="true"><rect x="3" y="7" width="64" height="34" rx="6" fill="#b9d99a" stroke="#467b4a" stroke-width="3"/><path d="M10 17v-3h8m34 0h8v3M10 31v3h8m34 0h8v-3" fill="none" stroke="#467b4a" stroke-width="2"/><circle cx="35" cy="24" r="11" fill="#eff8d9"/><text x="35" y="28" text-anchor="middle" font-size="12" font-weight="700" fill="#467b4a">Rp</text></svg>';
const winged='<svg viewBox="0 0 100 55" aria-hidden="true"><path d="M28 30C6 30 0 5 7 4c12 2 18 8 28 20M72 30c22 0 28-25 21-26-12 2-18 8-28 20" fill="#fff" stroke="#b1c8c0" stroke-width="2"/><rect x="24" y="20" width="52" height="28" rx="5" fill="#b9d99a" stroke="#467b4a" stroke-width="2"/><circle cx="50" cy="34" r="9" fill="#eff8d9"/></svg>';
const cloud='<svg viewBox="0 0 96 70" aria-hidden="true"><path d="M25 52h49c23 0 24-32 3-34-5-21-38-21-45-3C6 10 1 51 25 52z" fill="#fff" stroke="#86b6a9" stroke-width="3"/><path d="m35 35 9 9 17-19" fill="none" stroke="#176b50" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export function savingsProgress(state,goalId){const goal=state.goals.find(g=>g.id===goalId);if(!goal)return 0;const saved=state.transactions.filter(t=>t.goal===goalId).reduce((sum,t)=>sum+(t.type==='save'?t.amount:t.type==='withdraw'?-t.amount:0),0);return Math.max(0,Math.min(1,saved/goal.target))}
export function createMotionFeedback({reducedMotion=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false,random=Math.random}={}){
  const layer=document.createElement('div');layer.className='motion-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);let timer;
  return {play(kind,progress=0){
    clearTimeout(timer);
    const config={save:['celengan','Celengan makin gendut!'],withdraw:['nangis','Yah, celengannya diet dulu…'],income:['jempol','Dompet dapat amunisi!'],expense:['kaget','Dadah duit, sudah dicatat!'],target:['merayakan','Target tercapai! Impian makin dekat!'],backup:['jempol','Catatan aman di awan!']}[kind];
    if(!config)return;
    const reduced=reducedMotion();layer.dataset.kind=kind;layer.dataset.reduced=String(reduced);
    const count=reduced?0:kind==='target'?24:kind==='save'?6+Math.round(progress*8):['expense','withdraw'].includes(kind)?3:kind==='backup'?4:8;
    let particles='';
    for(let i=0;i<count;i++){
      const x=Math.round((random()-.5)*85),y=Math.round((random()-.5)*65),angle=Math.round((random()-.5)*80),delay=Math.round(i*35);
      const art=kind==='target'?'<i></i>':['expense','withdraw'].includes(kind)?winged:kind==='backup'?(i===0?cloud:'<span class="paper-icon">✓</span>'):i%3===0?note:coin;
      particles+=`<span class="motion-particle" style="--x:${x}vw;--y:${y}vh;--angle:${angle}deg;--delay:${delay}ms;--color:${['#ffc969','#ee937b','#a3c798','#87bcb2'][i%4]}">${art}</span>`;
    }
    layer.innerHTML=particles+`<div class="motion-caption">${denku(config[0],'motion-denku')}<span>${config[1]}</span></div>`;
    timer=setTimeout(()=>{layer.innerHTML=''},reduced?1600:2600);timer.unref?.();
  },clear(){clearTimeout(timer);layer.innerHTML=''}};
}
