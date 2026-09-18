import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWebhook,validApiKey,normalizeRecovery} from '../lib/payments/validation';
const payload={id:7,transferAmount:30000,transferType:'in',accountNumber:'123',gateway:'MBBank',transactionDate:'2026-09-17 10:00:00',content:'TOD0123456789'};
test('API key rejects wrong scheme/key',()=>{assert.equal(validApiKey('Apikey abc','abc'),true);assert.equal(validApiKey('Bearer abc','abc'),false);assert.equal(validApiKey(null,'abc'),false);assert.equal(validApiKey('Apikey abd','abc'),false);});
test('bank timestamp is Vietnam time; content code extracted exactly',()=>{const e=parseWebhook(payload);assert.equal(e.bankTime,'2026-09-17T03:00:00.000Z');assert.equal(e.paymentCode,payload.content);});
test('ambiguous codes and partial tokens cannot match an order',()=>{assert.equal(parseWebhook({...payload,content:payload.content+' TOD1111111111'}).paymentCode,null);assert.equal(parseWebhook({...payload,content:'X'+payload.content}).paymentCode,null);});
test('invalid amount, rollover date, ID rejected',()=>{for(const patch of [{transferAmount:1.5},{transferAmount:-1},{id:0},{transactionDate:'2026-02-30 10:00:00'}])assert.throws(()=>parseWebhook({...payload,...patch}));});
test('recovery tolerates visual separators only',()=>assert.equal(normalizeRecovery('abcd-1234 ef'), 'ABCD1234EF'));

import {apiTransaction,collectTransactions,vietnamTime} from '../lib/payments/reconcile';
const apiRow={id:'7',amount_in:'30000.00',amount_out:'0.00',account_number:'123',bank_brand_name:'MBBank',transaction_date:'2026-09-17 10:00:00',transaction_content:'TOD0123456789',code:null};
test('reconciliation maps API amounts/IDs into identical webhook identity',()=>{assert.deepEqual(parseWebhook(apiTransaction(apiRow)),parseWebhook(payload));assert.equal(vietnamTime(Date.parse('2026-09-17T03:00:00Z')),'2026-09-17 10:00:00');assert.throws(()=>apiTransaction({...apiRow,amount_in:'30000.50'}));assert.throws(()=>apiTransaction({...apiRow,id:'uuid-id'}));});
test('time window paging overlaps and deduplicates shared boundary transactions',async()=>{const calls:number[][]=[];const result=await collectTransactions(0,4000,async(a,b)=>{calls.push([a,b]);return b-a>2000?[apiRow,apiRow]:[apiRow];},5,2);assert.equal(result.transactions.length,1);assert.deepEqual(calls,[[0,4000],[0,2000],[2000,4000]]);});
test('saturated single-second windows and exhausted budget fail instead of dropping transactions',async()=>{await assert.rejects(collectTransactions(0,1000,async()=>[apiRow],5,1));await assert.rejects(collectTransactions(0,4000,async()=>[apiRow],1,1));});
