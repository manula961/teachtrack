import test from 'node:test'
import assert from 'node:assert/strict'
import {composite,recommendedPathway} from '../lib/teacherInsights.ts'
import {csvCell} from '../lib/exportCsv.ts'
const teacher={id:1,name:'Example Teacher'}
test('missing evidence has no positive score',()=>{
 const r=composite({},teacher)
 assert.equal(r.assessed,false);assert.equal(r.score,0);assert.equal(r.evidenceCount,0)
})
test('attendance is calculated from actual records',()=>{
 const r=composite({attendance:[{teacher_id:1,status:'Present'},{teacher_id:1,status:'Absent'}]},teacher)
 assert.equal(r.score,50);assert.equal(r.assessed,true)
})
test('lesson drafts do not count as approved',()=>{
 const r=composite({lessons:[{teacher_id:1,status:'Approved'},{teacher_id:1,status:'Pending'}]},teacher)
 assert.equal(r.score,50)
})
test('completed training is counted in hours',()=>{
 const r=composite({training:[{teacher_id:1,status:'Completed',hours:20},{teacher_id:1,status:'Upcoming',hours:100}]},teacher)
 assert.equal(r.score,50)
})
test('another teacher does not contribute to score',()=>{
 assert.equal(composite({feedback:[{teacher_id:2,rating:5}]},teacher).assessed,false)
})
test('no evidence prompts baseline collection',()=>{
 assert.match(recommendedPathway({},teacher).steps[0],/baseline/i)
})
test('CSV formula prefixes are escaped',()=>{
 assert.equal(csvCell('=2+2'),`"'=2+2"`)
 assert.equal(csvCell(-123),`"-123"`)
})
