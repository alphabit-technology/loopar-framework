import { buttonVariants } from "@cn/components/ui/button";
import { MainNav, MenuItems } from "./main-nav";
import { Logo } from "./logo";
import { ThemeToggle } from "@workspace/theme-toggle";
import { BaseIcon } from "@base-icons";
import { useWorkspace } from "@workspace/workspace-provider";

function MenuActions({ menuActions = [] }) {
  return (
    <nav className="flex items-center space-x-1">
      {menuActions.map((action, i) => {
        const classVariant = buttonVariants({
          size: "icon",
          variant: "ghost",
        }).replaceAll("text-primary", "");

        return (
          <a
            key={(action.action || "") + i}
            href={action.action}
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary"
          >
            <div className={`${classVariant} hover:text-primary`}>
              <BaseIcon icon={action.icon} className="h-5 w-5" />
              <span className="sr-only">{action.label}</span>
            </div>
          </a>
        );
      })}
      <ThemeToggle />
    </nav>
  );
}

export function TopNav({ menuActions }) {
  const { webApp } = useWorkspace();
  const logoPosition = ["left", "center", "right"].includes(webApp.logo_position)
    ? webApp.logo_position
    : "left";

  return (
    <header
      className="fixed top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm"
    >
      <div className="flex items-center px-2 h-web-header-height">
        <div className="flex lg:hidden flex-1 items-center">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <MenuActions menuActions={menuActions} />
          </div>
        </div>

        <div className="hidden lg:flex w-full items-center">

          {logoPosition === "left" && (
            <>
              <Logo variant="desktop" />
              <MenuItems className="ml-2" />
              <div className="ml-auto">
                <MenuActions menuActions={menuActions} />
              </div>
            </>
          )}

          {logoPosition === "right" && (
            <>
              <MenuItems />
              <div className="ml-auto flex items-center space-x-4">
                <MenuActions menuActions={menuActions} />
                <Logo variant="desktop" />
              </div>
            </>
          )}

          {logoPosition === "center" && (
            <div className="grid grid-cols-3 w-full items-center">
              <MenuItems half="first" className="justify-end" />
              <div className="flex items-center justify-center">
                <Logo variant="desktop" size="lg" />
              </div>
              <div className="flex items-center justify-between">
                <MenuItems half="second" />
                <MenuActions menuActions={menuActions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
