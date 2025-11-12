"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { LogOut, Package } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";


import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";

import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { AvatarFallback } from "../ui/avatar";

export default function Header() {
  const pathName = usePathname();
  const isLoginPage: boolean = pathName === "/login";

  const { data: session, isPending } = useSession();
  const user = session?.user;
  const isAdminUser = user?.role === "admin";
  const router = useRouter()

  const handleLogout = async ()=>{
    await signOut({
        fetchOptions:{
            onSuccess: ()=> {
                router.push("/")
            }
        }
    })
  }

  if (isLoginPage) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left Section: Logo & Navigation */}
        <div className="flex items-center gap-4">
          <Link className="flex items-center gap-2" href="/">
            <div className="p-2 rounded-md bg-teal-500">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-teal-600">Asset Platform</span>
          </Link>
          
          {/* Menu Navigation */}
          <nav className="flex items-center gap-6 ml-6">
           {!isPending && user  && isAdminUser ? null :
            <Link className="text-sm font-medium hover:text-teal-600" href="/gallery">
              Gallery
            </Link>}
            {!isPending && user && !isAdminUser && (
              <>
                <Link className="text-sm font-medium hover:text-teal-600" href="/dashboard/assets">
                  Assets
                </Link>
                <Link className="text-sm font-medium hover:text-teal-600" href="/dashboard/purchases">
                  My Purchases
                </Link>
              </>
            )}
            {!isPending && user && isAdminUser && (
              <>
                <Link className="text-sm font-medium hover:text-teal-600" href="/admin/asset-approval">
                  Asset Approval
                </Link>
                <Link className="text-sm font-medium hover:text-teal-600" href="/admin/settings">
                  Settings
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Section: User Avatar / Sign In */}
        <div className="flex items-center gap-6">
          {isPending ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border border-slate-300">
                    <AvatarFallback className="bg-teal-500 text-white">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                onClick={handleLogout}
                  className="cursor-pointer text-red-500"
                  onSelect={() => {
                    // Logout logic here
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
