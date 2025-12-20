import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, FileText, Clock } from 'lucide-react'
import { useStore } from '../../store'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'

export function TeachingFlowSection() {
  const navigate = useNavigate()
  const { projects, loadProjects, enterProject, exitProject, deleteProject, loadUsageRecords, usageRecords } = useStore()
  const [usageModalProject, setUsageModalProject] = useState<string | null>(null)
  const [usageLoading, setUsageLoading] = useState(false)

  React.useEffect(() => {
    loadProjects().catch(() => {})
  }, [loadProjects])

  const openUsageModal = async (projectId: string) => {
    setUsageModalProject(projectId)
    setUsageLoading(true)
    try {
      await loadUsageRecords({ projectId })
    } catch (e: any) {
      alert(e?.message || '無法載入紀錄')
    } finally {
      setUsageLoading(false)
    }
  }

  const usageForProject = useMemo(
    () => usageRecords.filter((u) => u.project_id === usageModalProject),
    [usageRecords, usageModalProject],
  )

  return (
    <div className="space-y-8">
      <div id="teacher-projects-section" className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">管理與設計學生的文獻探討學習路徑</p>
          <h1 className="text-2xl font-bold text-gray-900">教學流程管理</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              exitProject()
              navigate('/teacher/designer')
            }}
          >
            建立新流程
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((p) => (
          <GlassCard key={p.id} className="p-6" hoverEffect>
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2 flex-1">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  已發布
                </span>
                <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                <p className="text-gray-500 text-sm">{p.semester || '未指定學期'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-500 text-sm mb-4">
              <span className="flex items-center gap-1">
                <Users size={16} /> -
              </span>
              <span className="flex items-center gap-1">
                <FileText size={16} /> {p.nodes.length} 個 AI 節點
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-4">
              最後編輯：{new Date(p.updatedAt || Date.now()).toLocaleDateString('zh-TW')}
            </div>
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await enterProject(p.id)
                  navigate('/teacher/designer')
                }}
              >
                編輯
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openUsageModal(p.id)}
                leftIcon={<Clock size={14} />}
              >
                紀錄
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (!window.confirm('確定要刪除這個流程嗎？')) return
                  try {
                    await deleteProject(p.id)
                  } catch (e: any) {
                    alert(e?.message || '刪除失敗')
                  }
                }}
              >
                刪除
              </Button>
            </div>
          </GlassCard>
        ))}
        <GlassCard
          className="p-6 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-violet-400 transition-colors min-h-[200px]"
          onClick={() => {
            exitProject()
            navigate('/teacher/designer')
          }}
          hoverEffect
        >
          <div className="text-center text-gray-500">
            <Plus className="mx-auto mb-2" size={32} />
            <div className="font-medium">建立新的流程</div>
          </div>
        </GlassCard>
      </div>

      {/* Usage Modal */}
      {usageModalProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-violet-600" />
                <span className="font-bold text-gray-900">使用紀錄</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setUsageModalProject(null)}>
                關閉
              </Button>
            </div>
            <div className="overflow-auto max-h-[70vh]">
              {usageLoading && <div className="text-gray-500 text-sm">載入中...</div>}
              {!usageLoading && usageForProject.length === 0 && (
                <div className="text-gray-500 text-sm">尚無使用紀錄。</div>
              )}
              {!usageLoading && usageForProject.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">學生</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">任務類型</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">提交時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageForProject.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">{u.user.name}</td>
                          <td className="py-3 px-4">{u.task_type}</td>
                          <td className="py-3 px-4">
                            {new Date(u.created_at).toLocaleString('zh-TW')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

