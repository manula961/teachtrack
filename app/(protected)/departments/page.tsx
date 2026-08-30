'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { Building2, Link2, Pencil, Plus, Search, Trash2, Unlink } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { TeacherPicker } from '@/components/TeacherPicker'

export default function DepartmentsPage() {
  const { data, loading, role, insert, update, remove } = useData()
  const leadership = ['principal', 'vice_principal'].includes(role)
  const departments = data.departments || []
  const classes = data.timetable_classes || []
  const teachers = data.teachers_dashboard || []

  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [departmentOpen, setDepartmentOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<any | null>(null)
  const [manageDepartment, setManageDepartment] = useState<any | null>(null)
  const [classOpen, setClassOpen] = useState(false)
  const [classQuery, setClassQuery] = useState('')

  const teacherById = useMemo(
    () => new Map(teachers.map((t: any) => [Number(t.id), t])),
    [teachers]
  )

  const assignedClasses = useMemo(() => {
    if (!manageDepartment) return []
    return classes
      .filter((c: any) => Number(c.department_id) === Number(manageDepartment.id))
      .sort((a: any, b: any) =>
        String(a.grade).localeCompare(String(b.grade), undefined, { numeric: true }) ||
        String(a.section).localeCompare(String(b.section))
      )
  }, [classes, manageDepartment])

  const availableClasses = useMemo(() => {
    const q = classQuery.trim().toLowerCase()
    return classes
      .filter((c: any) => !c.department_id)
      .filter((c: any) => {
        if (!q) return true
        return [
          c.name,
          c.grade,
          c.section,
          c.medium,
          c.academic_year,
        ].some(v => String(v ?? '').toLowerCase().includes(q))
      })
      .slice(0, 30)
  }, [classes, classQuery])

  async function createDepartment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const fd = new FormData(e.currentTarget)

    const payload: any = {
      name: String(fd.get('name') || '').trim(),
    }

    const head = String(fd.get('head_teacher_id') || '').trim()
    const description = String(fd.get('description') || '').trim()
    if (head) payload.head_teacher_id = Number(head)
    if (description) payload.description = description

    try {
      if (editingDepartment) {
        await update('departments', editingDepartment.id, payload)
        setMessage('Department updated successfully.')
      } else {
        await insert('departments', payload)
        setMessage('Department created successfully.')
      }
      setDepartmentOpen(false)
      setEditingDepartment(null)
    } catch (err: any) {
      setMessage([err?.message, err?.details, err?.hint].filter(Boolean).join(' · ') || 'Unable to create department.')
    } finally {
      setBusy(false)
    }
  }

  async function assignClass(classRow: any) {
    if (!manageDepartment) return
    setBusy(true)
    setMessage('')
    try {
      await update('timetable_classes', classRow.id, {
        department_id: manageDepartment.id,
      })
      setMessage(`${classRow.name} added to ${manageDepartment.name}.`)
      setClassQuery('')
    } catch (err: any) {
      setMessage([err?.message, err?.details, err?.hint].filter(Boolean).join(' · ') || 'Unable to add class.')
    } finally {
      setBusy(false)
    }
  }

  async function unassignClass(classRow: any) {
    setBusy(true)
    setMessage('')
    try {
      await update('timetable_classes', classRow.id, {
        department_id: null,
      })
      setMessage(`${classRow.name} removed from the department.`)
    } catch (err: any) {
      setMessage([err?.message, err?.details, err?.hint].filter(Boolean).join(' · ') || 'Unable to remove class.')
    } finally {
      setBusy(false)
    }
  }

  async function createClass(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!manageDepartment) return
    setBusy(true)
    setMessage('')
    const fd = new FormData(e.currentTarget)

    const payload = {
      name: String(fd.get('name') || '').trim(),
      grade: String(fd.get('grade') || ''),
      section: String(fd.get('section') || '').trim(),
      medium: String(fd.get('medium') || 'Sinhala'),
      class_teacher_id: null,
      student_count: Number(fd.get('student_count') || 50),
      academic_year: Number(fd.get('academic_year') || new Date().getFullYear()),
      department_id: manageDepartment.id,
    }

    try {
      await insert('timetable_classes', payload)
      setClassOpen(false)
      setMessage(`Class ${payload.name} created inside ${manageDepartment.name}.`)
    } catch (err: any) {
      setMessage([err?.message, err?.details, err?.hint].filter(Boolean).join(' · ') || 'Unable to create class.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="loading">Loading departments…</div>

  return <>
    <div className="page-head">
      <div>
        <span className="eyebrow"><i className="dot"/>Academic structure</span>
        <h1 style={{ marginTop: 14 }}>Departments & classes</h1>
        <p>Create departments, assign department leadership, and manage the classes attached to each department.</p>
      </div>
      {leadership && (
        <button className="btn btn-primary" onClick={() => { setEditingDepartment(null); setDepartmentOpen(true) }}>
          <Plus size={16}/> Add department
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
              <th>Department</th>
              <th>Head teacher</th>
              <th>Description</th>
              <th>Classes</th>
              {leadership && <th/>}
            </tr>
          </thead>
          <tbody>
            {departments.map((department: any) => {
              const head = department.head_teacher_id
                ? teacherById.get(Number(department.head_teacher_id))
                : null
              const departmentClasses = classes.filter(
                (c: any) => Number(c.department_id) === Number(department.id)
              )

              return (
                <tr key={department.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Building2 size={16}/>
                      <b>{department.name}</b>
                    </div>
                  </td>
                  <td>
                    {head ? (
                      <div>
                        <b>{head.teacher_code || `ID ${head.id}`}</b>
                        <div style={{ fontSize: 12, opacity: .72 }}>{head.name}</div>
                      </div>
                    ) : department.head_teacher_id ? `ID ${department.head_teacher_id}` : '—'}
                  </td>
                  <td>{department.description || '—'}</td>
                  <td>
                    <b>{departmentClasses.length}</b>
                    <span style={{ opacity: .65 }}> class{departmentClasses.length === 1 ? '' : 'es'}</span>
                  </td>
                  {leadership && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn"
                          onClick={() => {
                            setEditingDepartment(department)
                            setDepartmentOpen(true)
                          }}
                          title="Edit department"
                        >
                          <Pencil size={14}/> Edit
                        </button>
                        <Link className="btn" href={`/department-insights?department=${department.id}`} title="Open department dashboard">
                          Dashboard
                        </Link>
                        <button
                          className="btn"
                          onClick={() => {
                            setManageDepartment(department)
                            setClassQuery('')
                          }}
                        >
                          <Link2 size={14}/> Manage classes
                        </button>
                        <button
                          className="btn"
                          onClick={() => remove('departments', department.id)}
                          title="Delete department"
                        >
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
        {!departments.length && <div className="empty">No departments yet.</div>}
      </div>
    </section>

    {departmentOpen && (
      <div className="modal-backdrop" onMouseDown={e => {
        if (e.currentTarget === e.target) setDepartmentOpen(false)
      }}>
        <div className="modal" role="dialog" aria-modal="true">
          <div className="panel-head">
            <div><small>ACADEMIC STRUCTURE</small><h2>{editingDepartment ? 'Edit department' : 'Add department'}</h2></div>
            <button className="btn" onClick={() => { setDepartmentOpen(false); setEditingDepartment(null) }}>Close</button>
          </div>
          <form className="form-grid" onSubmit={createDepartment}>
            <div className="field">
              <label>DEPARTMENT NAME</label>
              <input name="name" required placeholder="e.g. Mathematics" defaultValue={editingDepartment?.name || ''}/>
            </div>
            <div className="field">
              <label>HEAD TEACHER / HOS</label>
              <TeacherPicker name="head_teacher_id" defaultValue={editingDepartment?.head_teacher_id || null} placeholder="Search HOS by teacher code, ID or name…"/>
            </div>
            <div className="field full">
              <label>DESCRIPTION</label>
              <textarea name="description" rows={4} placeholder="Optional department description" defaultValue={editingDepartment?.description || ''}/>
            </div>
            <button className="btn btn-primary full" disabled={busy}>
              {busy ? 'Saving…' : editingDepartment ? 'Save changes' : 'Create department'}
            </button>
          </form>
        </div>
      </div>
    )}

    {manageDepartment && (
      <div className="modal-backdrop" onMouseDown={e => {
        if (e.currentTarget === e.target) setManageDepartment(null)
      }}>
        <div className="modal" style={{ width: 'min(900px, 94vw)', maxWidth: 900 }} role="dialog" aria-modal="true">
          <div className="panel-head">
            <div>
              <small>DEPARTMENT CLASSES</small>
              <h2>{manageDepartment.name}</h2>
              <p>{assignedClasses.length} class{assignedClasses.length === 1 ? '' : 'es'} assigned</p>
            </div>
            <button className="btn" onClick={() => setManageDepartment(null)}>Close</button>
          </div>

          {leadership && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              <button className="btn btn-primary" onClick={() => setClassOpen(true)}>
                <Plus size={15}/> Create class
              </button>
            </div>
          )}

          <section className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-head">
              <div><h3>Assigned classes</h3><p>Classes currently linked to this department.</p></div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Class</th><th>Grade</th><th>Section</th><th>Medium</th><th>Students</th>{leadership && <th/>}</tr>
                </thead>
                <tbody>
                  {assignedClasses.map((c: any) => (
                    <tr key={c.id}>
                      <td><b>{c.name}</b></td>
                      <td>{c.grade || '—'}</td>
                      <td>{c.section || '—'}</td>
                      <td>{c.medium || '—'}</td>
                      <td>{c.student_count ?? 0}</td>
                      {leadership && (
                        <td>
                          <button className="btn" onClick={() => unassignClass(c)} disabled={busy}>
                            <Unlink size={14}/> Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!assignedClasses.length && <div className="empty">No classes assigned to this department yet.</div>}
            </div>
          </section>

          {leadership && (
            <section className="panel">
              <div className="panel-head">
                <div><h3>Add existing class</h3><p>Search unassigned classes and attach one to this department.</p></div>
              </div>
              <div className="field">
                <label>SEARCH CLASSES</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 13, opacity: .55 }}/>
                  <input
                    value={classQuery}
                    onChange={e => setClassQuery(e.target.value)}
                    placeholder="Search class, grade, section or medium…"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto', marginTop: 10 }}>
                {availableClasses.map((c: any) => (
                  <div
                    key={c.id}
                    className="metric"
                    style={{ gap: 14, alignItems: 'center', paddingBlock: 10 }}
                  >
                    <span>
                      <b>{c.name}</b>
                      <small style={{ display: 'block', opacity: .65 }}>
                        {c.grade || '—'} · Section {c.section || '—'} · {c.medium || '—'} · {c.student_count ?? 0} students
                      </small>
                    </span>
                    <button className="btn" onClick={() => assignClass(c)} disabled={busy}>
                      <Plus size={14}/> Add
                    </button>
                  </div>
                ))}
                {!availableClasses.length && (
                  <div className="empty">No unassigned classes match this search.</div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    )}

    {manageDepartment && classOpen && (
      <div className="modal-backdrop" style={{ zIndex: 1002 }}>
        <div className="modal" role="dialog" aria-modal="true">
          <div className="panel-head">
            <div>
              <small>{manageDepartment.name.toUpperCase()}</small>
              <h2>Create class</h2>
            </div>
            <button className="btn" onClick={() => setClassOpen(false)}>Close</button>
          </div>

          <form className="form-grid" onSubmit={createClass}>
            <div className="field">
              <label>CLASS NAME</label>
              <input name="name" required placeholder="e.g. Grade 8 - A"/>
            </div>

            <div className="field">
              <label>GRADE</label>
              <select name="grade" defaultValue="Grade 6" required>
                {Array.from({ length: 13 }, (_, i) => (
                  <option key={i + 1}>Grade {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>SECTION</label>
              <input name="section" required placeholder="e.g. A"/>
            </div>

            <div className="field">
              <label>MEDIUM</label>
              <select name="medium" defaultValue="Sinhala" required>
                <option>Sinhala</option>
                <option>Tamil</option>
                <option>English</option>
              </select>
            </div>

            <div className="field">
              <label>STUDENT COUNT</label>
              <input name="student_count" type="number" min="0" defaultValue={50}/>
            </div>

            <div className="field">
              <label>ACADEMIC YEAR</label>
              <input name="academic_year" type="number" defaultValue={new Date().getFullYear()}/>
            </div>

            <button className="btn btn-primary full" disabled={busy}>
              {busy ? 'Saving…' : 'Create class in department'}
            </button>
          </form>
        </div>
      </div>
    )}
  </>
}
