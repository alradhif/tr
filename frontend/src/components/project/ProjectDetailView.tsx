import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { message } from 'antd'
import { Check, Plus, Presentation, RotateCcw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { companiesAssets, matchCompanyLogo, projectsAssets } from '@/assets'
import { AssetIcon } from '../ui/AssetIcon'
import { useNavigate } from 'react-router-dom'
import { ApiError, resolveApiFileUrl } from '../../api/client'
import {
  approveClientProject,
  deleteClientProject,
  getClientNested,
  getClientProjectById,
  rejectClientProject,
  submitClientProject,
  type ClientProject,
} from '../../api/clientPortal'
import {
  approveProject,
  getProjectById,
  getProjectChangeRequests,
  getProjectContracts,
  getProjectScenarios,
  deleteProject,
  rejectProject,
  submitProject,
  type OrgProject,
} from '../../api/orgProjects'
import { decideChangeRequest, deleteNested, updateNested, returnProjectForChanges, updateProjectStatus } from '../../api/projectNested'
import { getClientRole, getClientToken } from '../../auth/clientAuth'
import { getOrgRole, getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft, isDataEntry, isUpperManagement } from '../../auth/permissions'
import type { PptBridgePayload } from '../../features/portal/PptGeneratorFrame'
import { Badge, CatalogButton, SubpageHeader } from '../ui'
import { ProgressBar } from '../../org-catalog/ProgressBar'
import {
  OrgProjectOutputsView,
  OrgProjectRecordList,
  OrgProjectStagesView,
} from '../../org-catalog/OrgProjectCatalogViews'
import { CreatePresentationModal } from './CreatePresentationModal'
import { ProjectAddModal, type ProjectAddKind } from './ProjectAddModals'
import { CatalogConfirmDialog } from '../../org-catalog/CatalogConfirmDialog'
import {
  approvalBadgeVariant,
  approvalLabelKey,
  isDraftOrRejected,
  isPendingApproval,
} from '../../org-catalog/approvalStatus'

type ProjectDetailViewProps = {
  projectId?: string
  backPath: string
  basePath: string
  portal?: 'org' | 'client'
  variant?: 'full' | 'client'
  showUpdateAction?: boolean
  showGeneratePresentation?: boolean
  canApprove?: boolean
}

type AnyRecord = Record<string, unknown>

function formatDate(value?: unknown) {
  if (!value) return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
}

function daysUntil(value?: unknown) {
  if (!value) return 0
  const target = new Date(String(value))
  if (Number.isNaN(target.getTime())) return 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000))
}

function mapProjectUiStatus(raw?: string, endDate?: string | null) {
  const status = String(raw ?? '').toUpperCase()
  if (status === 'COMPLETED') return 'completed' as const
  if (status === 'ON_HOLD' || status === 'CANCELLED') return 'stalled' as const
  if (endDate) {
    const end = new Date(endDate)
    if (!Number.isNaN(end.getTime()) && end < new Date() && status === 'ACTIVE') return 'delayed' as const
  }
  return 'onTrack' as const
}

function riskLevel(value?: string) {
  const raw = String(value ?? '').toUpperCase()
  if (raw === 'HIGH' || raw === 'CRITICAL') return 'high'
  if (raw === 'MEDIUM') return 'medium'
  return 'low'
}

function asRows(items: unknown[] | undefined, map: (item: AnyRecord, index: number) => AnyRecord) {
  return (items ?? []).map((item, index) => map((item ?? {}) as AnyRecord, index))
}

/** Phases have no progress field, so the presentation shows how much of each phase's schedule has elapsed. */
function phaseScheduleProgress(start?: string, end?: string) {
  const from = start ? new Date(start).getTime() : NaN
  const to = end ? new Date(end).getTime() : NaN
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0
  return Math.round(Math.min(1, Math.max(0, (Date.now() - from) / (to - from))) * 100)
}

const CHANGE_REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: 'بانتظار القرار',
  UNDER_REVIEW: 'قيد المراجعة',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
}

