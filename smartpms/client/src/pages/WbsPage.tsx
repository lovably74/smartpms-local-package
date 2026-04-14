import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Search, Download, Plus,
  AlertTriangle, Paperclip, Edit2, Trash2, Copy, RefreshCw,
  AlertCircle, Upload, X, FileText, Image, File, LayoutGrid,
  Calendar, BarChart, TrendingUp, BookOpen, CheckCircle2, XCircle, Lightbulb, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import IssueCreateModal from "@/components/IssueCreateModal";
import GanttView from "@/components/GanttView";

interface WbsPageProps {
  projectId?: number;
}

type WbsLevel = 'major' | 'middle' | 'minor' | 'activity' | 'task';
type StatusFilter = 'all' | 'in_progress' | 'delayed' | 'not_started' | 'completed';
type GridFilterColumnKey =
  | 'level'
  | 'assignee'
  | 'planStart'
  | 'planEnd'
  | 'workDays'
  | 'actualStart'
  | 'status'
  | 'progress';

const GRID_COLUMN_STORAGE_KEY = "wbs-grid-column-visibility-v2";
const defaultGridColumnVisibility: Record<GridFilterColumnKey, boolean> = {
  level: true,
  assignee: true,
  planStart: true,
  planEnd: true,
  workDays: true,
  actualStart: true,
  status: true,
  progress: true,
};

const gridColumnLabels: Record<GridFilterColumnKey, string> = {
  level: "구분",
  assignee: "담당자",
  planStart: "계획시작일",
  planEnd: "계획종료일",
  workDays: "작업일",
  actualStart: "실행일",
  status: "진행상태",
  progress: "진행률",
};

/** 그리드 헤더 순서와 동일하게 필터 체크박스를 나열한다 */
const gridColumnFilterOrder: GridFilterColumnKey[] = [
  "level",
  "assignee",
  "planStart",
  "planEnd",
  "workDays",
  "actualStart",
  "status",
  "progress",
];

