import { useState } from "react";
import {
  ShoppingBag,
  Dumbbell,
  ExternalLink,
  ChevronRight,
  Globe,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type Icon = React.ComponentType<{ className?: string }>;
type Item = { title: string; path: string; icon: Icon };
type Group = { label: string; items: Item[] };
type System = {
  key: string;
  name: string;
  icon: Icon;
  baseUrl: string;
  groups: Group[];
};

// Sistemas em operação vinculados à AMT Sistemas.
const SYSTEMS: System[] = [
  {
    key: "amt-fight-wear",
    name: "AMT Fight Wear",
    icon: ShoppingBag,
    baseUrl: "https://fightwear.amtsistemas.com.br",
    groups: [
      {
        label: "Acesso rápido",
        items: [
          { title: "Abrir plataforma", path: "/", icon: Globe },
        ],
      },
    ],
  },
  {
    key: "amt-dojo-manager",
    name: "AMT Dojo Manager",
    icon: Dumbbell,
    baseUrl: "https://dojo.amtsistemas.com.br",
    groups: [
      {
        label: "Acesso rápido",
        items: [
          { title: "Abrir plataforma", path: "/", icon: Globe },
        ],
      },
    ],
  },
];

export function SystemsMenu() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Sistemas</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {SYSTEMS.map((sys) => {
            const isOpen = openKey === sys.key;
            const SysIcon = sys.icon;
            return (
              <Collapsible
                key={sys.key}
                open={isOpen}
                onOpenChange={(v) => setOpenKey(v ? sys.key : null)}
                asChild
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={sys.name}>
                      <SysIcon className="h-4 w-4" />
                      <span className="flex-1">{sys.name}</span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-1 space-y-2 pl-1 group-data-[collapsible=icon]:hidden">
                      {sys.groups.map((g) => (
                        <div key={g.label}>
                          <p className="mb-0.5 px-3 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                            {g.label}
                          </p>
                          <SidebarMenuSub className="mr-0 border-l border-sidebar-border/60 pl-2">
                            {g.items.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <SidebarMenuSubItem key={item.path}>
                                  <SidebarMenuSubButton asChild>
                                    <a
                                      href={sys.baseUrl + item.path}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="group/link"
                                    >
                                      <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                                      <span className="flex-1 truncate">{item.title}</span>
                                      <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover/link:opacity-60" />
                                    </a>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
