import { PptGeneratorFrame } from './PptGeneratorFrame'
import { PortalDashboard } from './PortalDashboard'
import { AIAssistantPanel } from '../../super-admin-ui/components/assistant/AIAssistantPanel'

export { PptGeneratorFrame, PortalDashboard, AIAssistantPanel }
export type { PptBridgePayload } from './PptGeneratorFrame'
export {
  DashboardLiveProvider,
  useDashboardLive,
  useDashboardRefresh,
  useDashboardLoadState,
  useLiveField,
} from './DashboardLiveContext'
export type { DashboardLoadState, LiveDashboardData } from './DashboardLiveContext'
export { WidgetBodyGate } from './WidgetBodyGate'
export type { PortalKind } from './PortalDashboard'
