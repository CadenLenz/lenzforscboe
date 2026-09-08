import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { onRequest as submit } from '../functions/api/endorsement.js';
import { onRequest as list } from '../functions/api/endorsements.js';
import { onRequest as review } from '../functions/api/endorsement-review.js';
import { onRequest as config } from '../functions/api/endorsement-config.js';
import { hash, reviewToken } from '../lib/endorsements.js';
const origin = 'https://lenzforscboe.com';
function setup() {
 const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../migrations/0001_endorsements.sql',import.meta.url),'utf8'));
 const DB = { prepare(sql) { const stmt = sqlite.prepare(sql); let args=[]; return { bind(...values) {args=values;return this;}, async run(){const r=stmt.run(...args);return {meta:{changes:Number(r.changes)}};},async first(){return stmt.get(...args)||null;},async all(){return {results:stmt.all(...args)};} }; } };
 const env = { DB, PUBLIC_SITE_URL:origin, TURNSTILE_SITE_KEY:'test-site', TURNSTILE_SECRET_KEY:'test-secret', EMAIL_API_KEY:'test-only', ENDORSEMENT_FROM_EMAIL:'Campaign <endorsements@lenzforscboe.com>', ENDORSEMENT_REVIEW_EMAIL:'lenzforscboe@gmail.com', REVIEW_TOKEN_SECRET:'unit-test-only-'.repeat(4) };
 const data = {name:'Test Endorser',role:'Test Role',email:'controlled@example.com',consent:true,website:'',token:'verified-test-token',requestId:crypto.randomUUID()};
 const emails=[];let mailOK=true;let challenge={success:true,action:'endorsement',hostname:'lenzforscboe.com'};
 const fetcher=async (url,options)=>{
  if(url.includes('siteverify'))return Response.json(challenge);
  assert.equal(url,'https://api.resend.com/emails'); emails.push({body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});
  return Response.json(mailOK?{id:'test-mail-id'}:{error:'private-error'},{status:mailOK?200:500});
 };
 const request = (values=data, extra={}) => new Request(origin+'/api/endorsement',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...extra},body:JSON.stringify(values)});
 const publicList = () => list({request:new Request(origin+'/api/endorsements'),env});
 const row=()=>sqlite.prepare('SELECT * FROM endorsements LIMIT 1').get();
 const act=async(action='approve',method='POST',token)=>{
  token??=await reviewToken(env,row());
  const values=new URLSearchParams({token,action});
  return review({request:new Request(origin+'/api/endorsement-review'+(method==='GET'?'?'+values:''),{method,headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},...(method==='POST'?{body:values}: {})}),env});
 };
 return {env,data,request,sqlite,emails,fetcher,publicList,row,act,setMail(value){mailOK=value;},setChallenge(value){challenge=value;}};
}
test('pending storage, private public API, safe email and approval/replay',async t=>{
 const c=setup();t.after(()=>c.sqlite.close());t.mock.method(globalThis,'fetch',c.fetcher);
 c.data.name='<script>alert(1)</script>';
 assert.equal((await submit({request:c.request(),env:c.env})).status,200);
 assert.equal(c.row().status,'pending');assert.equal(c.row().approval_token_hash.length,64);
 const token=await reviewToken(c.env,c.row());assert.notEqual(c.row().approval_token_hash,token);assert.equal(c.row().approval_token_hash,await hash(token));
 assert.deepEqual(await (await c.publicList()).json(),{endorsements:[]});
 assert.equal(c.emails[0].body.to[0],'lenzforscboe@gmail.com');assert.match(c.emails[0].body.html,/&lt;script&gt;/);assert.ok(!c.emails[0].body.html.includes('<script>'));
 const get=await c.act('approve','GET');assert.equal(get.status,200);assert.equal(c.row().status,'pending');assert.ok(!(await get.text()).includes('<script>'));
 assert.equal((await c.act('approve','POST',token)).status,200);
 assert.deepEqual(await (await c.publicList()).json(),{endorsements:[{name:c.data.name,role:'Test Role'}]});
 assert.equal(c.row().approval_token_hash,null);assert.equal((await c.act('decline','POST',token)).status,400);assert.equal(c.row().status,'approved');
});
test('decline, expiration, malformed links and methods',async t=>{
 const c=setup();t.after(()=>c.sqlite.close());t.mock.method(globalThis,'fetch',c.fetcher);
 await submit({request:c.request(),env:c.env});assert.equal((await c.act('decline')).status,200);assert.equal(c.row().status,'declined');assert.deepEqual(await(await c.publicList()).json(),{endorsements:[]});
 assert.equal((await c.act('approve','POST','x'.repeat(64))).status,400);
 c.data.requestId=crypto.randomUUID();await submit({request:c.request(),env:c.env});
 const pending=c.sqlite.prepare("SELECT * FROM endorsements WHERE status='pending'").get();const expired=await reviewToken(c.env,pending);
 c.sqlite.prepare('UPDATE endorsements SET token_expires_at=0 WHERE id=?').run(pending.id);assert.equal((await c.act('approve','POST',expired)).status,400);
 assert.equal((await submit({request:new Request(origin),env:c.env})).status,405);
 assert.equal((await list({request:new Request(origin,{method:'POST'}),env:c.env})).status,405);
});
test('all required validation and origin/content boundaries',async t=>{
 const c=setup();t.after(()=>c.sqlite.close());t.mock.method(globalThis,'fetch',c.fetcher);
 for(const delta of [{name:' '},{role:' '},{email:''},{email:'invalid'},{consent:false},{website:'spam'},{name:'a'.repeat(121)},{role:'a'.repeat(181)},{name:'a\nb'},{requestId:'1'},{extra:'x'}]) assert.equal((await submit({request:c.request({...c.data,...delta}),env:c.env})).status,400);
 assert.equal((await submit({request:c.request(c.data,{Origin:'https://evil.example'}),env:c.env})).status,403);
 assert.equal((await submit({request:c.request(c.data,{'Content-Type':'text/plain'}),env:c.env})).status,415);
 assert.equal((await submit({request:c.request({...c.data,token:'a'.repeat(9000)}),env:c.env})).status,400);
 assert.equal(c.sqlite.prepare('SELECT count(*) AS n FROM endorsements').get().n,0);
});
test('Turnstile failure and configuration fail closed',async t=>{
 const c=setup();t.after(()=>c.sqlite.close());t.mock.method(globalThis,'fetch',c.fetcher);
 for(const challenge of [{success:false},{success:true,action:'wrong',hostname:'lenzforscboe.com'},{success:true,action:'endorsement',hostname:'other.example'}]) {c.setChallenge(challenge);assert.equal((await submit({request:c.request(),env:c.env})).status,400);}
 const missing={...c.env,EMAIL_API_KEY:''};assert.equal((await submit({request:c.request(),env:missing})).status,503);
 const publicConfig=await config({request:new Request(origin),env:c.env}).json();assert.deepEqual(publicConfig,{enabled:true,siteKey:'test-site'});
});
test('lost responses and email failures retry without duplicate rows or new bearer tokens',async t=>{
 const c=setup();t.after(()=>c.sqlite.close());t.mock.method(globalThis,'fetch',c.fetcher);c.setMail(false);
 assert.equal((await submit({request:c.request(),env:c.env})).status,503);assert.equal(c.row().status,'pending');assert.equal(c.row().email_sent_at,null);
 c.setMail(true);assert.equal((await submit({request:c.request(),env:c.env})).status,200);assert.deepEqual(c.emails[0],c.emails[1]);
 assert.equal((await submit({request:c.request(),env:c.env})).status,200);assert.equal(c.emails.length,2);assert.equal(c.sqlite.prepare('SELECT count(*) AS n FROM endorsements').get().n,1);
 assert.equal((await submit({request:c.request({...c.data,name:'different'}),env:c.env})).status,409);
});
test('private no-referrer confirmation requires same-origin Fetch Metadata and a valid token',async t=>{
 const c=setup();t.after(()=>c.sqlite.close());t.mock.method(globalThis,'fetch',c.fetcher);
 await submit({request:c.request(),env:c.env});const token=await reviewToken(c.env,c.row());
 const request=site=>new Request(origin+'/api/endorsement-review',{method:'POST',headers:{Origin:'null','Sec-Fetch-Site':site,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token,action:'approve'})});
 assert.equal((await review({request:request('cross-site'),env:c.env})).status,400);
 assert.equal((await review({request:request('same-origin'),env:c.env})).status,200);
 assert.equal(c.row().status,'approved');
});
