import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import pg from 'pg';
const env=parse(readFileSync(new URL('../.env',import.meta.url)));
const front=parse(readFileSync(new URL('../../frontend/.env',import.meta.url)));
const report={};
function errorInfo(e){return {name:e.name,code:e.code||e.cause?.code||'UNKNOWN'};}
report.configuration={clerkKeysMatch:env.CLERK_PUBLISHABLE_KEY===front.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,apiUrlConfigured:!!front.EXPO_PUBLIC_API_URL};
await Promise.all(['DATABASE_URL','DIRECT_URL'].map(async name=>{
 let client;
 try{
 const url=new URL(env[name]);
 if(!['postgres:','postgresql:'].includes(url.protocol))throw Error('Invalid protocol');
 client=new pg.Client({connectionString:env[name],connectionTimeoutMillis:12000,query_timeout:12000});
 await client.connect();
 await client.query('SELECT 1');
 const tables=await client.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN ('Food','Order','OrderItem','_prisma_migrations')");
 report[name]={connected:true,tables:tables.rows};
 }catch(e){report[name]={connected:false,error:errorInfo(e)};}finally{await client?.end().catch(()=>{});}
}));
try{
 const response=await fetch('https://api.clerk.com/v1/instance',{headers:{Authorization:`Bearer ${env.CLERK_SECRET_KEY}`},signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 report.clerkBackend={status:response.status,authenticated:response.ok,environment:data.environment_type,errors:data.errors?.map(e=>({code:e.code,message:e.message}))};
}catch(e){report.clerkBackend={error:errorInfo(e)};}
try{
 const host=Buffer.from(env.CLERK_PUBLISHABLE_KEY.replace(/^pk_(test|live)_/,''),'base64').toString().replace(/\$$/,'');
 if(!/^[a-z0-9.-]+\.clerk\.accounts\.dev$/.test(host))throw Error('Unexpected development host');
 const response=await fetch(`https://${host}/v1/environment`,{signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 const settings=data.response?.user_settings;
 report.clerkFrontend={status:response.status,available:response.ok,settingsKeys:settings?Object.keys(settings):[],signIn:settings?.sign_in,password:settings?.password_settings,email:settings?.attributes?.email_address};
}catch(e){report.clerkFrontend={error:errorInfo(e)};}
try{
 const response=await fetch('https://api.spoonacular.com/recipes/complexSearch?query=pasta&number=1&addRecipeInformation=true',{headers:{'x-api-key':env.SPOONACULAR_API_KEY},signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 report.spoonacular={status:response.status,working:response.ok,resultCount:data.results?.length,quotaRemaining:response.headers.get('x-api-quota-left'),message:response.ok?undefined:data.message};
}catch(e){report.spoonacular={error:errorInfo(e)};}
console.log(JSON.stringify(report,null,2));
