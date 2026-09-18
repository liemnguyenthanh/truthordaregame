import { api,guest,db,check,HttpError,orderView } from '@/lib/payments/server';
export const dynamic='force-dynamic';
export async function GET(_:Request,ctx:{params:Promise<{orderId:string}>}){return api(async()=>{const id=await guest();const {orderId}=await ctx.params;if(!/^[a-f0-9-]{36}$/i.test(orderId))throw new HttpError(404,'Không tìm thấy đơn.');const {data,error}=await db().from('orders').select('*').eq('id',orderId).eq('guest_id',id).maybeSingle();check(error);if(!data)throw new HttpError(404,'Không tìm thấy đơn.');return {order:await orderView(data)};});}
