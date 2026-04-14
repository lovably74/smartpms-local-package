import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Settings, User, Bell, Shield, Phone, Mail, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SettingsPageProps {
  projectId?: number;
}

function getAvatarColor(name: string | null | undefined) {
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500", "bg-teal-500"];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function SettingsPage({ projectId = 1 }: SettingsPageProps) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: users } = trpc.users.list.useQuery();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('프로필이 업데이트되었습니다.');
      utils.users.list.invalidate();
    },
    onError: (err) => toast.error(`업데이트 실패: ${err.message}`),
  });

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full max-w-2xl">
      <h1 className="font-bold text-lg flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-600" />
        설정
      </h1>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4" />내 프로필
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={cn("text-white text-lg", getAvatarColor(user.name))}>
                    {user.name?.slice(0, 1) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground">{user.role === 'admin' ? '관리자' : '사용자'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Phone className="w-3 h-3" />휴대폰 번호
                  </Label>
                  <Input
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Mail className="w-3 h-3" />이메일
                  </Label>
                  <Input
                    placeholder="email@example.com"
                    value={email || user.email || ''}
                    onChange={e => setEmail(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => updateProfile.mutate({ phone: phone || undefined })}
                disabled={updateProfile.isPending}
              >
                <Save className="w-3 h-3" />저장
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">로그인 후 프로필을 관리할 수 있습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-xs">이슈 등록 알림</div>
                <div className="text-[11px] text-muted-foreground">새 이슈 등록 시 담당자에게 이메일/SMS 발송</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500" title="활성화됨" />
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-xs">이슈 상태 변경 알림</div>
                <div className="text-[11px] text-muted-foreground">이슈 상태 변경 시 관련자에게 알림 발송</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500" title="활성화됨" />
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-xs">댓글 알림</div>
                <div className="text-[11px] text-muted-foreground">이슈에 댓글 등록 시 담당자에게 알림 발송</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500" title="활성화됨" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            * 알림 발송을 위해 프로필에서 이메일 및 휴대폰 번호를 등록해 주세요.
          </p>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />팀 구성원
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users?.map(u => (
              <div key={u.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className={cn("text-white text-xs", getAvatarColor(u.name))}>
                    {u.name?.slice(0, 1) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{u.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                )}>
                  {u.role === 'admin' ? '관리자' : '사용자'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
