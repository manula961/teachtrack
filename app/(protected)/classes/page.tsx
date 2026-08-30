'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { useData } from '@/components/DataProvider'

type Teacher = {
  id: number
  teacher_code?: string | null
  name?: string | null
  subject?: string | null
  department?: string | null
  status?: string | null
}

export default function Page() {
  const { data, loading, role, insert, update, remove } = useData()
  const leadership = ['principal', 'vice_principal'].includes(role)
  const classes = data.timetable_classes || []
  const teachers = (data.teachers_dashboard || []) as Teacher[]

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [teacherQuery, setTeacherQuery] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)
  const [editingClass, setEditingClass] = useState<any | null>(null)

  const teacherById = useMemo(
    () => new Map(teachers.map(t => [Number(t.id), t])),
    [teachers]
  )

  const teacherMatches = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase()
    if (!q) return teachers.filter(t => t.status !== 'Inactive').slice(0, 8)

    return teachers
      .filter(t => {
        const id = String(t.id ?? '').toLowerCase()
        const code = String(t.teacher_code ?? '').toLowerCase()
        const name = String(t.name ?? '').toLowerCase()
        const subject = String(t.subject ?? '').toLowerCase()
        return id.includes(q) || code.includes(q) || name.includes(q) || subject.includes(q)
      })
      .slice(0, 10)
  }, [teacherQuery, teachers])

  function chooseTeacher(t: Teacher) {
    setSelectedTeacherId(Number(t.id))
    setTeacherQuery(`${t.teacher_code || `ID ${t.id}`} — ${t.name || 'Teacher'}`)
  }

  function resetTeacher() {
    setSelectedTeacherId(null)
    setTeacherQuery('')
  }

  function openCreate() {
    setEditingClass(null)
    resetTeacher()
    setOpen(true)
  }

  function openEdit(row: any) {
    setEditingClass(row)
    const teacher = row.class_teacher_id ? teacherById.get(Number(row.class_teacher_id)) : null
    setSelectedTeacherId(row.class_teacher_id ? Number(row.class_teacher_id) : null)
    setTeacherQuery(
      teacher
        ? `${teacher.teacher_code || `ID ${teacher.id}`} — ${teacher.name || 'Teacher'}`
        : row.class_teacher_id
          ? `ID ${row.class_teacher_id}`
          : ''
    )
    setOpen(true)
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const fd = new FormData(e.currentTarget)

    const payload = {
      name: String(fd.get('name') || ''),
      grade: String(fd.get('grade') || ''),
      section: String(fd.get('section') || ''),
      medium: String(fd.get('medium') || ''),
      class_teacher_id: selectedTeacherId,
      student_count: Number(fd.get('student_count') || 0),
      academic_year: Number(fd.get('academic_year') || new Date().getFullYear()),
    }

    try {
      if (editingClass) {
        await update('timetable_classes', editingClass.id, payload)
        setMessage('Class updated successfully.')
      } else {
        await insert('timetable_classes', payload)
        setMessage('Class created successfully.')
      }
      setOpen(false)
      setEditingClass(null)
      resetTeacher()
    } catch (err: any) {
      setMessage(err?.message || 'Unable to create class.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="loading">Loading…</div>

  return <>
    <div className="page-head">
      <div>
        <span className="eyebrow"><i className="dot"/>School structure</span>
        <h1 style={{ marginTop: 14 }}>Classes & grades</h1>
        <p>Manage Grade 1–13 classes, sections, medium and class-teacher assignments.</p>
      </div>
      {leadership && (
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16}/> Add class
        </button>
      )}
    </div>

    {message && (
      <div className="command" style={{ marginBottom: 18 }}>
        <div><small>STATUS</small><b>{message}</b></div><i className="pulse"/>
      </div>
    )}

    <section className="panel">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Class</th><th>Grade</th><th>Section</th><th>Medium</th>
              <th>Class teacher</th><th>Students</th><th>Year</th>
              {leadership && <th/>}
            </tr>
          </thead>
          <tbody>
            {classes.map((r: any) => {
              const teacher = r.class_teacher_id ? teacherById.get(Number(r.class_teacher_id)) : null
              return (
                <tr key={r.id}>
                  <td>{r.name || '—'}</td>
                  <td>{r.grade || '—'}</td>
                  <td>{r.section || '—'}</td>
                  <td>{r.medium || '—'}</td>
                  <td>
                    {teacher ? (
                      <div>
                        <b>{teacher.teacher_code || `ID ${teacher.id}`}</b>
                        <div style={{ fontSize: 12, opacity: .72 }}>{teacher.name || `Teacher #${teacher.id}`}</div>
                      </div>
                    ) : r.class_teacher_id ? `ID ${r.class_teacher_id}` : '—'}
                  </td>
                  <td>{r.student_count ?? 0}</td>
                  <td>{r.academic_year || '—'}</td>
                  {leadership && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn" onClick={() => openEdit(r)} title="Edit class">
                          <Pencil size={14}/>
                        </button>
                        <button className="btn" onClick={() => remove('timetable_classes', r.id)} title="Delete class">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {!classes.length && <div className="empty">No classes yet.</div>}
      </div>
    </section>

    {open && (
      <div className="modal-backdrop" onMouseDown={e => {
        if (e.currentTarget === e.target) {
          setOpen(false)
          resetTeacher()
        }
      }}>
        <div className="modal" role="dialog" aria-modal="true">
          <div className="panel-head">
            <div><small>SCHOOL STRUCTURE</small><h2>{editingClass ? 'Edit class' : 'Add class'}</h2></div>
            <button className="btn" onClick={() => { setOpen(false); setEditingClass(null); resetTeacher() }}>Close</button>
          </div>

          <form onSubmit={submit} className="form-grid">
            <div className="field">
              <label>CLASS NAME</label>
              <input name="name" required placeholder="e.g. 10-A" defaultValue={editingClass?.name || ""}/>
            </div>

            <div className="field">
              <label>GRADE</label>
              <select key={`grade-${editingClass?.id || "new"}`} name="grade" required defaultValue={editingClass?.grade || "Grade 1"}>
                {Array.from({ length: 13 }, (_, i) => (
                  <option key={i + 1}>Grade {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>SECTION</label>
              <input name="section" placeholder="e.g. A" defaultValue={editingClass?.section || ""}/>
            </div>

            <div className="field">
              <label>MEDIUM</label>
              <select key={`medium-${editingClass?.id || "new"}`} name="medium" required defaultValue={editingClass?.medium || "Sinhala"}>
                <option>Sinhala</option><option>Tamil</option><option>English</option>
              </select>
            </div>

            <div className="field full">
              <label>CLASS TEACHER — SEARCH BY CODE, ID OR NAME</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 13, opacity: .55 }}/>
                <input
                  value={teacherQuery}
                  onChange={e => {
                    setTeacherQuery(e.target.value)
                    setSelectedTeacherId(null)
                  }}
                  placeholder="TCH-0012, 12, Kasun Perera…"
                  style={{ paddingLeft: 38 }}
                  autoComplete="off"
                />
              </div>

              {teacherQuery && !selectedTeacherId && (
                <div style={{
                  marginTop: 8,
                  border: '1px solid var(--line, #dfe4ea)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  maxHeight: 250,
                  overflowY: 'auto'
                }}>
                  {teacherMatches.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => chooseTeacher(t)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 12px',
                        background: 'transparent',
                        border: 0,
                        borderBottom: '1px solid var(--line, #edf0f3)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: 'inherit'
                      }}
                    >
                      <UserRound size={17}/>
                      <span style={{ minWidth: 92 }}><b>{t.teacher_code || `ID ${t.id}`}</b></span>
                      <span style={{ flex: 1 }}>
                        <b>{t.name || `Teacher #${t.id}`}</b>
                        <small style={{ display: 'block', opacity: .65 }}>
                          ID {t.id}{t.subject ? ` · ${t.subject}` : ''}
                        </small>
                      </span>
                    </button>
                  ))}
                  {!teacherMatches.length && (
                    <div style={{ padding: 12, opacity: .68 }}>No matching teacher found.</div>
                  )}
                </div>
              )}

              {selectedTeacherId && (
                <small style={{ display: 'block', marginTop: 7 }}>
                  Selected teacher ID: <b>{selectedTeacherId}</b>
                </small>
              )}
            </div>

            <div className="field">
              <label>STUDENT COUNT</label>
              <input key={`students-${editingClass?.id || "new"}`} name="student_count" type="number" min="0" defaultValue={editingClass?.student_count ?? 0}/>
            </div>

            <div className="field">
              <label>ACADEMIC YEAR</label>
              <input key={`year-${editingClass?.id || "new"}`} name="academic_year" type="number" defaultValue={editingClass?.academic_year || new Date().getFullYear()}/>
            </div>

            <button className="btn btn-primary full" disabled={busy}>
              {busy ? 'Saving…' : editingClass ? 'Save changes' : 'Create class'}
            </button>
          </form>
        </div>
      </div>
    )}
  </>
}
