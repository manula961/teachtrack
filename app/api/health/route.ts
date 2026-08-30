export const runtime = 'nodejs'
export async function GET() {
  return Response.json({ ok: true, app: 'TeachTrack Pro', runtime: 'nodejs', timestamp: new Date().toISOString() })
}
