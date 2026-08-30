'use client'

import Link from 'next/link'
import { useData } from '@/components/DataProvider'

export default function CmsDashboard() {
  const { data, loading, role } = useData()
  if (loading) return <div className="loading">Loading CMS…</div>

  const teachers = data.teachers_dashboard || []
  const lessons = data.lessons || []
  const observations = data.observations || []
  const training = data.training || []
  const pendingLessons = lessons.filter((x:any) => String(x.status || '').toLowerCase() === 'pending')
  const activeTeachers = teachers.filter((x:any) => String(x.status || 'active').toLowerCase() !== 'inactive')

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow"><i className="dot"/>Private CMS</span>
          <h1 style={{ marginTop: 14 }}>Management command center</h1>
          <p>School-wide control and review tools. This page is not linked from the teacher application.</p>
        </div>
        <span className="status good">{String(role || 'authorized').toUpperCase()}</span>
      </div>

      <section className="kpis">
        <div className="kpi"><small>ACTIVE TEACHERS</small><b>{activeTeachers.length}</b><span>Profiles under management</span></div>
        <div className="kpi"><small>PENDING LESSONS</small><b>{pendingLessons.length}</b><span>Waiting for review</span></div>
        <div className="kpi"><small>OBSERVATIONS</small><b>{observations.length}</b><span>Recorded classroom reviews</span></div>
        <div className="kpi"><small>TRAINING RECORDS</small><b>{training.length}</b><span>Development activities</span></div>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="panel-head"><div><small>CMS MODULES</small><h2>Manage school data</h2><p>Open the operational area you need.</p></div></div>
          <div className="cms-actions">
            {['principal','vice_principal'].includes(String(role)) && <Link className="cms-action" href="/cms/users"><b>User control</b><span>Accounts, roles and access permissions →</span></Link>}
            {!['reviewer','section_head'].includes(String(role)) && <Link className="cms-action" href="/teachers"><b>Teacher records</b><span>Profiles, departments and career data →</span></Link>}
            {!['reviewer','section_head'].includes(String(role)) && <Link className="cms-action" href="/attendance"><b>Attendance control</b><span>Record punctuality and attendance →</span></Link>}
            <Link className="cms-action" href="/lessons"><b>Lesson review</b><span>Review and approve lesson plans →</span></Link>
            {!['reviewer','section_head'].includes(String(role)) && <Link className="cms-action" href="/observations"><b>Classroom observations</b><span>Performance reviews and notes →</span></Link>}
            {!['reviewer','section_head'].includes(String(role)) && <Link className="cms-action" href="/development"><b>Development plans</b><span>Recommendations and growth paths →</span></Link>}
            {!['reviewer','section_head'].includes(String(role)) && <Link className="cms-action" href="/achievements"><b>Recognition</b><span>Awards, badges and milestones →</span></Link>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><small>REVIEW QUEUE</small><h2>Pending lesson plans</h2><p>Items that may need management attention.</p></div><span className="status">{pendingLessons.length} pending</span></div>
          {pendingLessons.length ? (
            <div className="cms-queue">
              {pendingLessons.slice(0, 6).map((item:any) => (
                <div className="queue-row" key={item.id}>
                  <div><b>{item.title || 'Untitled lesson'}</b><small>{item.subject || item.teacher_name || 'Lesson plan'}</small></div>
                  <Link className="btn" href="/lessons">Review</Link>
                </div>
              ))}
            </div>
          ) : <div className="empty">No lesson plans are waiting for review.</div>}
          <div className="command" style={{ marginTop: 18 }}><div><small>CMS status</small><b>Management systems active</b></div><i className="pulse"/></div>
        </div>
      </section>
    </>
  )
}
