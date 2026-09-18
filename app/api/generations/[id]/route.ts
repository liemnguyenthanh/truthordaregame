import {api,guest,db,check,HttpError} from '@/lib/payments/server';
import {storageConfig,expireGuest,viewGeneration,type GenerationRow} from '@/lib/ai/server';
export const dynamic='force-dynamic';
export async function GET(_:Request,ctx:{params:Promise<{id:string}>}){return api(async()=>{storageConfig();const guestId=await guest();const {id}=await ctx.params;if(!/^[a-f0-9-]{36}$/i.test(id))throw new HttpError(404,'Không tìm thấy bộ AI.');await expireGuest(guestId);const {data,error}=await db().from('ai_generations').select('*').eq('id',id).eq('guest_id',guestId).maybeSingle();check(error);if(!data)throw new HttpError(404,'Không tìm thấy bộ AI trên thiết bị này.');return {generation:viewGeneration(data as GenerationRow)};});}
