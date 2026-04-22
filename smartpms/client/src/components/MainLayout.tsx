import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NotificationPanel from "./NotificationPanel";
import {
  LayoutGrid, BarChart2, FolderOpen, AlertCircle, MapPin,
  Settings, Plus, Bell, ChevronRight, LogOut, User,
  Building2, Menu, X, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AIChatPanel } from "./AIChatPanel";

const navItems = [
  { href: "/wbs", label: "WBS 수행관리", icon: LayoutGrid },
  { href: "/dashboard", label: "대시보드", icon: BarChart2 },
  { href: "/issues", label: "이슈 관리", icon: AlertCircle },
  { href: "/settings", label: "설정", icon: Settings },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.slice(0, 1).toUpperCase();
  };

  const getAvatarColor = (name: string | null | undefined) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500",
      "bg-orange-500", "bg-red-500", "bg-teal-500"
    ];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col transition-all duration-300 bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        sidebarOpen ? "w-56" : "w-0 overflow-hidden"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-white truncate">SmartPMS</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">WBS 수행관리</div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-1">프로젝트</div>
          {projects?.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors text-sm",
                selectedProjectId === project.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                project.status === 'active' ? "bg-green-400" : "bg-gray-400"
              )} />
              <div className="min-w-0">
                <div className="font-medium truncate">{project.name}</div>
                <div className="text-xs opacity-60 truncate">{project.code}</div>
              </div>
            </button>
          ))}
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-xs mt-1">
            <Plus className="w-3 h-3" />
            새 프로젝트
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href === "/wbs" && location === "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="px-3 py-3 border-t border-sidebar-border">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className={cn("text-white text-xs", getAvatarColor(user.name))}>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-sidebar-foreground truncate">{user.name || user.email}</div>
                <div className="text-xs text-sidebar-foreground/50 truncate">{user.role === 'admin' ? '관리자' : '사용자'}</div>
              </div>
              <button onClick={logout} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <a href="/api/auth/google/login" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent text-xs transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google 로그인
              </a>
              <a href="/api/auth/local/login" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent text-xs transition-colors">
                <User className="w-3.5 h-3.5" />
                관리자 로그인
              </a>
            </div>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-xs mt-1"
          >
            <Settings className="w-3.5 h-3.5" />
            설정
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-12 flex items-center gap-3 px-4 bg-white border-b border-border flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>프로젝트</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium text-foreground">{selectedProject?.name || '판교 데이터센터 신축'}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-foreground">WBS 수행관리</span>
          </div>
          <div className="flex-1" />
          {/* AI Assistant */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAiPanelOpen(true);
            }}
            className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center"
            title="Gemini AI Assistant"
          >
            <Sparkles className="w-5 h-5 fill-current opacity-20" />
          </button>
          {/* Notification Bell */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount && unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
          {/* User Avatar */}
          {isAuthenticated && user && (
            <Avatar className="w-7 h-7">
              <AvatarFallback className={cn("text-white text-xs", getAvatarColor(user.name))}>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {React.isValidElement(children)
            ? React.cloneElement(children as React.ReactElement<{ projectId?: number }>, { projectId: selectedProjectId })
            : children}
        </main>
      </div>

      {/* AI Chat Side Panel - 메인 콘텐츠 옆에 나란히 표시 */}
      {aiPanelOpen && (
        <div className="w-[420px] flex-shrink-0 border-l border-border flex flex-col bg-card">
          <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-sm">Gemini AI Assistant</span>
            </div>
            <button
              onClick={() => setAiPanelOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <AIChatPanel open={aiPanelOpen} onOpenChange={setAiPanelOpen} inline />
          </div>
        </div>
      )}

      {/* Notification Panel */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
