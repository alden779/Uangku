const poses=new Set(['senyum','jempol','kaget','celengan','merayakan','berpikir','nangis','nabung','target']);
export function denku(pose='senyum',className='',label=''){
  if(!poses.has(pose))pose='senyum';
  const source={nangis:'nangis-animated.webp',nabung:'nabung-animated.webp',target:'target-animated.webp'}[pose]||`${pose}-transparent.png`;
  return `<img class="denku ${className}" src="./assets/denku/${source}" alt="${label}" width="1086" height="1448" loading="lazy" decoding="async">`;
}
export function goalReached(before,after){
  return after.goals.some(goal=>{
    const balance=state=>state.transactions.filter(t=>t.goal===goal.id).reduce((sum,t)=>sum+(t.type==='save'?t.amount:t.type==='withdraw'?-t.amount:0),0);
    return balance(before)<goal.target&&balance(after)>=goal.target;
  });
}