export function ProjectDetailView({
  projectId,
  backPath,
  basePath,
  portal,
  variant,
  showGeneratePresentation = false,
  canApprove = false,
}: ProjectDetailViewProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const id = projectId || 'new'
  const formBase = `${basePath}/${id}`
  const resolvedPortal = portal ?? (basePath.startsWith('/client') ? 'client' : 'org')
  const isClient = variant === 'client' || resolvedPortal === 'client'

  const [loading, setLoading] = useState(Boolean(projectId))
  const [project, setProject] = useState<OrgProject | ClientProject | null>(null)
  const [contracts, setContracts] = useState<AnyRecord[]>([])
  const [changeRequests, setChangeRequests] = useState<AnyRecord[]>([])
  const [scenarios, setScenarios] = useState<AnyRecord[]>([])
  const [presentationOpen, setPresentationOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [approvalWorking, setApprovalWorking] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [decisionMode, setDecisionMode] = useState<'reject' | 'return'>('reject')
  const [addKind, setAddKind] = useState<ProjectAddKind | null>(null)

  const load = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      if (resolvedPortal === 'client') {
        const token = getClientToken()
        if (!token) return
        const { project: p } = await getClientProjectById(token, projectId)
        setProject(p)
        const [contractsRes, crsRes, scenariosRes] = await Promise.all([
          getClientNested(token, projectId, 'contracts'),
          getClientNested(token, projectId, 'change-requests'),
          getClientNested(token, projectId, 'scenarios'),
        ])
        setContracts((contractsRes.contracts as AnyRecord[]) ?? [])
        setChangeRequests((crsRes.changeRequests as AnyRecord[]) ?? [])
        setScenarios((scenariosRes.scenarios as AnyRecord[]) ?? [])
      } else {
        const token = getOrgToken()
        if (!token) return
        const { project: p } = await getProjectById(token, projectId)
        setProject(p)
        const [contractsRes, crsRes, scenariosRes] = await Promise.all([
          getProjectContracts(token, projectId),
          getProjectChangeRequests(token, projectId),
          getProjectScenarios(token, projectId),
        ])
        setContracts((contractsRes.contracts as AnyRecord[]) ?? [])
        setChangeRequests((crsRes.changeRequests as AnyRecord[]) ?? [])
        setScenarios((scenariosRes.scenarios as AnyRecord[]) ?? [])
      }
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await load()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, resolvedPortal, t])

  const phases = useMemo(
    () =>
      asRows(project?.phases as unknown[] | undefined, (item) => ({
        key: String(item.id ?? item.title),
        title: String(item.title ?? item.name ?? '—'),
        status: String(item.status ?? '—'),
        duration: String(item.duration ?? '—'),
        startDate: formatDate(item.startDate),
        endDate: formatDate(item.endDate),
        startRaw: item.startDate ? String(item.startDate) : undefined,
        endRaw: item.endDate ? String(item.endDate) : undefined,
        scope: String(item.scope ?? '—'),
        activities: String(item.notes ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      })),
    [project],
  )

  const deliverables = useMemo(
    () =>
      asRows(project?.deliverables as unknown[] | undefined, (item) => ({
        key: String(item.id ?? item.name),
        name: String(item.name ?? '—'),
        phase: String(item.phase ?? item.phaseTitle ?? '—'),
        endDate: formatDate(item.endDate ?? item.createdAt),
        createdAt: formatDate(item.createdAt),
        status: String(item.status ?? '—'),
        progress: Number(item.progressPct ?? 0),
        price: Number(item.price ?? 0),
      })),
    [project],
  )

  const risks = useMemo(
    () =>
      asRows(project?.risks as unknown[] | undefined, (item) => ({
        key: String(item.id ?? item.name),
        name: String(item.name ?? '—'),
        probability: String(item.probability ?? '—'),
        impact: String(item.impact ?? '—'),
        status: String(item.status ?? '—'),
        responsible: String(item.responsibleName ?? '—'),
      })),
    [project],
  )

  const changeRequestRows = useMemo(
    () =>
      asRows(changeRequests, (item) => ({
        key: String(item.id ?? item.title),
        title: String(item.title ?? '—'),
        priority: String(item.priority ?? '—'),
        status: String(item.status ?? '—'),
        submittedBy: String(
          (item.requester as AnyRecord | undefined)?.name ?? item.submittedBy ?? '—',
        ),
        submittedDate: formatDate(item.submittedDate ?? item.createdAt),
      })),
    [changeRequests],
  )

  const scenarioRows = useMemo(
    () =>
      asRows(scenarios, (item) => ({
        key: String(item.id ?? `${item.originalDate}-${item.newDate}`),
        originalDate: formatDate(item.originalDate),
        newDate: formatDate(item.newDate),
        impactOnSchedule: String(item.impactOnSchedule ?? '—'),
        impactOnCost: String(item.impactOnCost ?? '—'),
      })),
    [scenarios],
  )

  const [rowWorking, setRowWorking] = useState<string | null>(null)
  const runRowAction = async (key: string, action: (token: string, projectId: string) => Promise<unknown>, done: string) => {
    const token = resolvedPortal === 'client' ? getClientToken() : getOrgToken()
    if (!token || !projectId) return
    setRowWorking(key)
    try {
      await action(token, projectId)
      message.success(done)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setRowWorking(null)
    }
  }

  const orgRole = getOrgRole()
  const clientRole = getClientRole()
  const portalRole = isClient ? clientRole : orgRole
  const portalToken = isClient ? getClientToken() : getOrgToken()
  const canMutate = portalRole ? canCreateDraft(portalRole) : false
  const canDeleteProject = Boolean(portalRole && isUpperManagement(portalRole))
  const approvalStatus = isClient
    ? (project as ClientProject | null)?.approvalStatus
    : (project as OrgProject | null)?.approvalStatus
  const pendingApproval = isPendingApproval(approvalStatus)
  const canAddNested = canMutate && !(portalRole && isDataEntry(portalRole) && pendingApproval)
  const crStatusLabel = (status: string) =>
    ({ PENDING: 'بانتظار القرار', UNDER_REVIEW: 'قيد المراجعة', APPROVED: 'معتمد', REJECTED: 'مرفوض' })[status] ?? status
  const riskStatusLabel = (status: string) => (status.toUpperCase() === 'CLOSED' ? 'مغلق' : 'قائم')

  const teamMembers = asRows(
    (project as { teamMembers?: unknown[] } | null)?.teamMembers,
    (item) => item,
  ).map((item) => ({ id: String(item.id), name: String(item.name ?? '—'), role: item.role ? String(item.role) : '' }))
  const progress = project?.progressPct ?? 0
  const budget = Number(project?.budget ?? 0)

  const orgTabs = [
    { key: 'overview', label: t('projectOverview') },
    { key: 'phases', label: t('projectPhases') },
    { key: 'deliverables', label: t('deliverables') },
    { key: 'risks', label: t('risks') },
    { key: 'changeRequests', label: t('changeRequests') },
    { key: 'whatIf', label: t('whatIf') },
  ]

  const tabContent: Record<string, ReactNode> = {
    phases: (
      <OrgProjectStagesView
        projectName={project?.name ?? t('projects')}
        phases={phases.map((phase) => ({
          key: String(phase.key),
          title: String(phase.title),
          status: String(phase.status),
          startDate: String(phase.startDate),
          endDate: String(phase.endDate),
          startRaw: phase.startRaw ? String(phase.startRaw) : undefined,
          endRaw: phase.endRaw ? String(phase.endRaw) : undefined,
          activities: phase.activities as string[],
        }))}
      />
    ),
    deliverables: (
      <OrgProjectOutputsView
        rows={deliverables.map((row) => ({
          key: String(row.key),
          name: String(row.name),
          phase: String(row.phase),
          endDate: String(row.endDate),
          createdAt: row.createdAt ? String(row.createdAt) : undefined,
          status: String(row.status),
          progress: Number(row.progress),
          actions:
            canAddNested || canDeleteProject ? (
              <span className="row-actions">
                {canAddNested && String(row.status).toUpperCase() !== 'COMPLETED' ? (
                  <button
                    type="button"
                    className="is-primary"
                    disabled={rowWorking === row.key}
                    onClick={() =>
                      void runRowAction(
                        String(row.key),
                        (token, pid) => updateNested(resolvedPortal, token, pid, 'deliverables', String(row.key), { status: 'COMPLETED' }),
                        'تم تحديد المخرج كمكتمل',
                      )
                    }
                  >
                    تم الإنجاز
                  </button>
                ) : null}
                {canDeleteProject ? (
                  <button
                    type="button"
                    className="is-danger"
                    disabled={rowWorking === row.key}
                    onClick={() => {
                      if (!window.confirm(`حذف المخرج «${row.name}»؟`)) return
                      void runRowAction(
                        String(row.key),
                        (token, pid) => deleteNested(resolvedPortal, token, pid, 'deliverables', String(row.key)),
                        t('deletedSuccessfully'),
                      )
                    }}
                  >
                    {t('delete')}
                  </button>
                ) : null}
              </span>
            ) : null,
        }))}
      />
    ),
    risks: (
      <OrgProjectRecordList
        emptyKey="noRisksYet"
        rows={risks.map((row) => ({
          key: String(row.key),
          title: String(row.name),
          subtitle: String(row.responsible),
          meta: `${t('probability', { defaultValue: 'الاحتمالية' })}: ${row.probability} · ${t('impact', { defaultValue: 'الأثر' })}: ${row.impact}`,
          status: riskStatusLabel(String(row.status)),
          actions:
            canAddNested || canDeleteProject ? (
              <span className="row-actions">
                {canAddNested && String(row.status).toUpperCase() !== 'CLOSED' ? (
                  <button
                    type="button"
                    className="is-primary"
                    disabled={rowWorking === row.key}
                    onClick={() =>
                      void runRowAction(
                        String(row.key),
                        (token, pid) => updateNested(resolvedPortal, token, pid, 'risks', String(row.key), { status: 'CLOSED' }),
                        'تم إغلاق الخطر',
                      )
                    }
                  >
                    إغلاق الخطر
                  </button>
                ) : null}
                {canDeleteProject ? (
                  <button
                    type="button"
                    className="is-danger"
                    disabled={rowWorking === row.key}
                    onClick={() => {
                      if (!window.confirm(`حذف الخطر «${row.name}»؟`)) return
                      void runRowAction(
                        String(row.key),
                        (token, pid) => deleteNested(resolvedPortal, token, pid, 'risks', String(row.key)),
                        t('deletedSuccessfully'),
                      )
                    }}
                  >
                    {t('delete')}
                  </button>
                ) : null}
              </span>
            ) : null,
        }))}
      />
    ),
    changeRequests: (
      <OrgProjectRecordList
        emptyKey="noChangeRequestsYet"
        rows={changeRequestRows.map((row) => ({
          key: String(row.key),
          title: String(row.title),
          subtitle: String(row.submittedBy),
          meta: String(row.submittedDate),
          status: crStatusLabel(String(row.status)),
          actions:
            canApprove && ['PENDING', 'UNDER_REVIEW'].includes(String(row.status)) ? (
              <span className="row-actions">
                <button
                  type="button"
                  className="is-primary"
                  disabled={rowWorking === row.key}
                  onClick={() =>
                    void runRowAction(
                      String(row.key),
                      (token, pid) => decideChangeRequest(resolvedPortal, token, pid, String(row.key), 'approve'),
                      'تمت الموافقة على طلب التغيير',
                    )
                  }
                >
                  {t('approve')}
                </button>
                {String(row.status) === 'PENDING' ? (
                  <button
                    type="button"
                    disabled={rowWorking === row.key}
                    onClick={() =>
                      void runRowAction(
                        String(row.key),
                        (token, pid) => decideChangeRequest(resolvedPortal, token, pid, String(row.key), 'review'),
                        'أُحيل الطلب للمراجعة',
                      )
                    }
                  >
                    مراجعة
                  </button>
                ) : null}
                <button
                  type="button"
                  className="is-danger"
                  disabled={rowWorking === row.key}
                  onClick={() => {
                    const comment = window.prompt('سبب الرفض (اختياري)') ?? undefined
                    void runRowAction(
                      String(row.key),
                      (token, pid) => decideChangeRequest(resolvedPortal, token, pid, String(row.key), 'reject', comment),
                      'تم رفض طلب التغيير',
                    )
                  }}
                >
                  {t('reject')}
                </button>
              </span>
            ) : null,
        }))}
      />
    ),
    whatIf: (
      <OrgProjectRecordList
        emptyKey="noScenariosYet"
        rows={scenarioRows.map((row) => ({
          key: String(row.key),
          title: `${row.originalDate} → ${row.newDate}`,
          subtitle: String(row.impactOnSchedule),
          meta: String(row.impactOnCost),
        }))}
      />
    ),
  }

  const orgProject = project as OrgProject | null
  const clientProject = project as ClientProject | null
  const uiStatus = mapProjectUiStatus(project?.status, project?.endDate)
  const statusKey =
    uiStatus === 'onTrack' ? 'onTrack' : uiStatus === 'delayed' ? 'delayed' : uiStatus === 'stalled' ? 'stalled' : 'completed'
  const statusTone = uiStatus === 'delayed' ? 'warning' : uiStatus === 'stalled' ? 'danger' : 'success'
  const remainingDays = daysUntil(project?.endDate)
  const financials = (project as { financials?: { spent?: number; committed?: number } } | null)?.financials
  const spent = Number(financials?.spent ?? 0)
  const remainingBudget = Math.max(0, budget - spent)
  const budgetPct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const companyLogoSrc = matchCompanyLogo(orgProject?.executingCompany?.name) ?? companiesAssets.company
  const riskCounts = { high: 0, medium: 0, low: 0 }
  risks.forEach((row) => {
    if (String(row.status).toUpperCase() === 'CLOSED') return
    riskCounts[riskLevel(String(row.impact ?? row.probability))] += 1
  })
  const attachments =
    (project && 'attachments' in project && Array.isArray(project.attachments) ? project.attachments : []) ?? []
  const firstContract = contracts[0]
  const contractEnd = firstContract?.endDate ? String(firstContract.endDate) : project?.endDate
  const contractExpired = contractEnd ? new Date(String(contractEnd)).getTime() < Date.now() : false
  const companyTitle =
    orgProject?.executingCompany?.name ??
    orgProject?.department?.name ??
    clientProject?.client?.name ??
    project?.name ??
    t('projects')
  const pptData: PptBridgePayload | null = project
    ? {
        projectId: project.id,
        project: {
          name: project.name,
          code: project.id.slice(0, 8).toUpperCase(),
          department: companyTitle !== t('projects') ? companyTitle : undefined,
          projectManager: project.manager?.name,
          startDate: formatDate(project.startDate),
          endDate: formatDate(project.endDate),
          statusLabel: t(statusKey),
          progress,
          spent,
          description: project.description ?? undefined,
          remainingDays,
          ...(Number.isFinite(budget) ? { budget, budgetCurrency: 'SAR' } : {}),
        },
        outputs: deliverables.map((d) => String(d.name)).filter(Boolean),
        phases: phases.map((phase) => ({
          name: String(phase.title),
          progress: phaseScheduleProgress(phase.startRaw as string | undefined, phase.endRaw as string | undefined),
          startDate: phase.startRaw ? String(phase.startRaw) : undefined,
          endDate: phase.endRaw ? String(phase.endRaw) : undefined,
        })),
        risks: riskCounts,
        changeRequests: changeRequestRows.map((row) => ({
          title: String(row.title),
          status: CHANGE_REQUEST_STATUS_LABELS[String(row.status).toUpperCase()] ?? String(row.status),
        })),
        scenarios: scenarioRows.map((row) =>
          String(row.impactOnSchedule || `${row.originalDate} → ${row.newDate}`),
        ),
      }
    : null
  const rejectionReason = isClient ? clientProject?.rejectionReason : orgProject?.rejectionReason
  const approvedByName = isClient ? clientProject?.approvedByUser?.name : orgProject?.approvedByUser?.name
  const dataEntryCanEdit = Boolean(portalRole && isDataEntry(portalRole) && isDraftOrRejected(approvalStatus))
  const dataEntryCanSubmit = dataEntryCanEdit
  const managerCanDecide = Boolean(portalRole && isUpperManagement(portalRole) && pendingApproval)
  const canEditProject = Boolean(portalRole && isUpperManagement(portalRole)) || dataEntryCanEdit
  const catalogAdd = (label: string, kind: ProjectAddKind) => (
    <CatalogButton className="project-detail__add-output" onClick={() => setAddKind(kind)}>
      {label}
      <Plus size={14} strokeWidth={2.5} />
    </CatalogButton>
  )
  const heroAction =
    !canMutate ? null : activeTab === 'phases' && canAddNested ? (
      catalogAdd(t('addPhase'), 'phase')
    ) : activeTab === 'deliverables' && canAddNested ? (
      catalogAdd(t('addDeliverable'), 'deliverable')
    ) : activeTab === 'risks' && canAddNested ? (
      catalogAdd(t('addRisk'), 'risk')
    ) : activeTab === 'changeRequests' && canAddNested ? (
      catalogAdd(t('addChangeRequest'), 'changeRequest')
    ) : activeTab === 'whatIf' && canAddNested ? (
      <CatalogButton className="project-detail__add-output" onClick={() => navigate(`${formBase}/scenarios/new`)}>
        {t('addScenario')}
        <Plus size={14} strokeWidth={2.5} />
      </CatalogButton>
    ) : (
      <div className="detail-actions">
        {dataEntryCanSubmit ? (
          <CatalogButton
            disabled={approvalWorking}
            onClick={async () => {
              const token = portalToken
              if (!token || !projectId) return
              setApprovalWorking(true)
              try {
                if (isClient) await submitClientProject(token, projectId)
                else await submitProject(token, projectId)
                message.success(t('submittedForApproval'))
                await load()
              } catch (err) {
                message.error(err instanceof ApiError ? err.message : t('loadError'))
              } finally {
                setApprovalWorking(false)
              }
            }}
          >
            {approvalStatus === 'REJECTED' ? t('resubmitForApproval') : t('submitForApproval')}
          </CatalogButton>
        ) : null}
        {managerCanDecide ? (
          <>
            <CatalogButton
              disabled={approvalWorking}
              onClick={async () => {
                const token = portalToken
                if (!token || !projectId) return
                setApprovalWorking(true)
                try {
                  if (isClient) await approveClientProject(token, projectId)
                  else await approveProject(token, projectId)
                  message.success(t('projectApproved'))
                  await load()
                } catch (err) {
                  message.error(err instanceof ApiError ? err.message : t('loadError'))
                } finally {
                  setApprovalWorking(false)
                }
              }}
            >
              <Check size={14} strokeWidth={2.5} />
              {t('approve')}
            </CatalogButton>
            <CatalogButton
              variant="danger"
              disabled={approvalWorking}
              onClick={() => {
                setDecisionMode('reject')
                setRejectReason('')
                setRejectOpen(true)
              }}
            >
              <X size={14} strokeWidth={2.5} />
              {t('reject')}
            </CatalogButton>
            <CatalogButton
              variant="outline"
              disabled={approvalWorking}
              onClick={() => {
                setDecisionMode('return')
                setRejectReason('')
                setRejectOpen(true)
              }}
            >
              <RotateCcw size={14} strokeWidth={2.5} />
              إعادة للتعديل
            </CatalogButton>
          </>
        ) : null}
        {canDeleteProject && activeTab === 'overview' && project && !pendingApproval ? (
          <select
            className="project-detail__status-select"
            aria-label="حالة المشروع"
            value={String(project.status ?? 'ACTIVE')}
            disabled={approvalWorking}
            onChange={async (event) => {
              const token = portalToken
              if (!token || !projectId) return
              setApprovalWorking(true)
              try {
                await updateProjectStatus(resolvedPortal, token, projectId, event.target.value)
                message.success('تم تحديث حالة المشروع')
                await load()
              } catch (err) {
                message.error(err instanceof ApiError ? err.message : t('loadError'))
              } finally {
                setApprovalWorking(false)
              }
            }}
          >
            <option value="ACTIVE">نشط</option>
            <option value="ON_HOLD">متوقف مؤقتاً</option>
            <option value="COMPLETED">مكتمل</option>
            <option value="CANCELLED">ملغي</option>
          </select>
        ) : null}
        {canEditProject && activeTab === 'overview' ? (
          <CatalogButton variant="outline" onClick={() => navigate(`${formBase}/edit`)}>
            {approvalStatus === 'REJECTED' ? t('correctAndResubmit') : t('edit')}
          </CatalogButton>
        ) : null}
        {canDeleteProject ? (
          <CatalogButton variant="danger" className="project-detail__delete" onClick={() => setConfirmDelete(true)}>
            {t('delete')}
          </CatalogButton>
        ) : null}
      </div>
    )

  const presentationButton =
    showGeneratePresentation && projectId ? (
      <CatalogButton
        icon={<Presentation size={15} strokeWidth={2} />}
        disabled={presentationOpen}
        onClick={() => setPresentationOpen(true)}
      >
        {t('createPresentation')}
      </CatalogButton>
    ) : null

  const heroActions = (
    <>
      {presentationButton}
      {heroAction}
    </>
  )

  const orgOverview = (
    <div className="project-detail__overview">
      <div className="project-detail__company-card">
        <div className="project-detail__company-main">
          <span className="project-detail__section-icon">
            <AssetIcon src={companyLogoSrc} size={26} />
          </span>
          <div>
            <h2>{companyTitle}</h2>
              <p>{project?.description || t('projectDescription')}</p>
          </div>
        </div>
        <span className="project-detail__company-link">{orgProject?.classification || t('internalDept')}</span>
      </div>
      {attachments.length > 0 ? (
        <section className="project-detail__card project-detail__attachments-card">
          <h2>{t('uploadAttachments')}</h2>
          <ul className="project-detail__attachment-list">
            {attachments.map((file) => (
              <li key={file.id}>
                <a href={resolveApiFileUrl(file.fileUrl)} target="_blank" rel="noreferrer">
                  {file.fileName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="project-detail__stats-grid">
        <article className="project-detail__card">
          <h3>{t('progressRate')}</h3>
          <strong>{progress}%</strong>
          <span className="project-detail__on-track">{t(statusKey)}</span>
          <ProgressBar value={progress} tone="success" />
        </article>
        <article className="project-detail__card project-detail__remaining-card">
          <h3>{t('daysRemaining')}</h3>
          <div className="project-detail__remaining-value">
            <strong>{remainingDays}</strong>
            <span>{t('dayUnit')}</span>
          </div>
          <div className="project-detail__blue-line" />
        </article>
        <article className="project-detail__card project-detail__budget-card">
          <h3>{t('budgetSummary')}</h3>
          <div className="project-detail__budget-values">
            <span>{t('remainingBudget')}</span>
            <span>{t('spent')}</span>
          </div>
          <div className="project-detail__budget-bar">
            <span style={{ width: `${budgetPct}%` }} />
          </div>
          <div className="project-detail__budget-values">
            <strong>{remainingBudget.toLocaleString('en-US')}</strong>
            <strong>{spent.toLocaleString('en-US')}</strong>
          </div>
        </article>
        <article className="project-detail__card">
          <h3>{t('openRisks')}</h3>
          <div className="project-detail__legend">
            <span>
              {t('high')} <i className="is-high" /> <b>{riskCounts.high}</b>
            </span>
            <span>
              {t('medium')} <i className="is-medium" /> <b>{riskCounts.medium}</b>
            </span>
            <span>
              {t('low')} <i className="is-low" /> <b>{riskCounts.low}</b>
            </span>
          </div>
        </article>
      </div>

      <div className="project-detail__two-columns">
        <section className="project-detail__card project-detail__contract-card">
          <div className="project-detail__section-heading">
            <span className="project-detail__section-icon">
              <AssetIcon src={projectsAssets.contract} size={22} />
            </span>
            <h2>{t('contractDetailsTitle')}</h2>
          </div>
          <div className="project-detail__contract-grid">
            <div className="pd-field">
              <span>{t('contractNumber')}</span>
              <strong>{String(firstContract?.name ?? firstContract?.id ?? '—')}</strong>
            </div>
            <div className="pd-field">
              <span>{t('signDate')}</span>
              <strong>{formatDate(firstContract?.startDate ?? orgProject?.startDate)}</strong>
            </div>
            <div className="pd-field">
              <span>{t('contractingParty')}</span>
              <strong>{orgProject?.executingCompany?.name ?? '—'}</strong>
            </div>
            <div className="pd-field">
              <span>{t('startDate')}</span>
              <strong>{formatDate(firstContract?.startDate ?? orgProject?.startDate)}</strong>
            </div>
            <div className="pd-field">
              <span>{t('endDate')}</span>
              <strong>{formatDate(firstContract?.endDate ?? orgProject?.endDate)}</strong>
            </div>
            <div className="pd-field">
              <span>{t('contractStatusLabel')}</span>
              <strong>{contractExpired ? t('contractExpired') : t('contractActive')}</strong>
            </div>
          </div>
        </section>
        <section className="project-detail__card project-detail__budget-summary-card">
          <div className="project-detail__section-heading">
            <span className="project-detail__section-icon">
              <AssetIcon src={projectsAssets.budget} size={22} />
            </span>
            <h2>{t('budgetSummary')}</h2>
          </div>
          <div className="pd-summary-row">
            <span>{t('spent')}</span>
            <strong>{spent.toLocaleString('en-US')}</strong>
          </div>
          <div className="pd-summary-row">
            <span>{t('remainingBudget')}</span>
            <strong>{remainingBudget.toLocaleString('en-US')}</strong>
          </div>
          <div className="pd-summary-row is-total">
            <span>{t('totalBudget')}</span>
            <strong>{budget.toLocaleString('en-US')}</strong>
          </div>
        </section>
      </div>

      <section className="project-detail__card project-detail__parties-card">
        <div className="project-detail__section-heading">
          <span className="project-detail__section-icon">
            <AssetIcon src={projectsAssets.team} size={22} />
          </span>
          <h2>{t('projectParties')}</h2>
        </div>
        {[
          {
            role: t('orgPmRole'),
            contact: [orgProject?.orgProjectManagerName, orgProject?.orgEmail, orgProject?.orgPhone]
              .filter(Boolean)
              .join('  ·  ') || orgProject?.manager?.name || '—',
            tag: t('supplierTag'),
            color: '#5bc8b4',
            tagBg: '#dceeff',
            tagColor: '#2e90fa',
          },
          {
            role: t('clientPmRole'),
            contact: [orgProject?.clientProjectManagerName, orgProject?.clientEmail, orgProject?.clientPhone]
              .filter(Boolean)
              .join('  ·  ') || '—',
            tag: t('clientTag'),
            color: '#58a6fb',
            tagBg: '#d1f0e1',
            tagColor: '#4fc7a7',
          },
        ].map((party) => (
          <div key={party.role} className="pd-party">
            <div>
              <strong>{party.role}</strong>
              <span>{party.contact}</span>
            </div>
            <span className="pd-avatar" style={{ background: party.color }}>
              {(party.contact || party.role).charAt(0)}
            </span>
            <span className="pd-tag" style={{ background: party.tagBg, color: party.tagColor }}>
              {party.tag}
            </span>
          </div>
        ))}
        <div className="project-detail__section-heading" style={{ marginTop: 16 }}>
          <h2>{t('teamMembers', { defaultValue: 'فريق المشروع' })}</h2>
          {canAddNested ? (
            <CatalogButton className="project-detail__add-output" onClick={() => setAddKind('team')}>
              إضافة عضو
              <Plus size={14} strokeWidth={2.5} />
            </CatalogButton>
          ) : null}
        </div>
        <div className="project-detail__team-list">
          {teamMembers.length === 0 ? <em style={{ color: '#96989f', fontSize: 12 }}>لا يوجد أعضاء مضافون بعد</em> : null}
          {teamMembers.map((member) => (
            <span key={member.id}>
              <strong>{member.name}</strong>
              {member.role ? <small>{member.role}</small> : null}
              {canDeleteProject ? (
                <button
                  type="button"
                  aria-label={`حذف ${member.name}`}
                  disabled={rowWorking === member.id}
                  onClick={() => {
                    if (!window.confirm(`إزالة ${member.name} من فريق المشروع؟`)) return
                    void runRowAction(
                      member.id,
                      (token, pid) => deleteNested(resolvedPortal, token, pid, 'team', member.id),
                      t('deletedSuccessfully'),
                    )
                  }}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      </section>
    </div>
  )

  return (
    <div className="dashboard-page project-detail" dir="rtl">
        <SubpageHeader
          parent={t('projects')}
          title={project?.name ?? t('projectDetails')}
          onBack={() => navigate(backPath)}
        />
        <main className="project-detail__body">
          <section className="project-detail__hero">
            <div className="project-detail__hero-title">
              <h1>{project?.name ?? t('projectDetails')}</h1>
              <p>{project?.description || `${project?.type ?? t('projects')} — ${companyTitle}`}</p>
              {activeTab !== 'whatIf' ? (
                <div className="project-detail__hero-status">
                  <Badge variant={approvalBadgeVariant(approvalStatus)}>
                    {t(approvalLabelKey(approvalStatus))}
                  </Badge>
                  <Badge variant={statusTone} icon={<span className="tenants-status-dot" />}>
                    {t(statusKey)}
                  </Badge>
                  <span className="project-detail__hero-type">{orgProject?.type || clientProject?.type || t('projects')}</span>
                </div>
              ) : null}
              {approvalStatus === 'DRAFT' && rejectionReason ? (
                <div className="approval-banner approval-banner--rejected">
                  <p>
                    <strong>مطلوب تعديلات قبل إعادة الإرسال: </strong>
                    {rejectionReason}
                    {approvedByName ? ` — ${approvedByName}` : ''}
                  </p>
                </div>
              ) : null}
              {approvalStatus === 'REJECTED' && rejectionReason ? (
                <div className="approval-banner approval-banner--rejected">
                  <p>
                    <strong>{t('approvalStatusRejected')}</strong>
                    {rejectionReason}
                    {approvedByName ? ` — ${approvedByName}` : ''}
                  </p>
                </div>
              ) : null}
              {pendingApproval ? (
                <div className="approval-banner approval-banner--pending">
                  <p>
                    <strong>{t('approvalStatusPending')}</strong>
                    {t('pendingProjectApproval')}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="project-detail__actions">{heroActions}</div>
          </section>

          <div className="project-detail__tabs">
            {orgTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="catalog-loading">{t('loadingList')}</div>
          ) : activeTab === 'overview' ? (
            orgOverview
          ) : (
            tabContent[activeTab]
          )}
        </main>
        <CatalogConfirmDialog
          open={confirmDelete}
          title={t('delete')}
          message={t('confirmDeleteProject')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          loading={deleting}
          onConfirm={async () => {
            const token = portalToken
            if (!token || !projectId) return
            setDeleting(true)
            try {
              if (isClient) await deleteClientProject(token, projectId)
              else await deleteProject(token, projectId)
              message.success(t('deletedSuccessfully'))
              navigate(backPath)
            } catch (err) {
              message.error(err instanceof ApiError ? err.message : t('loadError'))
            } finally {
              setDeleting(false)
              setConfirmDelete(false)
            }
          }}
          onCancel={() => setConfirmDelete(false)}
        />
        <CatalogConfirmDialog
          open={rejectOpen}
          title={decisionMode === 'return' ? 'إعادة المشروع للتعديل' : t('reject')}
          message={
            decisionMode === 'return'
              ? 'سيعود المشروع إلى مدخل البيانات كمسودة مع ملاحظاتك، ويمكنه تعديله وإعادة إرساله.'
              : t('rejectProjectConfirm')
          }
          confirmLabel={decisionMode === 'return' ? 'إعادة للتعديل' : t('confirmReject')}
          cancelLabel={t('cancel')}
          icon={<X size={22} />}
          loading={approvalWorking}
          promptLabel={decisionMode === 'return' ? 'التعديلات المطلوبة' : t('rejectionReason')}
          promptPlaceholder={t('rejectionReasonPlaceholder')}
          promptValue={rejectReason}
          onPromptChange={setRejectReason}
          onConfirm={async () => {
            const token = portalToken
            if (!token || !projectId) return
            if (!rejectReason.trim()) {
              message.error(t('rejectionReasonRequired'))
              return
            }
            setApprovalWorking(true)
            try {
              if (decisionMode === 'return') {
                await returnProjectForChanges(isClient ? 'client' : 'org', token, projectId, rejectReason.trim())
                message.success('أُعيد المشروع لمدخل البيانات للتعديل')
              } else {
                if (isClient) await rejectClientProject(token, projectId, rejectReason.trim())
                else await rejectProject(token, projectId, rejectReason.trim())
                message.success(t('projectRejected'))
              }
              setRejectOpen(false)
              setRejectReason('')
              await load()
            } catch (err) {
              message.error(err instanceof ApiError ? err.message : t('loadError'))
            } finally {
              setApprovalWorking(false)
            }
          }}
          onCancel={() => {
            setRejectOpen(false)
            setRejectReason('')
          }}
        />
      <CreatePresentationModal
        open={presentationOpen}
        onClose={() => setPresentationOpen(false)}
        data={pptData}
      />
      {addKind && projectId ? (
        <ProjectAddModal
          kind={addKind}
          projectId={projectId}
          portal={resolvedPortal}
          phases={phases.map((phase) => ({ id: String(phase.key), title: String(phase.title) }))}
          onClose={() => setAddKind(null)}
          onSaved={async () => {
            setAddKind(null)
            message.success('تم الحفظ بنجاح')
            await load()
          }}
        />
      ) : null}
      </div>
  )
}
