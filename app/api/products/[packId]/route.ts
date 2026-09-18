import { api, db, check, HttpError } from '@/lib/payments/server';
export const dynamic='force-dynamic';
export async function GET(_:Request,ctx:{params:Promise<{packId:string}>}){return api(async()=>{const {packId}=await ctx.params;const {data,error}=await db().from('products').select('*').eq('pack_id',packId).maybeSingle();check(error);if(!data)throw new HttpError(404,'Không tìm thấy bộ câu hỏi.');return {packId,priceVnd:data.price_vnd,currency:'VND',available:data.active,priceVersion:data.price_version};});}
