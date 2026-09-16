import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,sep} from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root)||path.includes(sep+'.git'+sep)){res.writeHead(403).end();return}const file=path===root.slice(0,-1)?resolve(root,'index.html'):path;const data=await readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(data)}catch{res.writeHead(404).end('Not found')}}).listen(5174,'127.0.0.1',()=>console.log('Uangku: http://127.0.0.1:5174'));
