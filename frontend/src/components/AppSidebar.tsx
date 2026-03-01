import { LayoutDashboard, BookOpen, Target, CalendarDays, LogOut } from "lucide-react";
import { NavLink } from "@/components/Navlink";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Study Log", url: "/log", icon: BookOpen },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Schedule", url: "/schedule", icon: CalendarDays },
];

export function AppSidebar() {
  const { user, logout } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          S
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
          Student Life OS
        </span>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {user.displayName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
