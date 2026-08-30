'use client'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function DemoTourBubble(){
 return <Link href="/tour" className="login-demo-tour-bubble" aria-label="Open TeachTrack demo tour" title="Open demo tour">
   <span className="login-demo-tour-icon"><Sparkles size={20}/></span>
   <span><small>DEMO TOUR</small><b>Explore TeachTrack</b></span>
 </Link>
}
