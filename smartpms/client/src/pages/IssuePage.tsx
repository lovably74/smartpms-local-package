import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertTriangle, Plus, Search, Filter, MessageSquare,
  CheckCircle2, Clock, XCircle, User, Calendar, RefreshCw,
  ChevronDown, MoreHorizontal, Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import IssueCreateModal from "@/components/IssueCreateModal";

interface IssuePageProps {
  projectId?: number;
}

const statusConfig = {
  open: { label: '미해결', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  in_progress: { label: '처리중', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  resolved: { label: '완료', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  closed: { label: '종결', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const typeConfig = {
  risk: { label: '리스크', color: 'bg-red-100 text-red-700' },
  defect: { label: '결함', color: 'bg-orange-100 text-orange-700' },
  request: { label: '요청', color: 'bg-blue-100 text-blue-700' },
  question: { label: '질문', color: 'bg-purple-100 text-purple-700' },
  other: { label: '기타', color: 'bg-gray-100 text-gray-600' },
};

const priorityConfig = {
  critical: { label: '긴급', color: 'text-red-600 font-bold' },
  high: { label: '높음', color: 'text-orange-600 font-semibold' },
  medium: { label: '보통', color: 'text-yellow-600' },
  low: { label: '낮음', color: 'text-green-600' },
};

function getAvatarColor(name: string | null | undefined) {
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500", "bg-teal-500"];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function IssuePage({ projectId = 1 }: IssuePageProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentText, setCommentText] = useState('');
  const [editStatus, setEditStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('open');
  const [editCompletedAt, setEditCompletedAt] = useState('');
  const [editResolutionContent, setEditResolutionContent] = useState('');

  const { data: issues, isLoading } = trpc.issues.list.useQuery({ projectId });
  const { data: users } = trpc.users.list.useQuery();
  const { data: comments } = trpc.issues.comments.list.useQuery(
    { issueId: selectedIssue?.id ?? 0 },
    { enabled: !!selectedIssue }
  );

  const updateIssue = trpc.issues.update.useMutation({
    onSuccess: () => {
      utils.issues.list.invalidate({ projectId });
      toast.success('이슈가 수정되었습니다.');
    },
  });

  useEffect(() => {
    if (!selectedIssue) return;
    setEditStatus(selectedIssue.status);
    setEditCompletedAt(selectedIssue.completedAt ? String(selectedIssue.completedAt).slice(0, 10) : "");
    setEditResolutionContent(selectedIssue.resolutionContent ?? "");
  }, [selectedIssue]);

  useEffect(() => {
    // /issues?issueId=123 으로 진입 시 자동 선택
    if (!issues || selectedIssue) return;
    const issueId = Number(new URLSearchParams(window.location.search).get("issueId"));
    if (!Number.isFinite(issueId) || issueId <= 0) return;
    const target = issues.find(i => i.id === issueId);
    if (target) setSelectedIssue(target);
  }, [issues, selectedIssue]);

  const canSaveIssueEdit = useMemo(() => {
    if (!selectedIssue) return false;
    if (editStatus !== "resolved") return true;
    return Boolean(editCompletedAt && editResolutionContent.trim());
  }, [selectedIssue, editStatus, editCompletedAt, editResolutionContent]);

  const addComment = trpc.issues.comments.create.useMutation({
    onSuccess: () => {
      utils.issues.comments.list.invalidate({ issueId: selectedIssue?.id });
      setCommentText('');
      toast.success('댓글이 등록되었습니다.');
    },
  });

  const filteredIssues = (issues || []).filter(issue => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!issue.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openCount = issues?.filter(i => i.status === 'open').length ?? 0;
  const inProgressCount = issues?.filter(i => i.status === 'in_progress').length ?? 0;
  const resolvedCount = issues?.filter(i => i.status === 'resolved').length ?? 0;

  return (
    <div className="flex h-full bg-gray-50">
      {/* Issue List */}
      <div className={cn("flex flex-col", selectedIssue ? "w-1/2 border-r border-border" : "flex-1")}>
        {/* Header */}
        <div className="bg-white border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-semibold text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              이슈 관리
            </h1>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-3 h-3" />이슈 등록
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                statusFilter === 'all' ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              전체 {issues?.length ?? 0}
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                statusFilter === 'open' ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100")}
            >
              미해결 {openCount}
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                statusFilter === 'in_progress' ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100")}
            >
              처리중 {inProgressCount}
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                statusFilter === 'resolved' ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100")}
            >
              완료 {resolvedCount}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="이슈 검색..."
              className="pl-8 h-8 text-xs"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Issue List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">로딩 중...</div>
          ) : filteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <AlertTriangle className="w-8 h-8 opacity-30" />
              <span>이슈가 없습니다</span>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredIssues.map(issue => {
                const statusCfg = statusConfig[issue.status as keyof typeof statusConfig] || statusConfig.open;
                const typeCfg = typeConfig[issue.type as keyof typeof typeConfig] || typeConfig.other;
                const priorityCfg = priorityConfig[issue.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                const assignee = users?.find(u => u.id === issue.assigneeId);
                const reporter = users?.find(u => u.id === issue.reporterId);

                return (
                  <div
                    key={issue.id}
                    className={cn(
                      "px-4 py-3 cursor-pointer hover:bg-blue-50/30 transition-colors",
                      selectedIssue?.id === issue.id && "bg-blue-50"
                    )}
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", typeCfg.color)}>
                            {typeCfg.label}
                          </Badge>
                          <span className={cn("text-[10px]", priorityCfg.color)}>
                            {priorityCfg.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">#{issue.id}</span>
                        </div>
                        <p className="text-sm font-medium leading-tight truncate">{issue.title}</p>
                        {issue.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{issue.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full", statusCfg.color)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                            {statusCfg.label}
                          </span>
                          {assignee && (
                            <div className="flex items-center gap-1">
                              <Avatar className="w-4 h-4">
                                <AvatarFallback className={cn("text-white text-[8px]", getAvatarColor(assignee.name))}>
                                  {assignee.name?.slice(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] text-muted-foreground">{assignee.name}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {format(new Date(issue.createdAt), 'MM/dd', { locale: ko })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Issue Detail Panel */}
      {selectedIssue && (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">이슈 상세</h2>
            <button
              onClick={() => setSelectedIssue(null)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              ✕ 닫기
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Title & Status */}
            <div>
              <div className="flex items-start gap-2 mb-2">
                <Badge variant="outline" className={cn("text-[10px]", typeConfig[selectedIssue.type as keyof typeof typeConfig]?.color)}>
                  {typeConfig[selectedIssue.type as keyof typeof typeConfig]?.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">#{selectedIssue.id}</span>
              </div>
              <h3 className="font-semibold text-base">{selectedIssue.title}</h3>
              {selectedIssue.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedIssue.description}</p>
              )}
            </div>

            {/* Issue Edit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">상태 변경</Label>
                <Select
                  value={editStatus}
                  onValueChange={v => {
                    const next = v as 'open' | 'in_progress' | 'resolved' | 'closed';
                    setEditStatus(next);
                    // 완료 -> 미해결/처리중/종결 시 완료일/처리내용 초기화
                    if (next !== 'resolved') {
                      setEditCompletedAt('');
                      setEditResolutionContent('');
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open" className="text-xs">미해결</SelectItem>
                    <SelectItem value="in_progress" className="text-xs">처리중</SelectItem>
                    <SelectItem value="resolved" className="text-xs">해결됨</SelectItem>
                    <SelectItem value="closed" className="text-xs">종결</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">우선순위</Label>
                <div className={cn("mt-1 text-sm font-medium", priorityConfig[selectedIssue.priority as keyof typeof priorityConfig]?.color)}>
                  {priorityConfig[selectedIssue.priority as keyof typeof priorityConfig]?.label}
                </div>
              </div>
            </div>

            {editStatus === 'resolved' && (
              <div className="space-y-3 rounded-md border border-green-100 bg-green-50/40 p-3">
                <div>
                  <Label className="text-xs">완료일</Label>
                  <Input
                    type="date"
                    className="h-8 text-xs mt-1"
                    value={editCompletedAt}
                    onChange={e => setEditCompletedAt(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">처리내용</Label>
                  <Textarea
                    className="text-xs mt-1"
                    rows={3}
                    value={editResolutionContent}
                    onChange={e => setEditResolutionContent(e.target.value)}
                    placeholder="완료 처리 내용/조치 사항을 입력하세요."
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={!isAuthenticated || !canSaveIssueEdit || updateIssue.isPending}
                onClick={() => {
                  if (!isAuthenticated || !selectedIssue) {
                    toast.error('로그인 후 수정 가능합니다');
                    return;
                  }
                  if (editStatus === 'resolved' && (!editCompletedAt || !editResolutionContent.trim())) {
                    toast.error('완료일과 처리내용을 입력하세요');
                    return;
                  }

                  updateIssue.mutate({
                    id: selectedIssue.id,
                    status: editStatus,
                    completedAt: editStatus === 'resolved' ? editCompletedAt : null,
                    resolutionContent: editStatus === 'resolved' ? editResolutionContent.trim() : null,
                  }, {
                    onSuccess: () => {
                      setSelectedIssue({
                        ...selectedIssue,
                        status: editStatus,
                        completedAt: editStatus === 'resolved' ? editCompletedAt : null,
                        resolutionContent: editStatus === 'resolved' ? editResolutionContent.trim() : null,
                      });
                    },
                  });
                }}
              >
                {updateIssue.isPending ? '저장 중...' : '이슈 수정 저장'}
              </Button>
            </div>

            {/* Meta Info */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">담당자</span>
                {users?.find(u => u.id === selectedIssue.assigneeId) ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className={cn("text-white text-[9px]", getAvatarColor(users?.find(u => u.id === selectedIssue.assigneeId)?.name))}>
                        {users?.find(u => u.id === selectedIssue.assigneeId)?.name?.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{users?.find(u => u.id === selectedIssue.assigneeId)?.name}</span>
                  </div>
                ) : <span className="text-muted-foreground">미지정</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">등록자</span>
                <span>{users?.find(u => u.id === selectedIssue.reporterId)?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">등록일</span>
                <span>{format(new Date(selectedIssue.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}</span>
              </div>
              {selectedIssue.dueDate && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">마감일</span>
                  <span>{format(new Date(selectedIssue.dueDate), 'yyyy-MM-dd', { locale: ko })}</span>
                </div>
              )}
              {selectedIssue.completedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">완료일</span>
                  <span>{format(new Date(selectedIssue.completedAt), 'yyyy-MM-dd', { locale: ko })}</span>
                </div>
              )}
              {selectedIssue.resolutionContent && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-16 mt-0.5">처리내용</span>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{selectedIssue.resolutionContent}</p>
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <Label className="text-xs font-semibold mb-2 block">댓글 ({comments?.length ?? 0})</Label>
              <div className="space-y-2 mb-3">
                  {comments?.map((comment: any) => {
                    const author = users?.find(u => u.id === comment.authorId);
                  return (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarFallback className={cn("text-white text-[9px]", getAvatarColor(author?.name))}>
                          {author?.name?.slice(0, 1) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{author?.name || '알 수 없음'}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MM/dd HH:mm', { locale: ko })}
                          </span>
                        </div>
                        <p className="text-xs">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isAuthenticated ? (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="댓글을 입력하세요..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                  <Button
                    size="sm"
                    className="self-end h-8 text-xs"
                    onClick={() => {
                      if (commentText.trim()) {
                        addComment.mutate({ issueId: selectedIssue.id as number, content: commentText });
                      }
                    }}
                    disabled={!commentText.trim() || addComment.isPending}
                  >
                    등록
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">로그인 후 댓글을 작성할 수 있습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <IssueCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          projectId={projectId}
          users={users || []}
        />
      )}
    </div>
  );
}
