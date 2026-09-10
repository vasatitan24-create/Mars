export type ActionType = 
  | 'click' 
  | 'double_click' 
  | 'type' 
  | 'wait_element' 
  | 'delay' 
  | 'scroll';

export interface MacroStep {
  id: string;
  label: string;
  action: ActionType;
  selector: string;
  textValue?: string;
  customDelayMs?: number;
  timeoutMs?: number;
  x?: number;
  y?: number;
  enabled: boolean;
  scrollY?: number;
}

export interface AdaptiveSettings {
  minDelayMs: number;
  maxWaitElementMs: number;
  waitForDomReady: boolean;
  waitForNetworkIdle: boolean;
  speedMultiplier: number;
}

export interface MacroConfig {
  id: string;
  name: string;
  description: string;
  targetUrl: string;
  steps: MacroStep[];
  loopCount: number; // 0 = infinite, 1 = once, N = N times
  timingMode: 'fixed' | 'adaptive';
  fixedIntervalMs: number;
  randomJitterMs: number;
  adaptiveSettings: AdaptiveSettings;
  createdAt: number;
  updatedAt: number;
}

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  stepId?: string;
}

export interface ExecutionStats {
  status: ExecutionStatus;
  currentStepIndex: number;
  currentLoop: number;
  totalLoops: number;
  totalClicks: number;
  startTime: number | null;
  elapsedSeconds: number;
  clicksPerMinute: number;
  networkPingMs: number;
  isPageBusy: boolean;
  pageReadyState: string;
  activeRequests: number;
}

export interface PickedTargetEvent {
  selector: string;
  tag: string;
  text: string;
  id?: string;
  name?: string;
  x: number;
  y: number;
}
