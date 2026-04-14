import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Bell, X, Check, CheckCheck, AlertCircle, MessageSquare, RefreshCw, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const notifTypeConfig = {
  issue_created: { icon: AlertCircle, color: "text-blue-500", label: "이슈 등록" },
  issue_comment: { icon: MessageSquare, color: "text-green-500", label: "댓글" },
  issue_status_changed: { icon: RefreshCw, color: "text-orange-500", label: "상태 변경" },
  issue_assigned: { icon: UserCheck, color: "text-purple-500", label: "담당자 배정" },
  wbs_updated: { icon: RefreshCw, color: "text-gray-500", label: "WBS 업데이트" },
};

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && open }
  );

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  if (!open) return null;

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">알림</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="w-3 h-3" />
                모두 읽음
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              로딩 중...
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <Bell className="w-8 h-8 opacity-30" />
              <span>로그인 후 알림을 확인하세요</span>
            </div>
          ) : notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <Bell className="w-8 h-8 opacity-30" />
              <span>새로운 알림이 없습니다</span>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications?.map(notif => {
                const config = notifTypeConfig[notif.type] || notifTypeConfig.wbs_updated;
                const Icon = config.icon;
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notif.isRead && "bg-blue-50/50"
                    )}
                    onClick={() => {
                      if (!notif.isRead) markRead.mutate({ id: notif.id });
                    }}
                  >
                    <div className={cn("mt-0.5 flex-shrink-0", config.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn("text-sm leading-tight", !notif.isRead && "font-medium")}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      {notif.content && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.content}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5">
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(notif.createdAt), 'MM/dd HH:mm', { locale: ko })}
                        </span>
                        {notif.emailSent && (
                          <span className="text-[10px] text-green-500">이메일 발송</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
