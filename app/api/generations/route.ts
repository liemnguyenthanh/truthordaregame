import {api,guest,sameOrigin,body,hash,limit,db,check,HttpError} from '@/lib/payments/server';
import {aiConfig,storageConfig,expireGuest,generatePack,viewGeneration,type GenerationRow} from '@/lib/ai/server';
import {generationInput} from '@/lib/ai/input';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(req:Request){return api(async()=>{
 sameOrigin(req);const config=aiConfig();const guestId=await guest();await limit('ai-create:'+guestId,10);
 const key=req.headers.get('Idempotency-Key');if(!key||! /^[\w-]{16,100}$/.test(key))throw new HttpError(400,'Thiếu mã yêu cầu tạo bộ.');
 let input;try{input=generationInput(await body(req));}catch(error){throw new HttpError(400,error instanceof Error?error.message:'Thông tin nhóm không hợp lệ.');}
 const ip=hash(req.headers.get('x-forwarded-for')?.split(',')[0].trim()??'unknown');
 const {data,error}=await db().rpc('reserve_generation',{p_guest:guestId,p_key:key,p_hash:hash(JSON.stringify(input)),p_ip:ip,p_input:input,p_model:config.model,p_daily_limit:config.dailyLimit,p_ip_limit:config.ipDailyLimit,p_global_limit:config.globalDailyLimit});check(error);
 if(data.error){const messages:Record<string,string>={conflict:'Mã yêu cầu đã dùng cho thông tin khác.',active:'Nhóm đang có một bộ được tạo. Hãy kiểm tra lịch sử.',quota:'Đã hết lượt tạo AI hôm nay. Hãy quay lại ngày mai hoặc chơi bộ có sẵn.'};throw new HttpError(data.error==='quota'?429:409,messages[data.error]??'Chưa thể tạo bộ.');}
 const row=data.generation as GenerationRow;return {generation:data.created?await generatePack(row,config.model):viewGeneration(row)};
});}
export async function GET(){return api(async()=>{storageConfig();const id=await guest();await expireGuest(id);const {data,error}=await db().from('ai_generations').select('*').eq('guest_id',id).order('created_at',{ascending:false}).limit(20);check(error);return {generations:(data??[]).map(row=>viewGeneration(row as GenerationRow)),limitPerDay:Number(process.env.AI_DAILY_LIMIT??3)};});}
