import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const origin=process.env.BASE_URL||'https://teachtrack.devoraid.com'
const routes=['/auth','/cms/login','/demo-access','/tour']
const browser=await chromium.launch({headless:true})
let failed=0
try {
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844}})
  const page=await context.newPage()
  for(const path of routes){
   const url=new URL(path,origin).toString()
   try {
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000})
    await page.waitForTimeout(300)
    const info=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,
      viewportWidth:window.innerWidth,
      heading:document.querySelector('h1')?.textContent?.trim()||'',
      textLength:document.body?.innerText?.length||0
    }))
    const ok=Boolean(response&&response.ok()&&info.textLength>80&&info.heading)
    console.log(`${ok?'PASS':'FAIL'} ${width}px ${path} HTTP ${response?.status()} h1=${JSON.stringify(info.heading)} overflow=${info.scrollWidth-info.viewportWidth}px`)
    if(!ok)failed++
    if(info.scrollWidth>info.viewportWidth+24){
      console.error(`FAIL horizontal overflow: ${width}px ${path} by ${info.scrollWidth-info.viewportWidth}px`)
      failed++
    }
    const a11y=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
    if(a11y.violations.length){
      failed += a11y.violations.length
      console.log(`A11Y ${width}px ${path}: ${a11y.violations.map(x=>x.id+':'+x.nodes.length).join(', ')}`)
      if(width===390){for(const violation of a11y.violations){for(const node of violation.nodes.slice(0,15)){console.log('A11Y DETAIL',JSON.stringify({path,rule:violation.id,target:node.target,html:node.html.slice(0,180),failure:node.failureSummary?.slice(0,370)}))}}}
    }else{
      console.log(`A11Y ${width}px ${path}: no WCAG A/AA issues detected`)
    }
   }catch(error){failed++;console.error(`FAIL ${width}px ${path}: ${error.message}`)}
  }
  await context.close()
 }
} finally { await browser.close() }
console.log(`Browser checks complete, failures: ${failed}`)
process.exitCode=failed?1:0
