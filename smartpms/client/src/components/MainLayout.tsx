import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NotificationPanel from "./NotificationPanel";
import {
  LayoutGrid, BarChart2, FolderOpen, AlertCircle, MapPin,
  Settings, Plus, Bell, ChevronRight, LogOut, User,
  Building2, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
            <a href={getLoginUrl()} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent text-xs transition-colors">
              <User className="w-3.5 h-3.5" />
              로그인
            </a>
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

      {/* Notification Panel */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
