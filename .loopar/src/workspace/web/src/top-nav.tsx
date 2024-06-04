import { buttonVariants } from "@/components/ui/button"
import { MainNav } from "./main-nav"
import { ThemeToggle } from "@workspace/theme-toggle"

export function TopNav() {
  return (
    <header 
      className="fixed top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm"
      //className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm"
    >
      <div 
        className="container flex items-center space-x-4 px-2 sm:justify-between sm:space-x-0 h-webHeaderHeight"
      >
        <MainNav/>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">

            <a
              href="https://twitter.com/looparinc"
              target="_blank"
              rel="noreferrer"
            >
              <div
                className={buttonVariants({
                  size: "icon",
                  variant: "ghost",
                })}
              >
                <TwitterLogoIcon className="h-5 w-5 fill-current" />
                <span className="sr-only">Twitter</span>
              </div>
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
