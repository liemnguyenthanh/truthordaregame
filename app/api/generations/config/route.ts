import {api} from '@/lib/payments/server';
import {aiConfig} from '@/lib/ai/server';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>{const {available,dailyLimit,billing}=aiConfig();return {available,dailyLimit,billing};});}
