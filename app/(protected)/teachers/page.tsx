'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { useData } from '@/components/DataProvider'

export default function Teachers() {
  const { loading, data, role, insert, update } = useData()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const leadership = ['principal', 'vice_principal'].includes(role)

  const rows = useMemo(
    () => (data.teachers_dashboard || []).filter((t: any) =>
      JSON.stringify(t).toLowerCase().includes(q.toLowerCase())
    ),
    [data, q]
  )

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(teacher: any) {
    setEditing(teacher)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditing(null)
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setMessage('')

    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '')

    const payload = {
      name,
      initials: name.split(' ').map(x => x[0]).join('').slice(0, 3).toUpperCase(),
      email: String(f.get('email') || ''),
      subject: String(f.get('subject') || ''),
      department: String(f.get('department') || ''),
      section: String(f.get('section') || ''),
      experience: Number(f.get('experience') || 0),
      qualification: String(f.get('qualification') || ''),
      skills: String(f.get('skills') || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      status: String(f.get('status') || 'Active')
    }

    try {
      if (editing) {
        await update('teachers', editing.id, payload)
        setMessage('Teacher updated successfully.')
      } else {
        await insert('teachers', payload)
        setMessage('Teacher created successfully.')
      }
      closeModal()
    } catch (err: any) {
      setMessage(err?.message || 'Unable to save teacher.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="loading">Loading teachers…</div>

  return <>
    <div className="page-head">
      <div>
        <span className="eyebrow"><i className="dot"/>Faculty directory</span>
        <h1>Teacher profiles</h1>
        <p>Qualifications, specialties, school section, career information and performance at a glance.</p>
      </div>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Search name, code, ID, section…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        {leadership && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16}/> Add teacher
          </button>
        )}
      </div>
    </div>

    {message && (
      <div className="command" style={{ marginBottom: 18 }}>
        <div><small>STATUS</small><b>{message}</b></div><i className="pulse"/>
      </div>
    )}

    <div className="cards">
      {rows.map((t: any) => (
        <article className="person-card" key={t.id}>
          <div className="person-top">
            <div className="avatar">{t.initials}</div>
            <div style={{ flex: 1 }}>
              <h3>{t.name}</h3>
              <p>
                <b>{t.teacher_code || `TCH-${String(t.id).padStart(4, '0')}`}</b>
                {' · '}ID {t.id}
              </p>
              <p>{t.subject} · {t.department}</p>
              <p><b>Section:</b> {t.section || 'Not assigned'}</p>
            </div>

            {leadership && (
              <button
                className="btn"
                onClick={() => openEdit(t)}
                title="Edit teacher"
                aria-label={`Edit ${t.name}`}
              >
                <Pencil size={15}/>
              </button>
            )}
          </div>

          <div className="tags">
            {(t.skills || []).slice(0, 4).map((s: string) => (
              <span className="tag" key={s}>{s}</span>
            ))}
          </div>

          <div className="metric"><span>Performance</span><b>{t.performance_score ?? 0}%</b></div>
          <div className="progress">
            <span style={{ width: `${Math.min(Number(t.performance_score || 0), 100)}%` }}/>
          </div>
          <div className="metric"><span>Attendance</span><b>{t.attendance_score ?? 100}%</b></div>
          <div className="metric"><span>Feedback</span><b>{t.feedback_score ?? 0}/5</b></div>
          <p>{t.experience} years experience · {t.qualification}</p>
          <Link className="btn" href={`/teacher-360?teacher=${t.id}`}>View 360° profile →</Link>
        </article>
      ))}
    </div>

    {open && (
      <div
        className="modal-backdrop"
        onMouseDown={e => {
          if (e.currentTarget === e.target) closeModal()
        }}
      >
        <div className="modal" role="dialog" aria-modal="true">
          <div className="panel-head">
            <div>
              <small>FACULTY DIRECTORY</small>
              <h2>{editing ? 'Edit teacher' : 'Add teacher'}</h2>
            </div>
            <button className="btn" onClick={closeModal}>Close</button>
          </div>

          <form
            key={editing?.id || 'new'}
            className="form-grid"
            onSubmit={submit}
          >
            <div className="field">
              <label>FULL NAME</label>
              <input name="name" required defaultValue={editing?.name || ''}/>
            </div>

            <div className="field">
              <label>EMAIL</label>
              <input name="email" type="email" required defaultValue={editing?.email || ''}/>
            </div>

            <div className="field">
              <label>SUBJECT</label>
              <input name="subject" required defaultValue={editing?.subject || ''}/>
            </div>

            <div className="field">
              <label>DEPARTMENT</label>
              <input name="department" required defaultValue={editing?.department || ''}/>
            </div>

            <div className="field">
              <label>SECTION</label>
              <input
                name="section"
                list="teacher-sections"
                placeholder="e.g. Senior Secondary"
                defaultValue={editing?.section || ''}
              />
              <datalist id="teacher-sections">
                <option value="Primary"/>
                <option value="Junior Secondary"/>
                <option value="Senior Secondary"/>
                <option value="Advanced Level"/>
                <option value="Special Education"/>
              </datalist>
            </div>

            <div className="field">
              <label>EXPERIENCE (YEARS)</label>
              <input
                name="experience"
                type="number"
                min="0"
                required
                defaultValue={editing?.experience ?? 0}
              />
            </div>

            <div className="field">
              <label>QUALIFICATION</label>
              <input name="qualification" required defaultValue={editing?.qualification || ''}/>
            </div>

            <div className="field">
              <label>STATUS</label>
              <select name="status" defaultValue={editing?.status || 'Active'}>
                <option>Active</option>
                <option>Inactive</option>
                <option>On Leave</option>
              </select>
            </div>

            <div className="field full">
              <label>SKILLS (COMMA SEPARATED)</label>
              <input
                name="skills"
                defaultValue={(editing?.skills || []).join(', ')}
                placeholder="Classroom Management, ICT, Mentoring"
              />
            </div>

            <button className="btn btn-primary full" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create teacher'}
            </button>
          </form>
        </div>
      </div>
    )}
  </>
}
