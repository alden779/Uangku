import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,relative,isAbsolute,sep,extname} from 'node:path';
const root=resolve(fileURLToPath(new URL('.',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
export function createPreviewServer(){return createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+pathname),within=relative(root,path);
    if(within==='..'||within.startsWith('..'+sep)||isAbsolute(within)||within.split(sep).some(part=>part.startsWith('.'))){res.writeHead(403).end();return}
    const file=within===''?resolve(root,'index.html'):path;
    const data=await readFile(file);res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);
  }catch{res.writeHead(404).end('Not found')}
})}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))createPreviewServer().listen(5174,'127.0.0.1',()=>console.log('Uangku: http://127.0.0.1:5174'));
