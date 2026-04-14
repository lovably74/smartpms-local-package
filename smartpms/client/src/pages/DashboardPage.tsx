import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Users, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DashboardPageProps {
  projectId?: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const statusLabels: Record<string, string> = {
  open: '미해결', in_progress: '처리중', resolved: '해결됨', closed: '종결'
};
const typeLabels: Record<string, string> = {
  risk: '리스크', defect: '결함', request: '요청', question: '질문', other: '기타'
};
const priorityLabels: Record<string, string> = {
  critical: '긴급', high: '높음', medium: '보통', low: '낮음'
};

function getAvatarColor(name: string | null | undefined) {
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500", "bg-teal-500"];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function DashboardPage({ projectId = 1 }: DashboardPageProps) {
  const { data: stats } = trpc.issues.stats.useQuery({ projectId });
  const { data: wbsItems } = trpc.wbs.list.useQuery({ projectId });
  const { data: users } = trpc.users.list.useQuery();
  const { data: issues } = trpc.issues.list.useQuery({ projectId });

  const taskItems = wbsItems?.filter(i => i.level === 'task') ?? [];
  const overallProgress = taskItems.length > 0
    ? Math.round(taskItems.reduce((s, i) => s + (i.progress || 0), 0) / taskItems.length)
    : 0;

  const completedTasks = taskItems.filter(i => i.status === 'completed').length;
  const delayedTasks = taskItems.filter(i => i.status === 'delayed').length;
  const inProgressTasks = taskItems.filter(i => i.status === 'in_progress').length;

  // 공종별 이슈 데이터 (WBS 대공종 기준)
  const majorItems = wbsItems?.filter(i => i.level === 'major') ?? [];
  const issuesByMajor = majorItems.map(major => {
    const childIds = new Set<number>();
    const collectIds = (parentId: number) => {
      wbsItems?.filter(i => i.parentId === parentId).forEach(child => {
        childIds.add(child.id);
        collectIds(child.id);
      });
    };
    collectIds(major.id);
    const count = issues?.filter(i => i.wbsItemId && childIds.has(i.wbsItemId)).length ?? 0;
    return { name: major.name.slice(0, 4), count };
  }).filter(d => d.count > 0).slice(0, 8);

  // 담당자별 이슈
  const issuesByAssignee = users?.map(user => {
    const count = issues?.filter(i => i.assigneeId === user.id && i.status !== 'closed').length ?? 0;
    return { name: user.name || '미지정', count };
  }).filter(d => d.count > 0) ?? [];

  // 상태별 파이 차트
  const statusData = stats ? [
    { name: '미해결', value: stats.open },
    { name: '처리중', value: stats.inProgress },
    { name: '해결됨', value: stats.resolved },
    { name: '종결', value: stats.closed },
  ].filter(d => d.value > 0) : [];

  // 유형별 바 차트
  const typeData = issues ? Object.entries(
    issues.reduce((acc: Record<string, number>, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({ name: typeLabels[type] || type, count })) : [];

  // 우선순위별
  const priorityData = issues ? Object.entries(
    issues.reduce((acc: Record<string, number>, i) => {
      acc[i.priority] = (acc[i.priority] || 0) + 1;
      return acc;
    }, {})
  ).map(([priority, count]) => ({ name: priorityLabels[priority] || priority, count })) : [];

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <h1 className="font-bold text-lg flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        프로젝트 대시보드
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">전체 진행률</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${overallProgress}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">완료 테스크</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-xs text-muted-foreground mt-1">/ {taskItems.length} 전체</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">지연 테스크</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{delayedTasks}</div>
            <div className="text-xs text-muted-foreground mt-1">즉시 조치 필요</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">미해결 이슈</span>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {issues?.filter(i => i.status === 'open' || i.status === 'in_progress').length ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              전체 {issues?.length ?? 0}건 중
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Issue Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">이슈 상태 분포</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {statusData.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}건`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {statusData.map((item: any, i: number) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}건</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">데이터 없음</div>
            )}
          </CardContent>
        </Card>

        {/* Issue Type Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">이슈 유형별 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={typeData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}건`]} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">데이터 없음</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Issues by Major Work */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">공종별 이슈 발생 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {issuesByMajor.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={issuesByMajor} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}건`]} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">이슈 없음</div>
            )}
          </CardContent>
        </Card>

        {/* Issues by Assignee */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">담당자별 미해결 이슈</CardTitle>
          </CardHeader>
          <CardContent>
            {issuesByAssignee.length > 0 ? (
              <div className="space-y-2">
                {issuesByAssignee.sort((a, b) => b.count - a.count).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarFallback className={cn("text-white text-[9px]", getAvatarColor(item.name))}>
                        {item.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs w-16 truncate">{item.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(item.count / Math.max(...issuesByAssignee.map(d => d.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{item.count}건</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">이슈 없음</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* WBS Progress by Major */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">대공종별 진행률</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {majorItems.slice(0, 8).map(major => (
              <div key={major.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">{major.name}</span>
                  <span className="font-medium ml-1">{Math.round(major.progress || 0)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      (major.progress || 0) >= 100 ? "bg-green-500" :
                        (major.progress || 0) > 50 ? "bg-blue-500" : "bg-blue-400"
                    )}
                    style={{ width: `${major.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Issues */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">최근 이슈 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {issues?.slice(0, 5).map(issue => {
              const assignee = users?.find(u => u.id === issue.assigneeId);
              return (
                <div key={issue.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 flex-shrink-0",
                    issue.status === 'open' ? 'bg-red-50 text-red-600' :
                      issue.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                        'bg-green-50 text-green-600'
                  )}>
                    {statusLabels[issue.status] || issue.status}
                  </Badge>
                  <span className="text-xs flex-1 truncate">{issue.title}</span>
                  {assignee && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className={cn("text-white text-[8px]", getAvatarColor(assignee.name))}>
                          {assignee.name?.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-muted-foreground">{assignee.name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
