import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMotionFeedback,savingsProgress} from '../motion.js';
test('Savings intensity reflects net deposits and stays within the target',()=>{
  const state={goals:[{id:'a',target:100}],transactions:[{goal:'a',type:'save',amount:90},{goal:'a',type:'withdraw',amount:40}]};
  assert.equal(savingsProgress(state,'a'),.5);
  assert.equal(savingsProgress(state,'missing'),0);
  state.transactions[0].amount=200;assert.equal(savingsProgress(state,'a'),1);
  state.transactions[0].amount=0;assert.equal(savingsProgress(state,'a'),0);
});
test('Effects replace one another and reduced motion omits flying particles',()=>{
  let layer;globalThis.document={createElement:()=>({dataset:{},setAttribute(){},innerHTML:''}),body:{append(el){layer=el}}};
  const motion=createMotionFeedback({reducedMotion:()=>false,random:()=>.5});
  motion.play('save',0);assert.equal((layer.innerHTML.match(/class="motion-particle"/g)||[]).length,6);
  motion.play('save',1);assert.equal((layer.innerHTML.match(/class="motion-particle"/g)||[]).length,14);
  motion.play('expense');assert.equal(layer.dataset.kind,'expense');assert.equal((layer.innerHTML.match(/class="motion-particle"/g)||[]).length,3);
  motion.play('withdraw');assert.equal(layer.dataset.kind,'withdraw');assert.match(layer.innerHTML,/nangis-animated\.webp/);assert.match(layer.innerHTML,/celengannya diet/);
  motion.play('save',.5);assert.match(layer.innerHTML,/nabung-animated\.webp/);
  motion.play('target');assert.match(layer.innerHTML,/target-animated\.webp/);assert.equal((layer.innerHTML.match(/<svg/g)||[]).length,24);
  motion.clear();assert.equal(layer.innerHTML,'');
  const quiet=createMotionFeedback({reducedMotion:()=>true});quiet.play('target');assert.equal(layer.innerHTML.includes('motion-particle'),false);assert.match(layer.innerHTML,/Target tercapai/);quiet.clear();delete globalThis.document;
});
