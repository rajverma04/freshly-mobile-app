import 'dotenv/config';
const {app}=await import('../dist/app.js');
const {prisma}=await import('../dist/lib/prisma.js');
const server=app.listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
try{
 for(const path of ['/health','/api/foods','/api/recipes?query=pasta','/api/orders']){
  const r=await fetch(base+path,{signal:AbortSignal.timeout(20000)});const d=await r.json();
  console.log(JSON.stringify({path,status:r.status,resultCount:d.results?.length??(Array.isArray(d)?d.length:undefined),message:d.message}));
 }
 const host=Buffer.from(process.env.CLERK_PUBLISHABLE_KEY.replace(/^pk_(test|live)_/,''),'base64').toString().replace(/\$$/,'');
 const r=await fetch(`https://${host}/v1/environment`,{signal:AbortSignal.timeout(15000)});const d=await r.json();
 console.log(JSON.stringify({clerkEnvironmentKeys:Object.keys(d),authConfig:d.user_settings??d.auth_config??d.response?.auth_config},null,2));
}finally{await new Promise(resolve=>server.close(resolve));await prisma.$disconnect();}
