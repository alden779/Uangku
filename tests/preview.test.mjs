import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewServer} from '../server.mjs';
test('Local preview serves homepage and PNG while blocking private files and traversal',async()=>{
  const server=createPreviewServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/DENKU/);
    const image=await fetch(base+'/assets/denku/senyum.png');assert.equal(image.status,200);assert.equal(image.headers.get('Content-Type'),'image/png');await image.arrayBuffer();
    for(const path of ['/.git/config','/.qa/install-denku.mjs','/%2e%2e%2foutside'])assert.equal((await fetch(base+path)).status,403);
  }finally{await new Promise(resolve=>server.close(resolve))}
});
