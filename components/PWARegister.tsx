'use client'
import { useEffect } from 'react'

export function PWARegister(){
  useEffect(()=>{
    if(!('serviceWorker' in navigator)) return

    const isLocal =
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1'

    if(isLocal){
      navigator.serviceWorker.getRegistrations()
        .then(regs=>Promise.all(regs.map(reg=>reg.unregister())))
        .catch(()=>{})
      if('caches' in window){
        caches.keys()
          .then(keys=>Promise.all(keys.map(key=>caches.delete(key))))
          .catch(()=>{})
      }
      return
    }

    const register=()=>navigator.serviceWorker
      .register('/sw.js',{scope:'/'})
      .then(reg=>reg.update())
      .catch(err=>console.warn('TeachTrack service worker registration failed',err))

    if(document.readyState==='complete') register()
    else window.addEventListener('load',register,{once:true})
  },[])

  return null
}
