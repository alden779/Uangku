import {test} from 'node:test';
import assert from 'node:assert/strict';
import {goalReached} from '../denku.js';
const state=(amount,type='save')=>({budget:0,goals:[{id:'holiday',name:'Liburan',target:100}],transactions:[{id:'deposit',goal:'holiday',type,amount}]});
test('Celebrate a savings target crossing once, including its exact target',()=>{
  assert.equal(goalReached(state(90),state(100)),true);
  assert.equal(goalReached(state(100),state(120)),false);
  assert.equal(goalReached(state(90),state(99)),false);
  assert.equal(goalReached(state(90),state(100,'income')),false);
  assert.equal(goalReached(state(100),state(90)),false);
  const withdrawing=state(110);withdrawing.transactions.push({id:'withdraw',type:'withdraw',goal:'holiday',amount:20});
  assert.equal(goalReached(state(90),withdrawing),false);
});
