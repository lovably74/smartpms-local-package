import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Link2 } from "lucide-react";

interface User {
  id: number;
  name: string | null;
  email: string | null;
}

interface IssueCreateModalProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  wbsItemId?: number;
  wbsItemName?: string;
  users: User[];
}

const issueTypes = [
  { value: 'risk', label: '리스크', color: 'bg-red-100 text-red-700' },
  { value: 'defect', label: '결함', color: 'bg-orange-100 text-orange-700' },
  { value: 'request', label: '요청', color: 'bg-blue-100 text-blue-700' },
  { value: 'question', label: '질문', color: 'bg-purple-100 text-purple-700' },
  { value: 'other', label: '기타', color: 'bg-gray-100 text-gray-700' },
];

const priorities = [
  { value: 'critical', label: '긴급', color: 'text-red-600' },
  { value: 'high', label: '높음', color: 'text-orange-600' },
  { value: 'medium', label: '보통', color: 'text-yellow-600' },
  { value: 'low', label: '낮음', color: 'text-green-600' },
];

export default function IssueCreateModal({
  open, onClose, projectId, wbsItemId, wbsItemName, users
}: IssueCreateModalProps) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'risk' as string,
    priority: 'medium' as string,
    assigneeId: '' as string,
    dueDate: '',
  });

  const createIssue = trpc.issues.create.useMutation({
    onSuccess: () => {
      utils.issues.list.invalidate({ projectId });
      utils.notifications.unreadCount.invalidate();
      toast.success('이슈가 등록되었습니다. 담당자에게 알림이 발송됩니다.');
      onClose();
    },
    onError: (err) => toast.error(`이슈 등록 실패: ${err.message}`),
  });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('제목을 입력하세요'); return; }
    createIssue.mutate({
      projectId,
      wbsItemId: wbsItemId,
      title: form.title,
      description: form.description || undefined,
      type: form.type as any,
      priority: form.priority as any,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : undefined,
      dueDate: form.dueDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            이슈 등록
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* WBS Link */}
          {wbsItemName && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
              <Link2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-xs text-blue-700 font-medium">연결된 WBS: {wbsItemName}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">제목 <span className="text-red-500">*</span></Label>
            <Input
              placeholder="이슈 제목을 입력하세요"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="text-sm"
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">유형</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">우선순위</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">
                      <span className={p.color}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">담당자</Label>
              <Select value={form.assigneeId} onValueChange={v => setForm(f => ({ ...f, assigneeId: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="담당자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={String(u.id)} className="text-xs">
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">마감일</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">설명</Label>
            <Textarea
              placeholder="이슈에 대한 상세 내용을 입력하세요..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            * 이슈 등록 시 담당자에게 이메일/SMS 알림이 자동으로 발송됩니다.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createIssue.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createIssue.isPending ? '등록 중...' : '이슈 등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
