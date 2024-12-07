import { buttonVariants } from "@/components/ui/button"
import { MainNav } from "./main-nav"
import { ThemeToggle } from "@workspace/theme-toggle"
import * as RadixIcons from "@radix-ui/react-icons"
import { CircleIcon } from "@radix-ui/react-icons";

export function TopNav({menuActions}) {
  return (
    <header 
      className="fixed top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm"
      //className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm"
    >
      <div 
        className="flex items-center space-x-4 px-2 sm:justify-between sm:space-x-0 h-web-header-height"
      >
        <MainNav/>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {menuActions.map((action) => {
              const Icon = RadixIcons[action.icon] || CircleIcon
              return (
                <a
                  href={action.action}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div
                    className={buttonVariants({
                      size: "icon",
                      variant: "ghost",
                    })}
                  >
                    <Icon className="h-5 w-5 fill-current" />
                    <span className="sr-only">{action.label}</span>
                  </div>
                </a>
              )
            })}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
