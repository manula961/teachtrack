export type Row = Record<string, any>

export function teacherRows(data: Record<string, Row[]>, teacherId: any) {
  const id = String(teacherId ?? '')
  const own = (table: string) => (data[table] || []).filter((r: Row) => String(r.teacher_id) === id)
  return {
    attendance: own('attendance'),
    training: own('training'),
    feedback: own('feedback'),
    lessons: own('lessons'),
    achievements: own('achievements'),
    goals: own('goals'),
    observations: own('observations'),
    recommendations: own('development_recommendations'),
    plans: own('development_plans'),
    service: own('teacher_service_history'),
    documents: own('teacher_documents'),
    leave: own('leave_requests'),
    duties: own('duty_roster'),
    exams: own('exam_responsibilities'),
    timetable: own('timetable_entries'),
  }
}

export function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)))
}

export function composite(data: Record<string, Row[]>, teacher: Row) {
  const own = teacherRows(data, teacher.id)
  const attendanceKnown = own.attendance.length > 0
  const present = own.attendance.filter(x => x.status === 'Present').length
  const late = own.attendance.filter(x => x.status === 'Late').length
  const attendance = attendanceKnown ? clamp(((present + late) / own.attendance.length) * 100) : 0
  const punctuality = attendanceKnown ? clamp((present / own.attendance.length) * 100) : 0

  const feedbackKnown = own.feedback.length > 0
  const feedback = feedbackKnown
    ? clamp((own.feedback.reduce((s, x) => s + Number(x.rating || 0), 0) / own.feedback.length) / 5 * 100)
    : 0
  const observationKnown = own.observations.length > 0
  const observation = observationKnown
    ? clamp((own.observations.reduce((s, x) => s + Number(x.rating || 0), 0) / own.observations.length) / 5 * 100)
    : 0
  const lessonKnown = own.lessons.length > 0
  const lesson = lessonKnown
    ? clamp(own.lessons.filter(x => x.status === 'Approved').length / own.lessons.length * 100)
    : 0
  const completedTraining = own.training.filter(x => x.status === 'Completed')
  const trainingKnown = completedTraining.length > 0
  const training = trainingKnown
    ? clamp(completedTraining.reduce((sum, x) => sum + Number(x.hours || 0), 0) / 40 * 100)
    : 0
  const achievementKnown = own.achievements.length > 0
  const achievement = achievementKnown ? clamp(own.achievements.length * 18) : 0

  const metrics = [
    { label: 'Attendance', value: attendance, weight: 18, assessed: attendanceKnown },
    { label: 'Punctuality', value: punctuality, weight: 12, assessed: attendanceKnown },
    { label: 'Observation', value: observation, weight: 22, assessed: observationKnown },
    { label: 'Feedback', value: feedback, weight: 16, assessed: feedbackKnown },
    { label: 'Lesson planning', value: lesson, weight: 14, assessed: lessonKnown },
    { label: 'Training', value: training, weight: 10, assessed: trainingKnown },
    { label: 'Achievements', value: achievement, weight: 8, assessed: achievementKnown },
  ]
  const evidenceWeight = metrics.reduce((sum, metric) => sum + (metric.assessed ? metric.weight : 0), 0)
  const score = evidenceWeight
    ? clamp(metrics.reduce((sum, metric) => sum + (metric.assessed ? metric.value * metric.weight : 0), 0) / evidenceWeight)
    : 0
  return { score, assessed: evidenceWeight > 0, evidenceCount: metrics.filter(x => x.assessed).length,
    totalMetrics: metrics.length, metrics, own }
}

