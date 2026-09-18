import {validateState} from './finance.js';

export const typeLabels={income:'Pemasukan',expense:'Pengeluaran',save:'Setor tabungan',withdraw:'Ambil tabungan'};
export function reportData(state,month){
  validateState(state);
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Pilih bulan laporan yang valid.');
  const rows=state.transactions.filter(t=>t.date.startsWith(month)).sort((a,b)=>a.date.localeCompare(b.date));
  const sum=type=>rows.filter(t=>t.type===type).reduce((n,t)=>n+t.amount,0);
  const effect=t=>['income','withdraw'].includes(t.type)?t.amount:-t.amount;
  const prior=state.transactions.filter(t=>t.date.slice(0,7)<month);
  const through=state.transactions.filter(t=>t.date.slice(0,7)<=month);
  const opening=prior.reduce((n,t)=>n+effect(t),0);
  const closing=opening+rows.reduce((n,t)=>n+effect(t),0);
  const goals=state.goals.map(g=>{const related=through.filter(t=>t.goal===g.id&&['save','withdraw'].includes(t.type));const deposits=related.filter(t=>t.type==='save').reduce((n,t)=>n+t.amount,0);const withdrawals=related.filter(t=>t.type==='withdraw').reduce((n,t)=>n+t.amount,0);return {...g,deposits,withdrawals,balance:deposits-withdrawals}});
  const grouped=new Map();rows.filter(t=>t.type==='expense').forEach(t=>grouped.set(t.category,(grouped.get(t.category)||0)+t.amount));
  const savings=goals.reduce((n,g)=>n+g.balance,0);
  return {month,rows,goals,opening,closing,savings,income:sum('income'),expense:sum('expense'),deposits:sum('save'),withdrawals:sum('withdraw'),budget:state.budget,categories:[...grouped].sort((a,b)=>b[1]-a[1])};
}
export function transactionFields(state,t){const transfer=['save','withdraw'].includes(t.type);return [t.date,typeLabels[t.type],transfer?'Tabungan':t.category,transfer?(state.goals.find(g=>g.id===t.goal)?.name||''):'',t.amount,t.note]}
export function exportCsv(state,month){
  const cell=v=>{const text=String(v),safe=/^\s*[=+@-]/.test(text)?"'"+text:text;return '"'+safe.replace(/"/g,'""')+'"'};
  return '\uFEFFsep=;\r\n'+[['Tanggal','Jenis','Kategori','Target tabungan','Nominal (Rp)','Catatan'],...reportData(state,month).rows.map(t=>transactionFields(state,t))].map(r=>r.map(cell).join(';')).join('\r\n');
}

// A small, dependency-free OOXML writer. Every user string is an inline string,
// never a formula. ZIP uses the standard STORE method supported by Excel/Numbers.
const xml=v=>String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const encoder=new TextEncoder();
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0}
function header(size,values){const a=new Uint8Array(size),d=new DataView(a.buffer);for(const [offset,value,width]of values)width===2?d.setUint16(offset,value,true):d.setUint32(offset,value,true);return a}
function zip(files){const chunks=[],directory=[];let offset=0;for(const [name,text]of Object.entries(files)){const n=encoder.encode(name),data=encoder.encode(text),crc=crc32(data);const local=header(30,[[0,0x04034b50,4],[4,20,2],[6,0x800,2],[12,33,2],[14,crc,4],[18,data.length,4],[22,data.length,4],[26,n.length,2]]);chunks.push(local,n,data);directory.push(header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x800,2],[14,33,2],[16,crc,4],[20,data.length,4],[24,data.length,4],[28,n.length,2],[42,offset,4]]),n);offset+=local.length+n.length+data.length}const central=directory.reduce((n,a)=>n+a.length,0);chunks.push(...directory,header(22,[[0,0x06054b50,4],[8,Object.keys(files).length,2],[10,Object.keys(files).length,2],[12,central,4],[16,offset,4]]));const result=new Uint8Array(chunks.reduce((n,a)=>n+a.length,0));let p=0;for(const c of chunks){result.set(c,p);p+=c.length}return result}
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relns='http://schemas.openxmlformats.org/package/2006/relationships';
const office='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const styles=`<styleSheet xmlns="${ns}"><numFmts count="3"><numFmt numFmtId="164" formatCode="&quot;Rp &quot;#,##0;[Red](&quot;Rp &quot;#,##0)"/><numFmt numFmtId="165" formatCode="dd mmm yyyy"/><numFmt numFmtId="166" formatCode="0.0%"/></numFmts><fonts count="4"><font><sz val="11"/><color rgb="FF203C32"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="17"/><color rgb="FF176B50"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FF176B50"/><name val="Arial"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF176B50"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF0E3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><bottom style="thin"><color rgb="FFD9E4D3"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="12">${[
  [0,0,0,0,'left'],[0,2,0,0,'left'],[0,1,2,0,'center'],[164,0,0,0,'right'],[165,0,0,0,'left'],[166,0,0,0,'right'],[0,0,3,0,'left'],[164,0,3,0,'right'],[0,3,0,1,'left'],[164,3,3,1,'right'],[0,0,0,0,'left',true],[0,0,0,0,'right']
].map(([num,font,fill,border,align,wrap])=>`<xf numFmtId="${num}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="${align}" vertical="center"${wrap?' wrapText="1"':''}/></xf>`).join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><tableStyles count="0" defaultTableStyle="TableStyleMedium4" defaultPivotStyle="PivotStyleLight16"/></styleSheet>`;
function col(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s}
const dateSerial=date=>Math.round((Date.parse(date+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000);
function cell(row,column,value,style=0){const r=col(column)+row;return typeof value==='number'?`<c r="${r}" s="${style}"><v>${value}</v></c>`:`<c r="${r}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`}
function sheet(widths,rows,{freeze=0,table=false}={}){return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${ns}" xmlns:r="${office}"><sheetViews><sheetView showGridLines="0" workbookViewId="0">${freeze?`<pane ySplit="${freeze}" topLeftCell="A${freeze+1}" activePane="bottomLeft" state="frozen"/>`:''}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="23"/><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.map(([r,cells,height=23])=>`<row r="${r}" ht="${height}" customHeight="1">${cells.join('')}</row>`).join('')}</sheetData><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>${table?'<tableParts count="1"><tablePart r:id="rId1"/></tableParts>':''}</worksheet>`}

export function exportExcel(state,month,now=new Date()){
  const d=reportData(state,month),title=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(new Date(month+'-01T12:00:00'));
  const summary=[[2,[cell(2,0,'Laporan keuangan Uangku',1)],30],[3,[cell(3,0,title),cell(3,3,'Dibuat '+now.toLocaleDateString('id-ID'))]],[5,[cell(5,0,'Ringkasan bulan',2),cell(5,1,'Nominal',2),cell(5,3,'Kategori pengeluaran',2),cell(5,4,'Nominal',2),cell(5,5,'Porsi',2)]]];
  const metrics=[['Saldo uang harian awal bulan',d.opening],['Pemasukan',d.income],['Pengeluaran',d.expense],['Setoran ke tabungan',d.deposits],['Penarikan dari tabungan',d.withdrawals],['Saldo uang harian akhir bulan',d.closing],['Saldo tabungan akhir bulan',d.savings],['Total uang & tabungan akhir bulan',d.closing+d.savings],['Anggaran bulanan',d.budget||'Tidak diatur'],['Sisa anggaran',d.budget?d.budget-d.expense:'Tidak diatur'],['Jumlah transaksi',d.rows.length]];
  metrics.forEach(([name,value],i)=>{const r=i+6,highlight=i>=5&&i<=7;const c=[cell(r,0,name,highlight?8:0),cell(r,1,value,i===10?11:highlight?9:3)];const cat=d.categories[i];if(cat)c.push(cell(r,3,cat[0]),cell(r,4,cat[1],3),cell(r,5,d.expense?cat[1]/d.expense:0,5));else if(i===0&&!d.categories.length)c.push(cell(r,3,'Belum ada pengeluaran'));summary.push([r,c])});
  summary.push([19,[cell(19,0,'Saldo dihitung dari catatan sampai akhir bulan yang dipilih.')]], [20,[cell(20,0,'Setoran dan penarikan tabungan adalah transfer, bukan pemasukan/pengeluaran.')]]);
  const headers=['Tanggal','Jenis','Kategori','Target tabungan','Nominal (Rp)','Catatan'];
  const transactions=[[2,[cell(2,0,'Transaksi — '+title,1)],30],[3,[cell(3,0,d.rows.length+' transaksi · seluruh jenis transaksi bulan ini')]],[5,headers.map((v,i)=>cell(5,i,v,2)),28]];
  d.rows.forEach((t,i)=>{const r=i+6,fields=transactionFields(state,t),lines=Math.max(t.note.split('\n').reduce((n,s)=>n+Math.max(1,Math.ceil(s.length/38)),0),Math.ceil(fields[3].length/26));transactions.push([r,fields.map((v,j)=>cell(r,j,j===0?dateSerial(v):v,j===0?4:j===4?3:[3,5].includes(j)?10:0)),Math.max(26,lines*17)])});
  if(!d.rows.length)transactions.push([6,[cell(6,0,'Belum ada transaksi bulan ini.')]]);
  const savings=[[2,[cell(2,0,'Target tabungan',1)],30],[3,[cell(3,0,'Saldo kumulatif sampai akhir '+title)]],[5,['Target tabungan','Target nominal','Total setoran','Total penarikan','Saldo tersimpan','Progres'].map((v,i)=>cell(5,i,v,2)),28]];
  d.goals.forEach((g,i)=>{const r=i+6;savings.push([r,[g.name,g.target,g.deposits,g.withdrawals,g.balance,g.balance/g.target].map((v,j)=>cell(r,j,v,j===0?10:j===5?5:3)),Math.max(26,Math.ceil(g.name.length/30)*17)])});
  if(!d.goals.length)savings.push([6,[cell(6,0,'Belum ada target tabungan.')]]);
  const files={
    '[Content_Types].xml':`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${[1,2,3].map(i=>`<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}${d.rows.length?'<Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>':''}</Types>`,
    '_rels/.rels':`<Relationships xmlns="${relns}"><Relationship Id="rId1" Type="${office}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml':`<workbook xmlns="${ns}" xmlns:r="${office}"><bookViews><workbookView/></bookViews><sheets>${['Ringkasan','Transaksi','Tabungan'].map((n,i)=>`<sheet name="${n}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`,
    'xl/_rels/workbook.xml.rels':`<Relationships xmlns="${relns}">${[1,2,3].map(i=>`<Relationship Id="rId${i}" Type="${office}/worksheet" Target="worksheets/sheet${i}.xml"/>`).join('')}<Relationship Id="rId4" Type="${office}/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml':styles,
    'xl/worksheets/sheet1.xml':sheet([40,25,3,27,25,13],summary),
    'xl/worksheets/sheet2.xml':sheet([18,23,23,30,25,44],transactions,{freeze:5,table:!!d.rows.length}),
    'xl/worksheets/sheet3.xml':sheet([34,25,25,25,25,15],savings,{freeze:5})
  };
  if(d.rows.length){const ref='A5:F'+(d.rows.length+5);files['xl/worksheets/_rels/sheet2.xml.rels']=`<Relationships xmlns="${relns}"><Relationship Id="rId1" Type="${office}/table" Target="../tables/table1.xml"/></Relationships>`;files['xl/tables/table1.xml']=`<table xmlns="${ns}" id="1" name="TransaksiUangku" displayName="TransaksiUangku" ref="${ref}" totalsRowShown="0"><autoFilter ref="${ref}"/><tableColumns count="6">${headers.map((n,i)=>`<tableColumn id="${i+1}" name="${xml(n)}"/>`).join('')}</tableColumns><tableStyleInfo name="TableStyleMedium4" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>`}
  return zip(files);
}
