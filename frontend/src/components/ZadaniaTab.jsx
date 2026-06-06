import TasksTab from './TasksTab'
import CalendarTab from './CalendarTab'
import FilesTab from './FilesTab'
import TeamPanel from './TeamPanel'

export default function ZadaniaTab({ user, meta, campId, initialSubTab }) {
  const subTab = initialSubTab || 'tasks'

  return (
    <>
      {subTab === 'tasks'    && <TasksTab user={user} meta={meta} campId={campId} />}
      {subTab === 'calendar' && <CalendarTab user={user} meta={meta} campId={campId} />}
      {subTab === 'files'    && <FilesTab user={user} campId={campId} />}
      {subTab === 'team'     && <TeamPanel user={user} campId={campId} />}
    </>
  )
}