const statusConfig = {
  not_started: { label: '미시작', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  in_progress: { label: '진행중', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  delayed: { label: '지연', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  on_hold: { label: '보류', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
};

const levelConfig: Record<WbsLevel, { label: string; indent: number; bgClass: string; textClass: string }> = {
  major: { label: '대공종', indent: 0, bgClass: 'bg-slate-800 text-white font-bold', textClass: 'text-white' },
  middle: { label: '중공종', indent: 1, bgClass: 'bg-slate-700 text-white font-semibold', textClass: 'text-white' },
  minor: { label: '소공종', indent: 2, bgClass: 'bg-slate-600 text-white font-medium', textClass: 'text-white' },
  activity: { label: '액티비티', indent: 3, bgClass: 'bg-slate-100 font-medium', textClass: 'text-slate-700' },
  task: { label: '테스크', indent: 4, bgClass: 'bg-white hover:bg-blue-50/30', textClass: 'text-slate-800' },
};

const issuePriorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: '긴급', color: 'bg-red-100 text-red-700' },
  high: { label: '높음', color: 'bg-orange-100 text-orange-700' },
  medium: { label: '중간', color: 'bg-yellow-100 text-yellow-700' },
  low: { label: '낮음', color: 'bg-gray-100 text-gray-600' },
};

const issueStatusConfig: Record<string, { label: string; color: string }> = {
  open: { label: '열림', color: 'bg-red-100 text-red-700' },
  in_progress: { label: '처리중', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '해결됨', color: 'bg-green-100 text-green-700' },
  closed: { label: '닫힘', color: 'bg-gray-100 text-gray-500' },
};

/** 미해결 이슈: 열림·처리중 (해결됨·닫힘 제외) */
function isUnresolvedIssue(status: string | undefined | null): boolean {
  return status === 'open' || status === 'in_progress';
}

function getAvatarColor(name: string | null | undefined) {
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500", "bg-teal-500"];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

function formatDate(d: any): string {
  if (!d) return '-';
  try { return format(new Date(d), 'yyyy-MM-dd'); } catch { return '-'; }
}

/** 테스크 진행상태 드롭다운 값(지연·보류는 진행중으로 표시) */
function taskProgressSelectValue(status: string): 'not_started' | 'in_progress' | 'completed' {
  if (status === 'not_started') return 'not_started';
  if (status === 'completed') return 'completed';
  return 'in_progress';
}

function getWorkDays(planStart: any, planEnd: any): number | null {
  if (!planStart || !planEnd) return null;
  try {
    const diff = differenceInDays(new Date(planEnd), new Date(planStart));
    return diff >= 0 ? diff + 1 : null;
  } catch { return null; }
}

/** 계획종료일이 오늘(로컬) 이전이고 진행상태가 완료가 아닌 테스크(일정 기준 지연) */
function isTaskOverdueNotCompleted(task: { planEnd?: unknown; status?: string }): boolean {
  if (task.status === 'completed') return false;
  if (!task.planEnd) return false;
  try {
    const end = new Date(task.planEnd as string | Date);
    if (Number.isNaN(end.getTime())) return false;
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return endDay < today;
  } catch {
    return false;
  }
}

type ViewMode = 'grid' | 'gantt' | 'split';

export default function WbsPage({ projectId = 1 }: WbsPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [gridColumnVisibility, setGridColumnVisibility] = useState<Record<GridFilterColumnKey, boolean>>(() => {
    if (typeof window === "undefined") return defaultGridColumnVisibility;
    try {
      const raw = window.localStorage.getItem(GRID_COLUMN_STORAGE_KEY);
      if (!raw) return defaultGridColumnVisibility;
      const parsed = JSON.parse(raw) as Partial<Record<GridFilterColumnKey, boolean>>;
      return { ...defaultGridColumnVisibility, ...parsed };
    } catch {
      return defaultGridColumnVisibility;
    }
  });

  // 이슈 등록 모달 (새 이슈 작성)
  const [issueModalWbs, setIssueModalWbs] = useState<{ id: number; name: string } | null>(null);
  // 이슈 목록 취합 모달 (기존 이슈 목록 보기)
  const [issueListModal, setIssueListModal] = useState<{ id: number; name: string; level: string } | null>(null);
  /** 상단 미해결 이슈 클릭 시 프로젝트 전체 미해결 목록 */
  const [projectUnresolvedModalOpen, setProjectUnresolvedModalOpen] = useState(false);

  const [progressInputId, setProgressInputId] = useState<number | null>(null);
  const [progressInputValue, setProgressInputValue] = useState<string>('');

  // 산출물 팝업 상태 (level 포함)
  const [outputModalItem, setOutputModalItem] = useState<{ id: number; name: string; notes: string | null; level: string } | null>(null);
  // 액티비티 액션 모달 (이슈+매뉴얼+성공사례+실패사례+VE사례)
  const [activityActionModal, setActivityActionModal] = useState<{ id: number; name: string } | null>(null);
  // 인라인 편집 상태
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<{ name: string; planStart: string; planEnd: string }>({ name: '', planStart: '', planEnd: '' });
  // 새 항목 추가 모달
  const [addItemModal, setAddItemModal] = useState<{ parentId: number | null; parentLevel: WbsLevel | null; parentName: string } | null>(null);
  // 삭제 확인 모달
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string; childCount: number } | null>(null);

  const { data: wbsItems, isLoading } = trpc.wbs.list.useQuery({ projectId });
  const { data: users } = trpc.users.list.useQuery();
  const { data: issues } = trpc.issues.list.useQuery({ projectId });
  const { data: attachmentCountsRaw } = trpc.wbs.attachmentCountsByProject.useQuery({ projectId });

  const attachmentCountByWbsId = useMemo(() => {
    const m = new Map<number, number>();
    if (!attachmentCountsRaw) return m;
    for (const [k, v] of Object.entries(attachmentCountsRaw)) {
      m.set(Number(k), Number(v));
    }
    return m;
  }, [attachmentCountsRaw]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GRID_COLUMN_STORAGE_KEY, JSON.stringify(gridColumnVisibility));
  }, [gridColumnVisibility]);

  const updateProgress = trpc.wbs.updateProgress.useMutation({
    onSuccess: () => {
      utils.wbs.list.invalidate({ projectId });
      toast.success('진행률이 업데이트되었습니다.');
    },
    onError: () => toast.error('업데이트 실패'),
  });

  const setTaskProgressStatus = trpc.wbs.setTaskProgressStatus.useMutation({
    onSuccess: () => {
      utils.wbs.list.invalidate({ projectId });
      toast.success('진행상태가 반영되었습니다.');
    },
    onError: () => toast.error('진행상태 변경 실패'),
  });

  const updateAssignee = trpc.wbs.updateAssignee.useMutation({
    onSuccess: () => utils.wbs.list.invalidate({ projectId }),
  });

  // 인라인 편집 mutation
  const updateItem = trpc.wbs.updateItem.useMutation({
    onSuccess: () => {
      utils.wbs.list.invalidate({ projectId });
      setEditingRowId(null);
      toast.success('항목이 수정되었습니다.');
    },
    onError: () => toast.error('수정 실패'),
  });

  // 새 항목 추가 mutation
  const createItem = trpc.wbs.createItem.useMutation({
    onSuccess: () => {
      utils.wbs.list.invalidate({ projectId });
      setAddItemModal(null);
      toast.success('항목이 추가되었습니다.');
    },
    onError: () => toast.error('추가 실패'),
  });

  // 항목 삭제 mutation
  const deleteItem = trpc.wbs.deleteItem.useMutation({
    onSuccess: (data: any) => {
      utils.wbs.list.invalidate({ projectId });
      void utils.wbs.attachmentCountsByProject.invalidate({ projectId });
      setDeleteConfirm(null);
      toast.success(`항목이 삭제되었습니다. (${data.deletedCount}개)`);
    },
    onError: () => toast.error('삭제 실패'),
  });

  // 인라인 편집 시작
  const startEditing = useCallback((row: any) => {
    setEditingRowId(row.id);
    setEditingData({
      name: row.name || '',
      planStart: row.planStart ? format(new Date(row.planStart), 'yyyy-MM-dd') : '',
      planEnd: row.planEnd ? format(new Date(row.planEnd), 'yyyy-MM-dd') : '',
    });
  }, []);

  // 인라인 편집 저장
  const saveEditing = useCallback(() => {
    if (!editingRowId) return;
    updateItem.mutate({
      id: editingRowId,
      projectId,
      name: editingData.name,
      planStart: editingData.planStart || null,
      planEnd: editingData.planEnd || null,
    });
  }, [editingRowId, editingData, projectId]);

  // 하위 항목 수 계산
  const getChildCount = useCallback((id: number, items: any[]): number => {
    const children = items.filter(i => i.parentId === id);
    return children.reduce((s, c) => s + 1 + getChildCount(c.id, items), 0);
  }, []);

  // Build tree structure
  const treeData = useMemo(() => {
    if (!wbsItems) return [];
    const itemMap = new Map(wbsItems.map(i => [i.id, { ...i, children: [] as any[] }]));
    const roots: any[] = [];
    for (const item of wbsItems) {
      const node = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        itemMap.get(item.parentId)!.children.push(node);
      } else if (!item.parentId) {
        roots.push(node);
      }
    }
    return roots;
  }, [wbsItems]);

  // Flatten tree for rendering
  const flatRows = useMemo(() => {
    const rows: any[] = [];
    function flatten(nodes: any[], depth = 0) {
      for (const node of nodes) {
        const isCollapsed = collapsed.has(node.id);
        rows.push({ ...node, depth });
        if (!isCollapsed && node.children?.length > 0) {
          flatten(node.children, depth + 1);
        }
      }
    }
    flatten(treeData);
    return rows;
  }, [treeData, collapsed]);

  /** WBS id → 부모 id (루트는 null) */
  const parentByChildId = useMemo(() => {
    const m = new Map<number, number | null>();
    if (!wbsItems) return m;
    for (const i of wbsItems) {
      m.set(i.id, i.parentId ?? null);
    }
    return m;
  }, [wbsItems]);

  /**
   * 필터가 all이 아닐 때: 조건에 맞는 테스크와 그 조상 id만 표시.
   * 조건 테스크가 하나도 없으면 빈 Set → 목록 비움.
   */
  const statusFilterVisibleIds = useMemo(() => {
    if (!wbsItems || statusFilter === 'all') return null;
    const tasks = wbsItems.filter(i => i.level === 'task');
    const matched = tasks.filter(t => {
      if (statusFilter === 'delayed') return isTaskOverdueNotCompleted(t);
      return t.status === statusFilter;
    });
    if (matched.length === 0) return new Set<number>();
    const visible = new Set<number>();
    for (const t of matched) {
      let cur: number | null = t.id;
      while (cur != null) {
        visible.add(cur);
        cur = parentByChildId.get(cur) ?? null;
      }
    }
    return visible;
  }, [wbsItems, statusFilter, parentByChildId]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return flatRows.filter(row => {
      if (statusFilterVisibleIds !== null && !statusFilterVisibleIds.has(row.id)) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const u = users?.find((u: any) => u.id === row.assigneeId);
        if (!row.name.toLowerCase().includes(q) &&
          !row.wbsCode?.toLowerCase().includes(q) &&
          !(u?.name?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [flatRows, statusFilterVisibleIds, searchQuery, users]);

  // Issue count per WBS item (하위 포함 취합)
  const issueCountMap = useMemo(() => {
    const map = new Map<number, number>();
    if (!issues || !wbsItems) return map;

    // 각 WBS 항목의 모든 하위 ID 집합 계산
    const childrenMap = new Map<number, number[]>();
    for (const item of wbsItems) {
      if (item.parentId) {
        const arr = childrenMap.get(item.parentId) || [];
        arr.push(item.id);
        childrenMap.set(item.parentId, arr);
      }
    }

    const collectIds = (id: number): number[] => {
      const children = childrenMap.get(id) || [];
      return [id, ...children.flatMap(c => collectIds(c))];
    };

    for (const item of wbsItems) {
      const ids = new Set(collectIds(item.id));
      let count = 0;
      for (const issue of issues) {
        if (issue.wbsItemId && ids.has(issue.wbsItemId) && isUnresolvedIssue(issue.status)) {
          count++;
        }
      }
      if (count > 0) map.set(item.id, count);
    }
    return map;
  }, [issues, wbsItems]);

  const toggleCollapse = useCallback((id: number) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleProgressSave = useCallback((id: number, value: number) => {
    if (value < 0 || value > 100) { toast.error('0~100 사이 값을 입력하세요'); return; }
    updateProgress.mutate({ id, progress: value, projectId });
    setProgressInputId(null);
  }, [projectId, updateProgress]);

  // Summary stats
  const taskItems = wbsItems?.filter(i => i.level === 'task') ?? [];
  const totalCount = taskItems.length;
  const inProgressCount = taskItems.filter(i => i.status === 'in_progress').length;
  const completedCount = taskItems.filter(i => i.status === 'completed').length;
  const delayedCount = taskItems.filter(isTaskOverdueNotCompleted).length;
  const openIssueCount = issues?.filter(i => i.status === 'open' || i.status === 'in_progress').length ?? 0;
  const overallProgress = taskItems.length > 0
    ? Math.round(taskItems.reduce((s, i) => s + (i.progress || 0), 0) / taskItems.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">WBS 데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Stats Bar */}
      <div className="bg-white border-b border-border px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            statusFilter === 'all' ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 text-gray-600 hover:bg-gray-50")}
        >
          전체 <span className="font-bold">{totalCount}</span>
        </button>
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            statusFilter === 'in_progress' ? "bg-blue-600 text-white border-blue-600" : "border-blue-300 text-blue-600 hover:bg-blue-50")}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          진행중 <span className="font-bold">{inProgressCount}</span>
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            statusFilter === 'completed' ? "bg-green-600 text-white border-green-600" : "border-green-300 text-green-600 hover:bg-green-50")}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          완료 <span className="font-bold">{completedCount}</span>
        </button>
        <button
          onClick={() => setStatusFilter('delayed')}
          className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            statusFilter === 'delayed' ? "bg-red-600 text-white border-red-600" : "border-red-300 text-red-600 hover:bg-red-50")}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          지연 <span className="font-bold">{delayedCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setProjectUnresolvedModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors"
        >
          <AlertTriangle className="w-3 h-3" />
          미해결 이슈 <span className="font-bold">{openIssueCount}</span>
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>전체 진행률</span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
          <span className="font-semibold text-foreground">{overallProgress}%</span>
        </div>
      </div>

      {/* Toolbar + 상시 표시 컬럼 필터 */}
      <div className="border-b border-border bg-white px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 overflow-hidden rounded-md border border-border">
            <button onClick={() => setViewMode('grid')} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 text-xs", viewMode === 'grid' ? "bg-blue-50 text-blue-700 font-medium" : "text-muted-foreground hover:bg-gray-50")}>
              <LayoutGrid className="w-3 h-3" />그리드
            </button>
            <button onClick={() => setViewMode('gantt')} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 text-xs", viewMode === 'gantt' ? "bg-blue-50 text-blue-700 font-medium" : "text-muted-foreground hover:bg-gray-50")}>
              <Calendar className="w-3 h-3" />간트
            </button>
            <button onClick={() => setViewMode('split')} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 text-xs", viewMode === 'split' ? "bg-blue-50 text-blue-700 font-medium" : "text-muted-foreground hover:bg-gray-50")}>
              <BarChart className="w-3 h-3" />분할
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="작업명, WBS번호, 담당자 검색..." className="h-8 w-56 pl-8 text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-1 overflow-hidden rounded-md border border-border text-xs">
            {(['all', 'in_progress', 'delayed', 'not_started', 'completed'] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-2.5 py-1.5 transition-colors", statusFilter === s ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-gray-50")}>
                {s === 'all' ? '전체' : s === 'in_progress' ? '진행중' : s === 'delayed' ? '지연' : s === 'not_started' ? '미시작' : '완료'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
          onClick={() => {
            const headers = ['작업명', '구분', '담당자', '계획시작일', '계획종료일', '작업일', '진행상태', '진행률(%)'];
            const rows = filteredRows.map(r => [
              r.name || '',
              levelConfig[r.level as WbsLevel]?.label || r.level,
              users?.find((u: any) => u.id === r.assigneeId)?.name || '',
              r.planStart ? format(new Date(r.planStart), 'yyyy-MM-dd') : '',
              r.planEnd ? format(new Date(r.planEnd), 'yyyy-MM-dd') : '',
              getWorkDays(r.planStart, r.planEnd) ?? '',
              ({ not_started: '미시작', in_progress: '진행중', completed: '완료', delayed: '지연', on_hold: '보류' } as Record<string, string>)[r.status] || r.status,
              Math.round(r.progress || 0),
            ]);
            const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `WBS_수행관리_${format(new Date(), 'yyyyMMdd')}.csv`;
            a.click(); URL.revokeObjectURL(url);
            toast.success('CSV 파일이 다운로드되었습니다.');
          }}
        >
          <Download className="w-3 h-3" />내보내기
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <RefreshCw className="w-3 h-3" />
        </Button>
        <Button size="sm" className="h-8 gap-1.5 bg-blue-600 text-xs hover:bg-blue-700"
          onClick={() => setAddItemModal({ parentId: null, parentLevel: null, parentName: '최상위' })}>
          <Plus className="w-3 h-3" />항목 추가
        </Button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-2">
          <span className="shrink-0 text-xs font-semibold text-gray-700">표시 컬럼</span>
          <button
            type="button"
            className="shrink-0 text-[11px] text-blue-600 hover:underline"
            onClick={() => setGridColumnVisibility({ ...defaultGridColumnVisibility })}
          >
            전체 선택
          </button>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            {gridColumnFilterOrder.map(key => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`wbs-grid-col-${key}`}
                  checked={gridColumnVisibility[key]}
                  onCheckedChange={v => {
                    setGridColumnVisibility(prev => ({ ...prev, [key]: v === true }));
                  }}
                />
                <Label htmlFor={`wbs-grid-col-${key}`} className="cursor-pointer text-xs font-normal text-gray-800">
                  {gridColumnLabels[key]}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt Chart View */}
      {(viewMode === 'gantt' || viewMode === 'split') && (
        <GanttView rows={filteredRows} viewMode={viewMode} />
      )}

      {/* WBS Grid */}
      {(viewMode === 'grid' || viewMode === 'split') && (
        <div className={cn("overflow-auto", viewMode === 'split' ? "h-1/2" : "flex-1")}>
          <table className="w-full border-collapse text-xs" style={{ minWidth: '1140px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="text-left px-3 py-2 font-semibold text-gray-600 min-w-[280px]">작업명</th>
                {gridColumnVisibility.level && <th className="text-center px-2 py-2 font-semibold text-gray-600 min-w-[5.75rem] w-24">구분</th>}
                {gridColumnVisibility.assignee && <th className="text-left px-3 py-2 font-semibold text-gray-600 w-24">담당자</th>}
                {gridColumnVisibility.planStart && <th className="text-center px-2 py-2 font-semibold text-gray-600 w-24">계획시작일</th>}
                {gridColumnVisibility.planEnd && <th className="text-center px-2 py-2 font-semibold text-gray-600 w-24">계획종료일</th>}
                {gridColumnVisibility.workDays && <th className="text-center px-2 py-2 font-semibold text-gray-600 w-14">작업일</th>}
                {gridColumnVisibility.actualStart && <th className="text-center px-2 py-2 font-semibold text-gray-600 w-24">실행일</th>}
                {gridColumnVisibility.status && <th className="text-center px-2 py-2 font-semibold text-gray-600 w-20">진행상태</th>}
                <th className="w-[1%] whitespace-nowrap px-1 py-2 text-center text-xs font-semibold text-gray-600">산출물</th>
                {gridColumnVisibility.progress && <th className="text-center px-2 py-2 font-semibold text-gray-600 w-28">진행률</th>}
                <th className="text-center px-2 py-2 font-semibold text-gray-600 w-20">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => {
                const cfg = levelConfig[row.level as WbsLevel];
                const statusCfg = statusConfig[row.status as keyof typeof statusConfig] || statusConfig.not_started;
                const assignee = users?.find((u: any) => u.id === row.assigneeId);
                const workDays = getWorkDays(row.planStart, row.planEnd);
                const issueCount = issueCountMap.get(row.id) || 0;
                const attachCnt =
                  row.level === "task" ? (attachmentCountByWbsId.get(row.id) ?? 0) : 0;
                const hasChildren = row.children?.length > 0;
                const isCollapsed = collapsed.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={cn("border-b border-gray-100 transition-colors", cfg.bgClass, row.level === 'task' && "cursor-default")}
                  >
                    {/* 작업명 - 계층 구분 포함 */}
                    <td className={cn("px-3 py-1.5", cfg.textClass)}>
                      <div className="flex items-center gap-1" style={{ paddingLeft: `${cfg.indent * 14}px` }}>
                        {hasChildren && (
                          <button onClick={() => toggleCollapse(row.id)} className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:opacity-70">
                            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                        {!hasChildren && <span className="w-4 flex-shrink-0" />}
                        {editingRowId === row.id ? (
                          <input
                            type="text"
                            className="flex-1 h-6 text-xs border border-blue-400 rounded px-1.5 bg-white text-gray-800 min-w-0"
                            value={editingData.name}
                            onChange={e => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEditing();
                              if (e.key === 'Escape') setEditingRowId(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            className={cn("truncate flex-1", row.level !== 'task' ? "font-medium" : "")}
                            onDoubleClick={() => startEditing(row)}
                            title="더블클릭하여 편집"
                          >
                            {row.name}
                          </span>
                        )}
                        {/* 인라인 편집 저장/취소 버튼 */}
                        {editingRowId === row.id && (
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={saveEditing}
                              className="w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
                              title="저장 (Enter)"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingRowId(null)}
                              className="w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                              title="취소 (Esc)"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 구분 배지 (액티비티 등 한 줄 표시) */}
                    {gridColumnVisibility.level && (
                      <td className="px-2 py-1.5 text-center min-w-[5.75rem] w-24">
                        <span className={cn(
                          "inline-block px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap",
                          row.level === 'major' ? "bg-slate-900 text-white" :
                          row.level === 'middle' ? "bg-slate-700 text-white" :
                          row.level === 'minor' ? "bg-slate-500 text-white" :
                          row.level === 'activity' ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {cfg.label}
                        </span>
                      </td>
                    )}

                    {/* 담당자 */}
                    {gridColumnVisibility.assignee && <td className="px-2 py-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                            {assignee ? (
                              <>
                                <Avatar className="w-5 h-5 flex-shrink-0">
                                  <AvatarFallback className={cn("text-white text-[9px]", getAvatarColor(assignee.name))}>
                                    {assignee.name?.slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={cn("text-[11px] truncate max-w-[60px]", cfg.textClass === 'text-white' ? 'text-white/90' : 'text-gray-700')}>
                                  {assignee.name}
                                </span>
                              </>
                            ) : (
                              <span className={cn("text-[11px]", cfg.textClass === 'text-white' ? 'text-white/40' : 'text-gray-300')}>미지정</span>
                            )}
                          </button>
                        </PopoverTrigger>
                        {isAuthenticated && users && (
                          <PopoverContent className="w-40 p-1" align="start">
                            {users.map((u: any) => (
                              <button key={u.id}
                                className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-[11px]", row.assigneeId === u.id && "bg-blue-50")}
                                onClick={() => updateAssignee.mutate({ id: row.id, assigneeId: u.id })}>
                                <Avatar className="w-4 h-4 flex-shrink-0">
                                  <AvatarFallback className={cn("text-white text-[8px]", getAvatarColor(u.name))}>
                                    {u.name?.slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                                {u.name}
                              </button>
                            ))}
                          </PopoverContent>
                        )}
                      </Popover>
                    </td>}

                    {/* 계획시작일 */}
                    {gridColumnVisibility.planStart && <td className={cn("px-2 py-1.5 text-[11px] text-center", cfg.textClass)}>
                      {editingRowId === row.id ? (
                        <input
                          type="date"
                          className="w-28 h-6 text-[11px] border border-blue-400 rounded px-1 bg-white text-gray-800"
                          value={editingData.planStart}
                          onChange={e => setEditingData(prev => ({ ...prev, planStart: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEditing();
                            if (e.key === 'Escape') setEditingRowId(null);
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-500 hover:underline"
                          onDoubleClick={() => startEditing(row)}
                          title="더블클릭하여 날짜 편집"
                        >
                          {formatDate(row.planStart)}
                        </span>
                      )}
                    </td>}
                    {/* 계획종료일 */}
                    {gridColumnVisibility.planEnd && <td className={cn("px-2 py-1.5 text-[11px] text-center", cfg.textClass)}>
                      {editingRowId === row.id ? (
                        <input
                          type="date"
                          className="w-28 h-6 text-[11px] border border-blue-400 rounded px-1 bg-white text-gray-800"
                          value={editingData.planEnd}
                          onChange={e => setEditingData(prev => ({ ...prev, planEnd: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEditing();
                            if (e.key === 'Escape') setEditingRowId(null);
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-500 hover:underline"
                          onDoubleClick={() => startEditing(row)}
                          title="더블클릭하여 날짜 편집"
                        >
                          {formatDate(row.planEnd)}
                        </span>
                      )}
                    </td>}
                    {/* 작업일 (계획시작~종료 일수) */}
                    {gridColumnVisibility.workDays && <td className="px-2 py-1.5 text-center">
                      {workDays !== null ? (
                        <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                          {workDays}일
                        </span>
                      ) : <span className="text-gray-400 text-[10px]">-</span>}
                    </td>}
                    {/* 실행일 (테스크·미시작이면 비움; 상위는 하위 최종 실행일 롤업) */}
                    {gridColumnVisibility.actualStart && <td className={cn("px-2 py-1.5 text-[11px] text-center", cfg.textClass)}>
                      {row.level === 'task' && row.status === 'not_started' ? (
                        <span className="inline-block min-h-[1em]" />
                      ) : (
                        formatDate(row.actualStart)
                      )}
                    </td>}
                    {/* 진행상태 (테스크는 드롭다운, 상위는 롤업 뱃지) */}
                    {gridColumnVisibility.status && <td className="px-2 py-1.5 text-center">
                      {row.level === 'task' ? (
                        <select
                          className={cn(
                            "max-w-[5.75rem] rounded border px-1 py-0.5 text-[11px]",
                            cfg.textClass === 'text-white'
                              ? 'border-white/30 bg-white/10 text-white'
                              : 'border-gray-200 bg-white text-gray-800'
                          )}
                          value={taskProgressSelectValue(row.status)}
                          onChange={e => {
                            const v = e.target.value as 'not_started' | 'in_progress' | 'completed';
                            setTaskProgressStatus.mutate({ id: row.id, projectId, status: v });
                          }}
                          disabled={setTaskProgressStatus.isPending}
                          aria-label="테스크 진행상태"
                        >
                          <option value="not_started">미시작</option>
                          <option value="in_progress">진행중</option>
                          <option value="completed">완료</option>
                        </select>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", statusCfg.dot)} />
                          <span className={cn("text-[11px]", cfg.textClass === 'text-white' ? 'text-white/90' : statusCfg.color.split(' ')[1])}>
                            {statusCfg.label}
                          </span>
                        </div>
                      )}
                    </td>}
                    {/* 산출물: 테스크만 아이콘 표시, 열 너비는 헤더 텍스트·아이콘 최소폭만 사용 */}
                    <td className="w-[1%] whitespace-nowrap px-1 py-1.5 text-center align-middle">
                      {row.level === "task" ? (
                        <button
                          type="button"
                          onClick={() => setOutputModalItem({ id: row.id, name: row.name, notes: row.notes || null, level: row.level })}
                          className={cn(
                            "relative mx-auto inline-flex items-center justify-center rounded p-1 transition-colors",
                            row.notes || attachCnt > 0
                              ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                              : cfg.textClass === "text-white"
                                ? "text-white/50 hover:bg-white/10 hover:text-white/80"
                                : "text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                          )}
                          title="산출물 및 작업내역"
                          aria-label="산출물 및 작업내역"
                        >
                          <Paperclip className="h-3.5 w-3.5 shrink-0" />
                          {attachCnt > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-blue-600 px-[3px] text-[9px] font-semibold leading-none text-white ring-1 ring-white">
                              {attachCnt > 99 ? "99+" : attachCnt}
                            </span>
                          )}
                        </button>
                      ) : null}
                    </td>
                    {/* 진행률 */}
                    {gridColumnVisibility.progress && (
                      <td className="px-2 py-1.5">
                        {row.level === 'task' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden min-w-[50px]">
                              <div
                                className={cn("h-full rounded-full transition-all",
                                  row.progress >= 100 ? "bg-green-500" :
                                  row.status === 'delayed' ? "bg-red-500" :
                                  row.progress > 0 ? "bg-blue-500" : "bg-gray-300"
                                )}
                                style={{ width: `${row.progress || 0}%` }}
                              />
                            </div>
                            {progressInputId === row.id ? (
                              <input
                                type="number"
                                className="w-14 h-5 text-[11px] border border-blue-400 rounded px-1 text-center"
                                value={progressInputValue}
                                onChange={e => setProgressInputValue(e.target.value)}
                                onBlur={() => handleProgressSave(row.id, Number(progressInputValue))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleProgressSave(row.id, Number(progressInputValue));
                                  if (e.key === 'Escape') setProgressInputId(null);
                                }}
                                autoFocus
                                min={0} max={100}
                              />
                            ) : (
                              <button
                                className={cn("text-[11px] font-medium w-10 text-right flex-shrink-0 cursor-pointer hover:text-blue-600 hover:underline",
                                  row.progress >= 100 ? "text-green-600" :
                                  row.status === 'delayed' ? "text-red-600" :
                                  row.progress > 0 ? "text-blue-600" : "text-gray-400"
                                )}
                                onClick={() => {
                                  setProgressInputId(row.id);
                                  setProgressInputValue(String(row.progress || 0));
                                }}
                                title="클릭하여 진행률 수정"
                              >
                                {row.progress || 0}%
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden min-w-[50px]">
                              <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${row.progress || 0}%` }} />
                            </div>
                            <span className={cn("text-[11px] font-medium w-10 text-right flex-shrink-0",
                              cfg.textClass === 'text-white' ? 'text-white' : 'text-gray-600')}>
                              {Math.round(row.progress || 0)}%
                            </span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* 액션 아이콘 */}
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        {/* 편집 버튼 - 모든 레벨 */}
                        <button
                          onClick={() => startEditing(row)}
                          className={cn("transition-colors",
                            cfg.textClass === 'text-white' ? "text-white/40 hover:text-white/80" : "text-gray-400 hover:text-blue-500"
                          )}
                          title="수정 (더블클릭도 가능)"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {/* 하위 항목 추가 버튼 */}
                        {row.level !== 'task' && (
                          <button
                            onClick={() => {
                              const childLevel: WbsLevel = row.level === 'major' ? 'middle' : row.level === 'middle' ? 'minor' : row.level === 'minor' ? 'activity' : 'task';
                              setAddItemModal({ parentId: row.id, parentLevel: childLevel, parentName: row.name });
                            }}
                            className={cn("transition-colors",
                              cfg.textClass === 'text-white' ? "text-white/40 hover:text-white/80" : "text-gray-400 hover:text-green-500"
                            )}
                            title="하위 항목 추가"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => {
                            const childCount = getChildCount(row.id, wbsItems || []);
                            setDeleteConfirm({ id: row.id, name: row.name, childCount });
                          }}
                          className={cn("transition-colors",
                            cfg.textClass === 'text-white' ? "text-white/40 hover:text-red-300" : "text-gray-400 hover:text-red-500"
                          )}
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {/* 액티비티: 액션 아이콘 클릭 시 이슈/매뉴얼/성공/실패/VE 탭 모달 */}
                        {row.level === 'activity' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setActivityActionModal({ id: row.id, name: row.name })}
                              className={cn(
                                "relative inline-flex items-center justify-center rounded p-1 transition-colors",
                                issueCount > 0
                                  ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                  : cfg.textClass === "text-white"
                                    ? "text-white/50 hover:bg-white/10 hover:text-white/80"
                                    : "text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                              )}
                              title="이슈/매뉴얼/사례 보기"
                            >
                              <BarChart className="h-3 w-3 shrink-0" />
                              {issueCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-orange-600 px-[2px] text-[8px] font-semibold leading-none text-white ring-1 ring-white">
                                  {issueCount > 99 ? "99+" : issueCount}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIssueModalWbs({ id: row.id, name: row.name })}
                              className={cn(
                                "transition-colors",
                                cfg.textClass === "text-white"
                                  ? "text-white/40 hover:text-white/80"
                                  : "text-gray-400 hover:text-orange-500"
                              )}
                              title="이슈 등록"
                            >
                              <AlertCircle className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* 이슈 목록 보기 버튼 (이슈가 있을 때) */}
                            {issueCount > 0 && (
                              <button
                                onClick={() => setIssueListModal({ id: row.id, name: row.name, level: row.level })}
                                className="relative text-orange-500 hover:text-orange-600 transition-colors"
                                title="이슈 목록 보기"
                              >
                                <List className="w-3 h-3" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">
                                  {issueCount}
                                </span>
                              </button>
                            )}
                            {/* 이슈 등록 버튼 */}
                            <button
                              onClick={() => setIssueModalWbs({ id: row.id, name: row.name })}
                              className={cn(
                                "relative transition-colors",
                                cfg.textClass === 'text-white' ? "text-white/40 hover:text-white/80" :
                                "text-gray-400 hover:text-orange-500"
                              )}
                              title="이슈 등록"
                            >
                              <AlertCircle className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRows.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <Search className="w-8 h-8 opacity-30" />
              <span>검색 결과가 없습니다</span>
            </div>
          )}
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-white">
            총 {filteredRows.length}개 항목
          </div>
        </div>
      )}

      {/* Issue Create Modal */}
      {issueModalWbs && (
        <IssueCreateModal
          open={!!issueModalWbs}
          onClose={() => setIssueModalWbs(null)}
          projectId={projectId}
          wbsItemId={issueModalWbs.id}
          wbsItemName={issueModalWbs.name}
          users={users || []}
        />
      )}

      {projectUnresolvedModalOpen && (
        <ProjectUnresolvedIssuesModal
          onClose={() => setProjectUnresolvedModalOpen(false)}
          allIssues={issues || []}
          allWbsItems={wbsItems || []}
          users={users || []}
        />
      )}

      {/* 이슈 목록 취합 모달 */}
      {issueListModal && (
        <IssueListModal
          wbsItem={issueListModal}
          projectId={projectId}
          allIssues={issues || []}
          allWbsItems={wbsItems || []}
          users={users || []}
          onClose={() => setIssueListModal(null)}
          onCreateIssue={() => {
            setIssueListModal(null);
            setIssueModalWbs({ id: issueListModal.id, name: issueListModal.name });
          }}
        />
      )}

      {/* 산출물 팝업 */}
      {outputModalItem && (
        <OutputModal
          item={outputModalItem}
          projectId={projectId}
          onClose={() => setOutputModalItem(null)}
          onNotesUpdated={() => utils.wbs.list.invalidate({ projectId })}
          onAttachmentsChanged={() => {
            void utils.wbs.attachmentCountsByProject.invalidate({ projectId });
          }}
        />
      )}
      {/* 액티비티 액션 모달 (이슈+매뉴얼+성공사례+실패사례+VE사례) */}
      {activityActionModal && (
        <ActivityActionModal
          wbsItem={activityActionModal}
          projectId={projectId}
          allIssues={issues || []}
          allWbsItems={wbsItems || []}
          users={users || []}
          onClose={() => setActivityActionModal(null)}
          onCreateIssue={() => {
            setActivityActionModal(null);
            setIssueModalWbs({ id: activityActionModal.id, name: activityActionModal.name });
          }}
        />
      )}

      {/* 항목 추가 모달 */}
      {addItemModal && (
        <AddItemModal
          parentId={addItemModal.parentId}
          parentLevel={addItemModal.parentLevel}
          parentName={addItemModal.parentName}
          projectId={projectId}
          onClose={() => setAddItemModal(null)}
          onSave={(data) => createItem.mutate({ ...data, projectId })}
          isLoading={createItem.isPending}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-4 h-4" />
                항목 삭제
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">"{deleteConfirm.name}"</span>을(를) 삭제하시겠습니까?
              </p>
              {deleteConfirm.childCount > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ 하위 항목 {deleteConfirm.childCount}개도 함께 삭제됩니다.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>취소</Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteItem.mutate({ id: deleteConfirm.id, projectId })}
                disabled={deleteItem.isPending}
              >
                {deleteItem.isPending ? '삭제 중...' : '삭제'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 프로젝트 전체 미해결 이슈 모달 (상단 미해결 이슈 클릭)
// ─────────────────────────────────────────────
interface ProjectUnresolvedIssuesModalProps {
  allIssues: any[];
  allWbsItems: any[];
  users: any[];
  onClose: () => void;
}

function ProjectUnresolvedIssuesModal({ allIssues, allWbsItems, users, onClose }: ProjectUnresolvedIssuesModalProps) {
  const list = useMemo(
    () => allIssues.filter(i => isUnresolvedIssue(i.status)),
    [allIssues]
  );
  const wbsItemMap = useMemo(() => new Map(allWbsItems.map(i => [i.id, i])), [allWbsItems]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            미해결 이슈
            <span className="ml-auto text-xs text-muted-foreground font-normal">{list.length}건</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {list.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              미해결 이슈가 없습니다
            </div>
          ) : (
            list.map(issue => {
              const assignee = users.find(u => u.id === issue.assigneeId);
              const wbsName = issue.wbsItemId ? wbsItemMap.get(issue.wbsItemId)?.name : null;
              const priorityCfg = issuePriorityConfig[issue.priority] || issuePriorityConfig.medium;
              const statusCfg = issueStatusConfig[issue.status] || issueStatusConfig.open;
              return (
                <div
                  key={issue.id}
                  className="border border-gray-100 rounded-lg p-3 bg-white hover:border-gray-200 transition-colors cursor-pointer"
                  onClick={() => { window.location.href = `/issues?issueId=${issue.id}`; }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priorityCfg.color)}>
                          {priorityCfg.label}
                        </span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                        {wbsName && (
                          <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                            {wbsName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-800 mb-1">{issue.title}</p>
                      {issue.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-2">{issue.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {assignee && (
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <Avatar className="w-4 h-4">
                            <AvatarFallback className={cn("text-white text-[8px]", getAvatarColor(assignee.name))}>
                              {assignee.name?.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-gray-500">{assignee.name}</span>
                        </div>
                      )}
                      {issue.createdAt && (
                        <span className="text-[10px] text-gray-300">
                          {format(new Date(issue.createdAt), 'MM/dd')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <DialogFooter className="pt-2 border-t border-border gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// 이슈 목록 취합 모달
// ─────────────────────────────────────────────
interface IssueListModalProps {
  wbsItem: { id: number; name: string; level: string };
  projectId: number;
  allIssues: any[];
  allWbsItems: any[];
  users: any[];
  onClose: () => void;
  onCreateIssue: () => void;
}

function IssueListModal({ wbsItem, allIssues, allWbsItems, users, onClose, onCreateIssue }: IssueListModalProps) {
  // 해당 WBS 항목 및 모든 하위 항목 ID 수집
  const childrenMap = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const item of allWbsItems) {
      if (item.parentId) {
        const arr = map.get(item.parentId) || [];
        arr.push(item.id);
        map.set(item.parentId, arr);
      }
    }
    return map;
  }, [allWbsItems]);

  const collectIds = useCallback((id: number): number[] => {
    const children = childrenMap.get(id) || [];
    return [id, ...children.flatMap(c => collectIds(c))];
  }, [childrenMap]);

  const relatedIds = useMemo(() => new Set(collectIds(wbsItem.id)), [wbsItem.id, collectIds]);

  const relatedIssues = useMemo(() => {
    return allIssues.filter(i => i.wbsItemId && relatedIds.has(i.wbsItemId));
  }, [allIssues, relatedIds]);

  const wbsItemMap = useMemo(() => new Map(allWbsItems.map(i => [i.id, i])), [allWbsItems]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            이슈 목록
            <span className="text-muted-foreground font-normal">— {wbsItem.name}</span>
            <span className="ml-auto text-xs text-muted-foreground font-normal">{relatedIssues.length}건</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {relatedIssues.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              등록된 이슈가 없습니다
            </div>
          ) : (
            relatedIssues.map(issue => {
              const assignee = users.find(u => u.id === issue.assigneeId);
              const wbsName = wbsItemMap.get(issue.wbsItemId)?.name;
              const priorityCfg = issuePriorityConfig[issue.priority] || issuePriorityConfig.medium;
              const statusCfg = issueStatusConfig[issue.status] || issueStatusConfig.open;
              return (
                <div
                  key={issue.id}
                  className="border border-gray-100 rounded-lg p-3 bg-white hover:border-gray-200 transition-colors cursor-pointer"
                  onClick={() => { window.location.href = `/issues?issueId=${issue.id}`; }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priorityCfg.color)}>
                          {priorityCfg.label}
                        </span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                        {wbsName && wbsName !== wbsItem.name && (
                          <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                            {wbsName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-800 mb-1">{issue.title}</p>
                      {issue.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-2">{issue.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {assignee && (
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <Avatar className="w-4 h-4">
                            <AvatarFallback className={cn("text-white text-[8px]", getAvatarColor(assignee.name))}>
                              {assignee.name?.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-gray-500">{assignee.name}</span>
                        </div>
                      )}
                      {issue.createdAt && (
                        <span className="text-[10px] text-gray-300">
                          {format(new Date(issue.createdAt), 'MM/dd')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <DialogFooter className="pt-2 border-t border-border gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>닫기</Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5" onClick={onCreateIssue}>
            <Plus className="w-3 h-3" />새 이슈 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// 산출물 팝업 컴포넌트 (작업내역 + 다중파일 업로드 + 액티비티 탭)
// ─────────────────────────────────────────────
interface OutputModalProps {
  item: { id: number; name: string; notes: string | null; level: string };
  projectId: number;
  onClose: () => void;
  onNotesUpdated: () => void;
  /** 첨부 업로드·삭제 후 WBS 그리드 뱃지 갱신 */
  onAttachmentsChanged?: () => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />;
  if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-gray-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

type ActivityTab = 'work' | 'manual' | 'success' | 'failure' | 've';

const activityTabs: { id: ActivityTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'work', label: '작업내역', icon: <Paperclip className="w-3.5 h-3.5" />, color: 'text-blue-600' },
  { id: 'manual', label: '매뉴얼', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-purple-600' },
  { id: 'success', label: '성공사례', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-600' },
  { id: 'failure', label: '실패사례', icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-600' },
  { id: 've', label: 'VE사례', icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-yellow-600' },
];

function OutputModal({ item, projectId, onClose, onNotesUpdated, onAttachmentsChanged }: OutputModalProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<ActivityTab>('work');
  const [notes, setNotes] = useState(item.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isActivity = item.level === 'activity';

  const { data: attachments, refetch: refetchAttachments } = trpc.wbs.getAttachments.useQuery({ wbsItemId: item.id });

  const updateNotes = trpc.wbs.updateNotes.useMutation({
    onSuccess: () => {
      onNotesUpdated();
      toast.success('작업내역이 저장되었습니다.');
      setSavingNotes(false);
    },
    onError: () => { toast.error('저장 실패'); setSavingNotes(false); },
  });

  const uploadFile = trpc.wbs.uploadFile.useMutation({
    onSuccess: () => {
      void refetchAttachments();
      onAttachmentsChanged?.();
    },
    onError: () => toast.error('파일 업로드 실패'),
  });

  const deleteAttachment = trpc.wbs.deleteAttachment.useMutation({
    onSuccess: () => {
      void refetchAttachments();
      onAttachmentsChanged?.();
      toast.success('파일이 삭제되었습니다.');
    },
    onError: () => toast.error('삭제 실패'),
  });

  const handleSaveNotes = () => {
    setSavingNotes(true);
    updateNotes.mutate({ id: item.id, notes });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUploadAll = async () => {
    if (!pendingFiles.length || !isAuthenticated) return;
    setUploading(true);
    let successCount = 0;
    for (const file of pendingFiles) {
      try {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const base64 = (e.target?.result as string).split(',')[1];
              await uploadFile.mutateAsync({
                wbsItemId: item.id,
                fileName: file.name,
                fileData: base64,
                mimeType: file.type || 'application/octet-stream',
                fileSize: file.size,
              });
              successCount++;
              resolve();
            } catch { reject(); }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch { /* continue */ }
    }
    setPendingFiles([]);
    setUploading(false);
    if (successCount > 0) toast.success(`${successCount}개 파일이 업로드되었습니다.`);
  };

  // 탭별 첨부파일 필터링 (태그 기반 - 파일명에 탭 접두어 포함)
  const tabAttachments = useMemo(() => {
    if (!attachments) return [];
    if (!isActivity || activeTab === 'work') {
      // work 탭: 태그 없는 파일 또는 전체
      return isActivity
        ? attachments.filter((a: any) => !a.fileName.startsWith('[매뉴얼]') && !a.fileName.startsWith('[성공]') && !a.fileName.startsWith('[실패]') && !a.fileName.startsWith('[VE]'))
        : attachments;
    }
    const prefix = activeTab === 'manual' ? '[매뉴얼]' : activeTab === 'success' ? '[성공]' : activeTab === 'failure' ? '[실패]' : '[VE]';
    return attachments.filter((a: any) => a.fileName.startsWith(prefix));
  }, [attachments, activeTab, isActivity]);

  // 파일 업로드 시 탭 접두어 추가
  const getFileNameWithTag = (fileName: string) => {
    if (!isActivity || activeTab === 'work') return fileName;
    const prefix = activeTab === 'manual' ? '[매뉴얼]' : activeTab === 'success' ? '[성공]' : activeTab === 'failure' ? '[실패]' : '[VE]';
    return `${prefix}${fileName}`;
  };

  const handleUploadAllWithTag = async () => {
    if (!pendingFiles.length || !isAuthenticated) return;
    setUploading(true);
    let successCount = 0;
    for (const file of pendingFiles) {
      try {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const base64 = (e.target?.result as string).split(',')[1];
              await uploadFile.mutateAsync({
                wbsItemId: item.id,
                fileName: getFileNameWithTag(file.name),
                fileData: base64,
                mimeType: file.type || 'application/octet-stream',
                fileSize: file.size,
              });
              successCount++;
              resolve();
            } catch { reject(); }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch { /* continue */ }
    }
    setPendingFiles([]);
    setUploading(false);
    if (successCount > 0) toast.success(`${successCount}개 파일이 업로드되었습니다.`);
  };

  const currentTab = activityTabs.find(t => t.id === activeTab) || activityTabs[0];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Paperclip className="w-4 h-4 text-blue-500" />
            산출물 관리
            <span className="text-muted-foreground font-normal">— {item.name}</span>
            {isActivity && (
              <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">액티비티</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* 액티비티 탭 */}
        {isActivity && (
          <div className="flex items-center gap-0 border-b border-gray-200 -mx-1">
            {activityTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? `border-blue-500 text-blue-700 bg-blue-50/50`
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className={activeTab === tab.id ? tab.color : ''}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* 작업내역 (work 탭 또는 비액티비티) */}
          {(!isActivity || activeTab === 'work') && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">작업내역</Label>
              <Textarea
                placeholder="작업 내용, 특이사항, 검토 결과 등을 입력하세요..."
                className="text-xs min-h-[100px] resize-none"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={!isAuthenticated}
              />
              {isAuthenticated && (
                <div className="flex justify-end">
                  <Button size="sm" className="h-7 text-xs" onClick={handleSaveNotes} disabled={savingNotes}>
                    {savingNotes ? '저장 중...' : '저장'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 액티비티 탭별 안내 (매뉴얼/성공/실패/VE) */}
          {isActivity && activeTab !== 'work' && (
            <div className="space-y-2">
              <div className={cn("flex items-center gap-2 p-3 rounded-lg border text-xs",
                activeTab === 'manual' ? "bg-purple-50 border-purple-100 text-purple-700" :
                activeTab === 'success' ? "bg-green-50 border-green-100 text-green-700" :
                activeTab === 'failure' ? "bg-red-50 border-red-100 text-red-700" :
                "bg-yellow-50 border-yellow-100 text-yellow-700"
              )}>
                <span>{currentTab.icon}</span>
                <span>
                  {activeTab === 'manual' && '이 액티비티와 관련된 매뉴얼, 지침서, 절차서 등을 첨부하세요.'}
                  {activeTab === 'success' && '유사 공사의 성공 사례, 우수 시공 사례 등을 첨부하세요.'}
                  {activeTab === 'failure' && '과거 실패 사례, 하자 사례, 주의 사항 등을 첨부하세요.'}
                  {activeTab === 've' && 'VE(Value Engineering) 검토 사례, 원가 절감 사례 등을 첨부하세요.'}
                </span>
              </div>
            </div>
          )}

          {/* 파일 업로드 영역 */}
          {isAuthenticated && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">파일 첨부</Label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50/30'); }}
                onDragLeave={e => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/30'); }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/30');
                  const files = Array.from(e.dataTransfer.files);
                  setPendingFiles(prev => [...prev, ...files]);
                }}
              >
                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">클릭하거나 파일을 드래그하여 업로드</p>
                <p className="text-[10px] text-gray-300 mt-0.5">다중 파일 선택 가능</p>
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

              {pendingFiles.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] text-gray-500 font-medium">업로드 대기 ({pendingFiles.length}개)</div>
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-xs border border-blue-100">
                      {getFileIcon(f.type)}
                      <span className="flex-1 truncate text-gray-700">{f.name}</span>
                      <span className="text-gray-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                      <button onClick={() => removePendingFile(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <Button size="sm" className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleUploadAllWithTag} disabled={uploading}>
                    {uploading ? '업로드 중...' : `${pendingFiles.length}개 파일 업로드`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 첨부 파일 목록 */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700">
              첨부된 파일 {tabAttachments.length > 0 ? `(${tabAttachments.length}개)` : ''}
            </Label>
            {tabAttachments.length > 0 ? (
              <div className="space-y-1">
                {tabAttachments.map((a: any) => {
                  // 파일명에서 태그 접두어 제거하여 표시
                  const displayName = a.fileName.replace(/^\[(매뉴얼|성공|실패|VE)\]/, '');
                  return (
                    <div key={a.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs border border-gray-100 group">
                      {getFileIcon(a.mimeType || '')}
                      <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-blue-600 hover:underline truncate">
                        {displayName}
                      </a>
                      {a.fileSize && <span className="text-gray-400 flex-shrink-0">{formatFileSize(a.fileSize)}</span>}
                      <span className="text-gray-300 flex-shrink-0 text-[10px]">
                        {a.createdAt ? format(new Date(a.createdAt), 'MM/dd') : ''}
                      </span>
                      {isAuthenticated && (
                        <button
                          onClick={() => deleteAttachment.mutate({ attachmentId: a.id })}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-300 text-xs">
                <Paperclip className="w-6 h-6 mx-auto mb-1 opacity-40" />
                첨부된 파일이 없습니다
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// 액티비티 액션 모달 (이슈 + 매뉴얼 + 성공사례 + 실패사례 + VE사례)
// ─────────────────────────────────────────────
interface ActivityActionModalProps {
  wbsItem: { id: number; name: string };
  projectId: number;
  allIssues: any[];
  allWbsItems: any[];
  users: any[];
  onClose: () => void;
  onCreateIssue: () => void;
}

type ActivityActionTab = 'issues' | 'manual' | 'success' | 'failure' | 've';

const activityActionTabs: { id: ActivityActionTab; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
  { id: 'issues', label: '이슈', icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-orange-500', activeColor: 'border-orange-500 text-orange-600 bg-orange-50/50' },
  { id: 'manual', label: '매뉴얼', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-purple-500', activeColor: 'border-purple-500 text-purple-600 bg-purple-50/50' },
  { id: 'success', label: '성공사례', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-500', activeColor: 'border-green-500 text-green-600 bg-green-50/50' },
  { id: 'failure', label: '실패사례', icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-500', activeColor: 'border-red-500 text-red-600 bg-red-50/50' },
  { id: 've', label: 'VE사례', icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-yellow-500', activeColor: 'border-yellow-500 text-yellow-600 bg-yellow-50/50' },
];

function ActivityActionModal({ wbsItem, projectId, allIssues, allWbsItems, users, onClose, onCreateIssue }: ActivityActionModalProps) {
  const [activeTab, setActiveTab] = useState<ActivityActionTab>('issues');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: attachments, refetch: refetchAttachments } = trpc.wbs.getAttachments.useQuery({ wbsItemId: wbsItem.id });
  const uploadFile = trpc.wbs.uploadFile.useMutation({
    onSuccess: () => refetchAttachments(),
    onError: () => toast.error('파일 업로드 실패'),
  });
  const deleteAttachment = trpc.wbs.deleteAttachment.useMutation({
    onSuccess: () => { refetchAttachments(); toast.success('파일이 삭제되었습니다.'); },
    onError: () => toast.error('삭제 실패'),
  });

  // 하위 항목 ID 수집
  const childrenMap = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const item of allWbsItems) {
      if (item.parentId) {
        const arr = map.get(item.parentId) || [];
        arr.push(item.id);
        map.set(item.parentId, arr);
      }
    }
    return map;
  }, [allWbsItems]);

  const collectIds = useCallback((id: number): number[] => {
    const children = childrenMap.get(id) || [];
    return [id, ...children.flatMap((c: number) => collectIds(c))];
  }, [childrenMap]);

  const relatedIds = useMemo(() => new Set(collectIds(wbsItem.id)), [wbsItem.id, collectIds]);
  const relatedIssues = useMemo(() => allIssues.filter((i: any) => i.wbsItemId && relatedIds.has(i.wbsItemId)), [allIssues, relatedIds]);
  const relatedUnresolvedIssues = useMemo(
    () => relatedIssues.filter((i: any) => isUnresolvedIssue(i.status)),
    [relatedIssues]
  );
  const wbsItemMap = useMemo(() => new Map(allWbsItems.map((i: any) => [i.id, i])), [allWbsItems]);

  const tabPrefix = activeTab === 'manual' ? '[매뉴얼]' : activeTab === 'success' ? '[성공]' : activeTab === 'failure' ? '[실패]' : '[VE]';
  const tabAttachments = useMemo(() => {
    if (!attachments || activeTab === 'issues') return [];
    return (attachments as any[]).filter((a: any) => a.fileName.startsWith(tabPrefix));
  }, [attachments, activeTab, tabPrefix]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAll = async () => {
    if (!pendingFiles.length) return;
    setUploading(true);
    let successCount = 0;
    for (const file of pendingFiles) {
      try {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const base64 = (e.target?.result as string).split(',')[1];
              await uploadFile.mutateAsync({
                wbsItemId: wbsItem.id,
                fileName: `${tabPrefix}${file.name}`,
                fileData: base64,
                mimeType: file.type || 'application/octet-stream',
                fileSize: file.size,
              });
              successCount++;
              resolve();
            } catch { reject(); }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch { /* continue */ }
    }
    setPendingFiles([]);
    setUploading(false);
    if (successCount > 0) toast.success(`${successCount}개 파일이 업로드되었습니다.`);
  };

  const currentTabCfg = activityActionTabs.find(t => t.id === activeTab)!;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <BarChart className="w-4 h-4 text-blue-500" />
            액티비티 관리
            <span className="text-muted-foreground font-normal">— {wbsItem.name}</span>
            <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">액티비티</span>
          </DialogTitle>
        </DialogHeader>

        {/* 탭 네비게이션 */}
        <div className="flex items-center gap-0 border-b border-gray-200 -mx-1">
          {activityActionTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? tab.activeColor
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <span className={activeTab === tab.id ? tab.color : ''}>{tab.icon}</span>
              {tab.label}
              {tab.id === 'issues' && relatedUnresolvedIssues.length > 0 && (
                <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] font-semibold text-white">
                  {relatedUnresolvedIssues.length > 99 ? '99+' : relatedUnresolvedIssues.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* 이슈 탭 */}
          {activeTab === 'issues' && (
            <div className="space-y-2 pt-1">
              {relatedIssues.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>등록된 이슈가 없습니다</p>
                  <p className="text-xs mt-1 text-gray-300">하위 테스크의 이슈도 여기에 취합됩니다</p>
                </div>
              ) : (
                relatedIssues.map((issue: any) => {
                  const assignee = users.find((u: any) => u.id === issue.assigneeId);
                  const wbsName = wbsItemMap.get(issue.wbsItemId)?.name;
                  const priorityCfg = issuePriorityConfig[issue.priority] || issuePriorityConfig.medium;
                  const statusCfg = issueStatusConfig[issue.status] || issueStatusConfig.open;
                  return (
                    <div
                      key={issue.id}
                      className="border border-gray-100 rounded-lg p-3 bg-white hover:border-gray-200 transition-colors cursor-pointer"
                      onClick={() => { window.location.href = `/issues?issueId=${issue.id}`; }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priorityCfg.color)}>{priorityCfg.label}</span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", statusCfg.color)}>{statusCfg.label}</span>
                            {wbsName && wbsName !== wbsItem.name && (
                              <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{wbsName}</span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-800 mb-1">{issue.title}</p>
                          {issue.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-2">{issue.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {assignee && (
                            <div className="flex items-center gap-1 justify-end mb-1">
                              <Avatar className="w-4 h-4">
                                <AvatarFallback className={cn("text-white text-[8px]", getAvatarColor(assignee.name))}>
                                  {assignee.name?.slice(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] text-gray-500">{assignee.name}</span>
                            </div>
                          )}
                          {issue.createdAt && (
                            <span className="text-[10px] text-gray-300">{format(new Date(issue.createdAt), 'MM/dd')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 매뉴얼 / 성공사례 / 실패사례 / VE사례 탭 */}
          {activeTab !== 'issues' && (
            <div className="space-y-4 pt-1">
              <div className={cn("flex items-center gap-2 p-3 rounded-lg border text-xs",
                activeTab === 'manual' ? "bg-purple-50 border-purple-100 text-purple-700" :
                activeTab === 'success' ? "bg-green-50 border-green-100 text-green-700" :
                activeTab === 'failure' ? "bg-red-50 border-red-100 text-red-700" :
                "bg-yellow-50 border-yellow-100 text-yellow-700"
              )}>
                <span className={currentTabCfg.color}>{currentTabCfg.icon}</span>
                <span>
                  {activeTab === 'manual' && '이 액티비티와 관련된 매뉴얼, 지침서, 절차서 등을 첨부하세요.'}
                  {activeTab === 'success' && '유사 공사의 성공 사례, 우수 시공 사례 등을 첨부하세요.'}
                  {activeTab === 'failure' && '과거 실패 사례, 하자 사례, 주의 사항 등을 첨부하세요.'}
                  {activeTab === 've' && 'VE(Value Engineering) 검토 사례, 원가 절감 사례 등을 첨부하세요.'}
                </span>
              </div>

              <div className="space-y-2">
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50/30'); }}
                  onDragLeave={e => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/30'); }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/30');
                    setPendingFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                  }}
                >
                  <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">클릭하거나 파일을 드래그하여 업로드</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">다중 파일 선택 가능</p>
                </div>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

                {pendingFiles.length > 0 && (
                  <div className="space-y-1">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-xs">
                        <File className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="flex-1 truncate text-blue-700">{f.name}</span>
                        <span className="text-blue-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                        <button onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} className="text-blue-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <Button size="sm" className="w-full h-7 text-xs" onClick={handleUploadAll} disabled={uploading}>
                      {uploading ? '업로드 중...' : `${pendingFiles.length}개 파일 업로드`}
                    </Button>
                  </div>
                )}
              </div>

              {tabAttachments.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-600">첨부 파일 ({tabAttachments.length})</p>
                  {tabAttachments.map((att: any) => (
                    <div key={att.id} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg bg-white hover:border-gray-200 transition-colors text-xs">
                      {getFileIcon(att.mimeType || '')}
                      <a href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-1 truncate text-blue-600 hover:underline">
                        {att.fileName.replace(/^\[(매뉴얼|성공|실패|VE)\]/, '')}
                      </a>
                      <span className="text-gray-300 flex-shrink-0">{att.fileSize ? formatFileSize(att.fileSize) : ''}</span>
                      <button onClick={() => deleteAttachment.mutate({ attachmentId: att.id })} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tabAttachments.length === 0 && pendingFiles.length === 0 && (
                <div className="text-center py-6 text-gray-300 text-xs">
                  <File className="w-8 h-8 mx-auto mb-1 opacity-30" />
                  첨부된 파일이 없습니다
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>닫기</Button>
          {activeTab === 'issues' && (
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5" onClick={onCreateIssue}>
              <Plus className="w-3 h-3" />새 이슈 등록
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// 항목 추가 모달
// ─────────────────────────────────────────────
interface AddItemModalProps {
  parentId: number | null;
  parentLevel: WbsLevel | null;
  parentName: string;
  projectId: number;
  onClose: () => void;
  onSave: (data: { parentId: number | null; level: WbsLevel; name: string; planStart: string | null; planEnd: string | null }) => void;
  isLoading: boolean;
}

const levelLabels: Record<WbsLevel, string> = {
  major: '대공종',
  middle: '중공종',
  minor: '소공종',
  activity: '액티비티',
  task: '테스크',
};

function AddItemModal({ parentId, parentLevel, parentName, onClose, onSave, isLoading }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [planStart, setPlanStart] = useState('');
  const [planEnd, setPlanEnd] = useState('');

  const levelLabel = parentLevel ? levelLabels[parentLevel] : '항목';

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('작업명을 입력하세요.');
      return;
    }
    if (planStart && planEnd && planStart > planEnd) {
      toast.error('계획 시작일은 종료일보다 이전이어야 합니다.');
      return;
    }
    onSave({
      parentId,
      level: parentLevel || 'task',
      name: name.trim(),
      planStart: planStart || null,
      planEnd: planEnd || null,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4 text-green-500" />
            {levelLabel} 추가
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {parentId && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 border border-gray-100">
              <span className="font-medium text-gray-700">상위 항목:</span> {parentName}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">작업명 <span className="text-red-500">*</span></Label>
            <Input
              placeholder={`${levelLabel} 이름을 입력하세요`}
              className="text-sm h-8"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              autoFocus
            />
          </div>
          {(parentLevel === 'activity' || parentLevel === 'task') && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">계획 시작일</Label>
                <Input
                  type="date"
                  className="text-sm h-8"
                  value={planStart}
                  onChange={e => setPlanStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">계획 종료일</Label>
                <Input
                  type="date"
                  className="text-sm h-8"
                  value={planEnd}
                  onChange={e => setPlanEnd(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>취소</Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSubmit}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? '추가 중...' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
