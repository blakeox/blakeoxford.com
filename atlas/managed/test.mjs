import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const cwd=fileURLToPath(new URL('./',import.meta.url));
const tests=fileURLToPath(new URL('../mcp/test.mjs',import.meta.url));
const run=(command,args,options)=>spawn(command,args,{stdio:'inherit',...options});
const live=process.argv.includes('--live');
if(live){
 const [code]=await once(run(process.execPath,[tests,'--live']), 'exit');
 process.exit(code??1);
}
const scratch=await mkdtemp(join(tmpdir(),'atlas-managed-test-'));
const port=8789;
const base='http://127.0.0.1:'+port;
const dev=run('npm',['run','dev','--','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd,detached:true,env:{...process.env,XDG_CONFIG_HOME:scratch}});
try{
 let started=false;
 for(let i=0;i<35;i++){
  if(dev.exitCode!==null)throw Error('Cloudflare local runtime exited before tests.');
  try{if((await fetch(base+'/',{signal:AbortSignal.timeout(1000)})).ok){started=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,250));
 }
 if(!started)throw Error('Cloudflare local runtime did not start.');
 const [code]=await once(run(process.execPath,[tests],{env:{...process.env,ATLAS_TEST_URL:base}}),'exit');
 process.exitCode=code??1;
} finally {
 try{process.kill(-dev.pid,'SIGTERM');}catch{}
 await rm(scratch,{recursive:true,force:true});
}
