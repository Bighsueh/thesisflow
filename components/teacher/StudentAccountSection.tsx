import React, { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useStore } from '../../store'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function StudentAccountSection() {
  const {
    students,
    loadStudents,
    createStudent,
    bulkCreateStudents,
    updateStudent,
    deleteStudent,
  } = useStore()
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentPassword, setStudentPassword] = useState('')
  const [studentSaving, setStudentSaving] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [isBulkStudentModalOpen, setIsBulkStudentModalOpen] = useState(false)
  const [bulkClassLabel, setBulkClassLabel] = useState('')
  const [bulkPrefix, setBulkPrefix] = useState('')
  const [bulkDomain, setBulkDomain] = useState('@example.com')
  const [bulkStartNo, setBulkStartNo] = useState(1)
  const [bulkEndNo, setBulkEndNo] = useState(30)
  const [bulkZeroPad, setBulkZeroPad] = useState(2)
  const [bulkPassword, setBulkPassword] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  React.useEffect(() => {
    loadStudents().catch(() => {})
  }, [loadStudents])

  const onCreateStudent = () => {
    setEditingStudentId(null)
    setStudentName('')
    setStudentEmail('')
    setStudentPassword('')
    setIsStudentModalOpen(true)
  }

  const handleStudentSave = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      alert('請輸入姓名與 Email')
      return
    }
    setStudentSaving(true)
    try {
      if (editingStudentId) {
        const payload: { name: string; email: string; password?: string } = {
          name: studentName.trim(),
          email: studentEmail.trim(),
        }
        if (studentPassword.trim()) {
          payload.password = studentPassword.trim()
        }
        await updateStudent(editingStudentId, payload)
        await loadStudents()
        alert('已更新學生資料')
      } else {
        await createStudent({
          name: studentName.trim(),
          email: studentEmail.trim(),
          password: studentPassword || '',
        })
        await loadStudents()
      }
      setIsStudentModalOpen(false)
    } catch (e: any) {
      alert(e?.message || (editingStudentId ? '更新失敗' : '建立失敗'))
    } finally {
      setStudentSaving(false)
    }
  }

  const onEditStudent = async (id: string, prevName: string, prevEmail: string) => {
    setEditingStudentId(id)
    setStudentName(prevName)
    setStudentEmail(prevEmail)
    setStudentPassword('')
    setIsStudentModalOpen(true)
  }

  const onDeleteStudent = async (id: string) => {
    if (!window.confirm('確定要刪除此學生帳號？此動作無法復原。')) return
    try {
      await deleteStudent(id)
    } catch (e: any) {
      alert(e?.message || '刪除失敗')
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-500 text-sm">管理學生帳號與登入資訊</p>
            <h2 className="text-2xl font-bold text-gray-900">學生帳號管理</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsBulkStudentModalOpen(true)}>
              批量新增
            </Button>
            <Button size="sm" onClick={onCreateStudent} leftIcon={<Plus size={16} />}>
              新增學生
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">姓名</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">使用者名稱</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">角色</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">操作</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-3 px-4">{s.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{(s.email || '').split('@')[0]}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{s.email}</td>
                  <td className="py-3 px-4 text-xs uppercase text-gray-500">{s.role}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditStudent(s.id, s.name, s.email)}
                        leftIcon={<Pencil size={14} />}
                      >
                        編輯
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDeleteStudent(s.id)}
                        leftIcon={<Trash2 size={14} />}
                      >
                        刪除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 text-sm py-8">
                    尚未建立學生帳號。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-lg">
                {editingStudentId ? '編輯學生帳號' : '新增學生帳號'}
              </h2>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => !studentSaving && setIsStudentModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="學生姓名"
                placeholder="例如：王小明"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <Input
                label="Email（登入帳號）"
                type="email"
                placeholder="student@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
              <Input
                label="初始密碼"
                type="text"
                placeholder={editingStudentId ? '若不更改密碼，請留空' : '請輸入密碼'}
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                {editingStudentId
                  ? '若輸入新密碼，系統會將此學生密碼重設為新值；留空則不變更密碼。'
                  : '學生登入後可自行修改密碼（未實作前，可先以此密碼使用）。'}
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button variant="ghost" disabled={studentSaving} onClick={() => setIsStudentModalOpen(false)}>
                取消
              </Button>
              <Button disabled={studentSaving} onClick={handleStudentSave} isLoading={studentSaving}>
                {editingStudentId ? '儲存變更' : '建立學生'}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Bulk Student Modal */}
      {isBulkStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-lg">批量新增學生帳號</h2>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => !bulkSaving && setIsBulkStudentModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 overflow-auto flex-1">
              <p className="text-sm text-gray-600">
                透過座號範圍自動建立多個學生帳號，帳號格式為：
                <code className="mx-1 bg-gray-100 px-1 rounded text-xs">
                  {'{prefix}{座號}{domain}'}
                </code>
                ，例如：<code className="bg-gray-100 px-1 rounded text-xs">cs101_01@example.com</code>。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="顯示名稱前綴（班級名稱）"
                  placeholder="例如：113-1 資工系 A 班 座號 "
                  value={bulkClassLabel}
                  onChange={(e) => setBulkClassLabel(e.target.value)}
                />
                <div>
                  <span className="text-xs text-gray-400">
                    學生姓名會是「{bulkClassLabel || '113-1 資工系 A 班 座號 '}01」這樣的格式。
                  </span>
                </div>

                <Input
                  label="Email 前綴（帳號前半部）"
                  placeholder="例如：cs101_"
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix(e.target.value)}
                />
                <Input
                  label="Email 網域"
                  placeholder="@example.com"
                  value={bulkDomain}
                  onChange={(e) => setBulkDomain(e.target.value)}
                />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">起始座號</label>
                    <input
                      type="number"
                      className="w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 shadow-lg shadow-violet-500/5"
                      value={bulkStartNo}
                      min={1}
                      onChange={(e) => setBulkStartNo(Number(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">結束座號</label>
                    <input
                      type="number"
                      className="w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 shadow-lg shadow-violet-500/5"
                      value={bulkEndNo}
                      min={bulkStartNo}
                      onChange={(e) => setBulkEndNo(Number(e.target.value) || bulkStartNo)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">座號補 0 位數</label>
                    <input
                      type="number"
                      className="w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 shadow-lg shadow-violet-500/5"
                      value={bulkZeroPad}
                      min={1}
                      max={4}
                      onChange={(e) => setBulkZeroPad(Number(e.target.value) || 2)}
                    />
                  </div>
                </div>

                <Input
                  label="預設密碼"
                  value={bulkPassword}
                  onChange={(e) => setBulkPassword(e.target.value)}
                />
                <div>
                  <span className="text-xs text-gray-400">
                    學生登入後可改密碼（若前台未提供修改功能，可先以此固定密碼使用）。
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 border border-dashed border-gray-300 p-4 text-xs text-gray-600 space-y-1">
                <div className="font-semibold">預覽</div>
                <div>
                  座號範圍：{bulkStartNo} ~ {bulkEndNo}（共 {Math.max(0, bulkEndNo - bulkStartNo + 1)} 位）
                </div>
                <div>
                  第 1 位帳號：
                  <code className="bg-gray-100 px-1 rounded">
                    {bulkPrefix}
                    {String(bulkStartNo).padStart(bulkZeroPad, '0')}
                    {bulkDomain}
                  </code>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button variant="ghost" disabled={bulkSaving} onClick={() => setIsBulkStudentModalOpen(false)}>
                取消
              </Button>
              <Button
                disabled={
                  bulkSaving ||
                  !bulkPrefix ||
                  !bulkDomain ||
                  bulkEndNo < bulkStartNo
                }
                onClick={async () => {
                  if (bulkEndNo < bulkStartNo) {
                    alert('結束座號必須大於等於起始座號')
                    return
                  }
                  try {
                    setBulkSaving(true)
                    await bulkCreateStudents({
                      startNo: bulkStartNo,
                      endNo: bulkEndNo,
                      namePrefix: (bulkClassLabel || '學生座號 ') as string,
                      emailPrefix: bulkPrefix,
                      emailDomain: bulkDomain,
                      password: bulkPassword || '',
                      zeroPad: bulkZeroPad,
                    })
                    await loadStudents()
                    setIsBulkStudentModalOpen(false)
                  } catch (e: any) {
                    alert(e?.message || '批量新增失敗')
                  } finally {
                    setBulkSaving(false)
                  }
                }}
                isLoading={bulkSaving}
              >
                {bulkSaving
                  ? '建立中...'
                  : `建立 ${Math.max(0, bulkEndNo - bulkStartNo + 1)} 個學生帳號`}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}





