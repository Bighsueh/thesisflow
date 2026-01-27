import { X, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { useStore } from '../../store';
import { NewTaskConfig } from '../../types';
import { ComparisonConfigPreview } from './ComparisonConfigPreview';
import { SectionConfigCard } from './SectionConfigCard';
import { StudentPreviewPanel } from './StudentPreviewPanel';

const DEFAULT_TASK_CONFIG: NewTaskConfig = {
  summary: {
    enabled: true,
    sections: [
      {
        key: 'a1_purpose',
        label: 'A1 研究目的 (Purpose)',
        placeholder: '研究問題為何？',
        minEvidence: 1,
      },
      {
        key: 'a2_method',
        label: 'A2 研究方法 (Method)',
        placeholder: '如何進行研究？',
        minEvidence: 1,
      },
      {
        key: 'a3_findings',
        label: 'A3 主要發現 (Findings)',
        placeholder: '研究發現為何？',
        minEvidence: 1,
      },
      {
        key: 'a4_limits',
        label: 'A4 研究限制 (Limitations)',
        placeholder: '研究限制為何？',
        minEvidence: 1,
      },
    ],
    guidance: '請仔細閱讀文獻後，針對以下四個面向撰寫摘要...',
  },
  comparison: {
    enabled: true,
    dimensions: ['研究目的', '研究方法', '主要發現', '研究限制'],
    guidance: '請選擇兩篇文獻進行比較...',
  },
};

interface ProjectMetadata {
  title: string;
  semester: string;
  tags: string[];
}

export default function ProjectConfigEditor() {
  const { projectId } = useParams<{ projectId?: string }>();
  const [searchParams] = useSearchParams();
  const cohortId = searchParams.get('cohortId');
  const navigate = useNavigate();
  const { projects } = useStore();

  const [metadata, setMetadata] = useState<ProjectMetadata>({ title: '', semester: '', tags: [] });
  const [config, setConfig] = useState<NewTaskConfig>(DEFAULT_TASK_CONFIG);
  const [loading, setLoading] = useState(!!projectId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'comparison'>('summary');

  useEffect(() => {
    if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setMetadata({
          title: project.title || '',
          semester: project.semester || '',
          tags: project.tags || [],
        });
        if (project.task_config) {
          setConfig(project.task_config as NewTaskConfig);
        }
        setLoading(false);
      }
    }
  }, [projectId, projects]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: metadata.title,
        semester: metadata.semester,
        tags: metadata.tags,
        task_config: config,
        cohort_id: cohortId || undefined,
      };

      if (projectId) {
        await projectService.updateProject(projectId, payload);
      } else {
        await projectService.saveProject(payload);
      }

      if (cohortId) {
        navigate(`/teacher/cohorts/${cohortId}`);
      } else {
        navigate('/teacher');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const newKey = 'custom_' + Date.now();
    setConfig({
      ...config,
      summary: {
        ...config.summary,
        sections: [
          ...config.summary.sections,
          { key: newKey, label: '新增段落', placeholder: '', minEvidence: 1 },
        ],
      },
    });
  };

  const removeSection = (index: number) => {
    setConfig({
      ...config,
      summary: {
        ...config.summary,
        sections: config.summary.sections.filter((_, i) => i !== index),
      },
    });
  };

  const updateSection = (index: number, field: string, value: any) => {
    const newSections = [...config.summary.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setConfig({
      ...config,
      summary: { ...config.summary, sections: newSections },
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.summary.sections];
    if (direction === 'up' && index > 0) {
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    setConfig({
      ...config,
      summary: { ...config.summary, sections: newSections },
    });
  };

  const addDimension = () => {
    setConfig({
      ...config,
      comparison: {
        ...config.comparison,
        dimensions: [...config.comparison.dimensions, '新維度'],
      },
    });
  };

  const removeDimension = (index: number) => {
    setConfig({
      ...config,
      comparison: {
        ...config.comparison,
        dimensions: config.comparison.dimensions.filter((_, i) => i !== index),
      },
    });
  };

  const updateDimension = (index: number, value: string) => {
    const newDimensions = [...config.comparison.dimensions];
    newDimensions[index] = value;
    setConfig({
      ...config,
      comparison: { ...config.comparison, dimensions: newDimensions },
    });
  };

  if (loading) return <div className="flex items-center justify-center h-screen">載入中...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{projectId ? '編輯專案' : '建立新專案'}</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* 基本資訊 */}
      <div className="card bg-base-100 border border-base-300 mb-6">
        <div className="card-body">
          <h2 className="card-title">基本資訊</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">專案標題 *</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              placeholder="例：碩士論文文獻探討"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">學期</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={metadata.semester}
              onChange={(e) => setMetadata({ ...metadata, semester: e.target.value })}
              placeholder="例：2024年秋季班"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">標籤</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {metadata.tags.map((tag, i) => (
                <div key={i} className="badge badge-primary gap-2">
                  {tag}
                  <button
                    onClick={() =>
                      setMetadata({
                        ...metadata,
                        tags: metadata.tags.filter((_, idx) => idx !== i),
                      })
                    }
                    className="btn btn-ghost btn-xs"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <input
              type="text"
              className="input input-bordered"
              placeholder="輸入標籤後按 Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  setMetadata({
                    ...metadata,
                    tags: [...metadata.tags, e.currentTarget.value],
                  });
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 任務配置區 - 左右分欄 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：配置器 (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 任務類型切換 */}
          <div className="tabs tabs-boxed bg-base-200">
            <a
              className={`tab ${activeTab === 'summary' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              摘要任務
            </a>
            <a
              className={`tab ${activeTab === 'comparison' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              比較任務
            </a>
          </div>

          {/* 摘要任務配置 */}
          {activeTab === 'summary' && (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title">摘要任務 (Task Summary)</h2>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.summary.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        summary: { ...config.summary, enabled: e.target.checked },
                      })
                    }
                  />
                </div>

                {config.summary.enabled && (
                  <>
                    <div className="mb-4">
                      <label className="label">
                        <span className="label-text font-semibold">段落配置</span>
                      </label>

                      <div className="space-y-3">
                        {config.summary.sections.map((section, i) => (
                          <SectionConfigCard
                            key={section.key}
                            section={section}
                            index={i}
                            totalSections={config.summary.sections.length}
                            onUpdate={(field, value) => updateSection(i, field as string, value)}
                            onMove={(direction) => moveSection(i, direction)}
                            onRemove={() => removeSection(i)}
                            canRemove={config.summary.sections.length > 1}
                          />
                        ))}
                      </div>

                      <button
                        className="btn btn-sm btn-outline mt-3 w-full gap-2"
                        onClick={addSection}
                      >
                        <Plus size={16} /> 新增段落
                      </button>
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">引導文字</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full h-24"
                        value={config.summary.guidance || ''}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            summary: { ...config.summary, guidance: e.target.value },
                          })
                        }
                        placeholder="請撰寫引導文字，協助學生理解任務目標..."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 比較任務配置 */}
          {activeTab === 'comparison' && (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title">比較任務 (Task Comparison)</h2>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.comparison.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        comparison: { ...config.comparison, enabled: e.target.checked },
                      })
                    }
                  />
                </div>

                {config.comparison.enabled && (
                  <>
                    <div className="mb-4">
                      <label className="label">
                        <span className="label-text font-semibold">比較維度</span>
                      </label>

                      <ComparisonConfigPreview
                        dimensions={config.comparison.dimensions}
                        onUpdateDimension={updateDimension}
                        onAddDimension={addDimension}
                        onRemoveDimension={removeDimension}
                        canRemove={config.comparison.dimensions.length > 1}
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">引導文字</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full h-24"
                        value={config.comparison.guidance || ''}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            comparison: { ...config.comparison, guidance: e.target.value },
                          })
                        }
                        placeholder="請撰寫引導文字，協助學生理解比較任務..."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右側：即時預覽 (1/3) */}
        <div className="lg:col-span-1">
          <StudentPreviewPanel
            summaryConfig={config.summary}
            comparisonConfig={config.comparison}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2 justify-end mt-6">
        <button className="btn btn-ghost" onClick={() => navigate('/teacher')} disabled={saving}>
          取消
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!metadata.title || saving}
        >
          {saving ? <span className="loading loading-spinner loading-sm"></span> : null}
          {saving ? '儲存中...' : '儲存配置'}
        </button>
      </div>
    </div>
  );
}