function datedScore(items: Row[], value: (r: Row) => number, dateKey = 'date') {
  return items
    .filter(r => r[dateKey] || r.created_at)
    .map(r => ({ date: String(r[dateKey] || r.created_at).slice(0, 10), value: value(r) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function performanceTrend(data: Record<string, Row[]>, teacher: Row) {
  const own = teacherRows(data, teacher.id)
  const points = [
    ...datedScore(own.feedback, r => Number(r.rating || 0) * 20),
    ...datedScore(own.observations, r => Number(r.rating || 0) * 20),
    ...datedScore(own.attendance, r => r.status === 'Present' ? 100 : r.status === 'Late' ? 75 : 20),
  ].sort((a, b) => a.date.localeCompare(b.date))

  if (points.length < 4) return { direction: 'Stable', symbol: '→', delta: 0, points }
  const cut = Math.max(2, Math.floor(points.length / 2))
  const first = points.slice(0, cut)
  const second = points.slice(cut)
  const avg = (xs: typeof points) => xs.reduce((s, x) => s + x.value, 0) / Math.max(xs.length, 1)
  const delta = Math.round(avg(second) - avg(first))
  if (delta >= 5) return { direction: 'Improving', symbol: '↑', delta, points }
  if (delta <= -5) return { direction: 'Needs attention', symbol: '↓', delta, points }
  return { direction: 'Stable', symbol: '→', delta, points }
}

export function recommendedPathway(data: Record<string, Row[]>, teacher: Row) {
  const result = composite(data, teacher)
  const assessed = result.metrics.filter(m => m.assessed)
  const sorted = (assessed.length ? assessed : result.metrics).sort((a, b) => a.value - b.value)
  const weakest = sorted[0]
  const second = sorted[1] || sorted[0]
  const recommendations: Record<string, string[]> = {
    Attendance: ['Review attendance pattern', 'Agree an attendance support target', 'Recheck after 30 days'],
    Punctuality: ['Set a punctuality target', 'Review morning duty/travel constraints', 'Recognize sustained improvement'],
    Observation: ['Schedule coaching observation', 'Use observation rubric for one focus area', 'Repeat observation within 6 weeks'],
    Feedback: ['Review feedback themes', 'Choose one student-engagement strategy', 'Collect follow-up feedback'],
    'Lesson planning': ['Create a planning goal', 'Peer-review two lesson plans', 'Track approval/completion consistency'],
    Training: ['Identify a relevant CPD course', 'Complete certification/training', 'Record application of learning'],
    Achievements: ['Set an excellence milestone', 'Document evidence of impact', 'Nominate for recognition when achieved'],
  }
  return {
    weakest,
    second,
    steps: assessed.length ? (recommendations[weakest.label] || ['Create a focused development goal', 'Track evidence', 'Review progress']) : ['Collect baseline attendance, feedback and observation evidence', 'Record a development goal', 'Reassess after new evidence is available'],
    result,
  }
}

export function derivedAlerts(data: Record<string, Row[]>) {
  const today = new Date().toISOString().slice(0, 10)
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const alerts: Row[] = []

  for (const d of data.teacher_documents || []) {
    if (d.expiry_date && d.expiry_date >= today && d.expiry_date <= in30)
      alerts.push({ kind: 'Certificate', title: d.title || 'Document expiring', detail: `Expires ${d.expiry_date}`, teacher_id: d.teacher_id, priority: 'High' })
  }
  for (const g of data.goals || []) {
    if (g.status === 'Active' && g.due_date && g.due_date >= today && g.due_date <= in30)
      alerts.push({ kind: 'Goal', title: g.title || 'Goal deadline', detail: `Due ${g.due_date}`, teacher_id: g.teacher_id, priority: 'Medium' })
    if (g.status === 'At Risk')
      alerts.push({ kind: 'Goal', title: g.title || 'Goal at risk', detail: 'Marked At Risk', teacher_id: g.teacher_id, priority: 'High' })
  }
  for (const o of data.observations || []) {
    if (o.status === 'Follow-up')
      alerts.push({ kind: 'Observation', title: o.focus_area || 'Observation follow-up', detail: 'Follow-up required', teacher_id: o.teacher_id, priority: 'Medium' })
  }
  for (const l of data.leave_requests || []) {
    if (l.status === 'Pending')
      alerts.push({ kind: 'Leave', title: 'Leave awaiting approval', detail: `${l.start_date || ''} → ${l.end_date || ''}`, teacher_id: l.teacher_id, priority: 'Medium' })
  }
  for (const a of data.approval_requests || []) {
    if (String(a.status).toLowerCase() === 'pending')
      alerts.push({ kind: 'Approval', title: a.title || 'Approval pending', detail: a.request_type || 'Workflow item', teacher_id: a.teacher_id, priority: 'Medium' })
  }
  return alerts
}
