'use client';
import { useEffect, useState } from 'react';
import { Download, WifiOff, Check, X } from 'lucide-react';
import type { Pack } from '@/lib/types';

type InstallEvent = Event & { prompt:()=>Promise<void>; userChoice:Promise<{outcome:string}> };
export function PwaControls(){
 const [install,setInstall]=useState<InstallEvent|null>(null);const [ios,setIos]=useState(false);const [help,setHelp]=useState(false);const [waiting,setWaiting]=useState<ServiceWorker|null>(null);const [offline,setOffline]=useState(false);
 useEffect(()=>{
  const updateOnline=()=>setOffline(!navigator.onLine);updateOnline();window.addEventListener('online',updateOnline);window.addEventListener('offline',updateOnline);
  const onInstall=(event:Event)=>{event.preventDefault();setInstall(event as InstallEvent)};window.addEventListener('beforeinstallprompt',onInstall);
  const standalone=window.matchMedia('(display-mode: standalone)').matches;
  setIos(/iPhone|iPad|iPod/.test(navigator.userAgent)&&!standalone);
  if('serviceWorker' in navigator && process.env.NODE_ENV==='production') {
   navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(reg=>{
    if(reg.waiting)setWaiting(reg.waiting);
    reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)setWaiting(worker)})});
   }).catch(()=>{});
  }
  return()=>{window.removeEventListener('online',updateOnline);window.removeEventListener('offline',updateOnline);window.removeEventListener('beforeinstallprompt',onInstall)};
 },[]);
 const applyUpdate=()=>{navigator.serviceWorker.addEventListener('controllerchange',()=>window.location.reload(),{once:true});waiting?.postMessage({type:'SKIP_WAITING'});setWaiting(null)};
 return <>{offline&&<div className="pwa-install" role="status"><WifiOff size={14}/>Bạn đang offline. Các bộ đã lưu vẫn chơi được.</div>}{(install||ios)&&<div className="pwa-install"><button onClick={async()=>{if(install){await install.prompt();await install.userChoice;setInstall(null)}else setHelp(!help)}}><Download size={15}/>Thêm vào màn hình chính</button>{help&&<span>Safari: Chia sẻ → Thêm vào MH chính.</span>}</div>}{waiting&&<div className="pwa-toast" role="status"><span>Có phiên bản mới. Cập nhật sau ván này nhé.</span><button onClick={applyUpdate}>Cập nhật</button><button aria-label="Để sau" onClick={()=>setWaiting(null)}><X size={16}/></button></div>}</>;
}
export function OfflinePack({pack}:{pack:Pack}){
 const [state,setState]=useState<'idle'|'saving'|'saved'|'error'|'unsupported'>('idle');
 useEffect(()=>{if(!('serviceWorker' in navigator)||process.env.NODE_ENV!=='production'){setState('unsupported');return;}try{const saved=JSON.parse(localStorage.getItem('tod:offline:v1')||'[]') as {id:string;version:string}[];if(saved.some(p=>p.id===pack.id&&p.version===pack.contentVersion))setState('saved')}catch{}},[pack.id,pack.contentVersion]);
 async function save(){
  setState('saving');
  try{
   const reg=await Promise.race([navigator.serviceWorker.ready,new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('timeout')),8000))]);
   if(!reg.active)throw new Error('no worker');
   const channel=new MessageChannel();
   await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('timeout')),45000);channel.port1.onmessage=event=>{clearTimeout(timer);event.data.success?resolve():reject(new Error('save'))};reg.active!.postMessage({type:'CACHE_PACK',pack:{id:pack.id,title:pack.title,slug:pack.slug,version:pack.contentVersion,file:pack.questionFile}},[channel.port2])});
   const saved=JSON.parse(localStorage.getItem('tod:offline:v1')||'[]') as {id:string;title:string;slug:string;version:string}[];
   localStorage.setItem('tod:offline:v1',JSON.stringify([...saved.filter(p=>p.id!==pack.id),{id:pack.id,title:pack.title,slug:pack.slug,version:pack.contentVersion}]));setState('saved');
  }catch{setState('error')}
 }
 if(state==='unsupported')return null;
 return <div className="offline-pack"><button onClick={save} disabled={state==='saving'}>{state==='saved'?<Check size={14}/>:<Download size={14}/>} {state==='saving'?'Đang lưu bộ và màn chơi…':state==='saved'?'Đã lưu để chơi offline · Lưu lại':'Lưu bộ để chơi offline'}</button>{state==='error'&&<p role="status">Chưa lưu được. Kiểm tra kết nối và thử lại nhé.</p>}{state==='saved'&&<p>Bộ premium vẫn cần quyền mua để chơi ngoài 8 câu thử.</p>}</div>;
}

export function OfflineAiPack(){
 const [state,setState]=useState<'idle'|'saving'|'saved'|'error'>('idle');
 const [supported,setSupported]=useState(false);
 useEffect(()=>setSupported('serviceWorker' in navigator&&process.env.NODE_ENV==='production'),[]);
 if(!supported)return null;
 async function save(){
  setState('saving');
  try{
   const reg=await Promise.race([navigator.serviceWorker.ready,new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('timeout')),8000))]);
   if(!reg.active)throw new Error('no worker');const channel=new MessageChannel();
   await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('timeout')),45000);channel.port1.onmessage=event=>{clearTimeout(timer);event.data.success?resolve():reject(new Error('save'))};reg.active!.postMessage({type:'CACHE_AI_SHELL'},[channel.port2])});
   setState('saved');
  }catch{setState('error')}
 }
 return <div className="offline-pack"><button disabled={state==='saving'} onClick={save}>{state==='saved'?<Check size={14}/>:<Download size={14}/>} {state==='saving'?'Đang lưu màn chơi…':state==='saved'?'Đã sẵn sàng chơi bộ này offline':'Lưu màn chơi để dùng bộ AI offline'}</button>{state==='error'&&<p role="status">Chưa lưu được màn chơi. Kiểm tra kết nối rồi thử lại.</p>}{state==='saved'&&<p>Giữ dữ liệu trình duyệt để mở lại bộ riêng của nhóm.</p>}</div>;
}
