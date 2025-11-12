import LoginButton from "@/components/auth/login-button"
import  { Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import { Package } from "lucide-react"
import Link from "next/link"
import {auth }from "@/lib/auth"
import { headers } from "next/headers"
import { redirect} from "next/navigation"



 export default async function LoginPage() {
    
 

const session = await auth.api.getSession({
    headers : await headers()

});
if(session) redirect("/")

    return(
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md shadow">
                <CardHeader className="text-center">
                 <div className="mx-auto p-2 rounded-full bg-teal-500 w-fit">
                    <Package className="h-6 w-6 text-white"/>      
                 </div>
                 <CardTitle className="text-2xl font-bold text-teal-600">
                    Sign in to you account
                 </CardTitle>
                </CardHeader>
                <CardContent>
                   <LoginButton/>
                </CardContent>
                <CardFooter className="flex justify-center">
                 <Link href="/" className="text-sm text-slate-500 hover:text-teal-600"
                 >
                    Back to home
                 </Link>
                </CardFooter>

            </Card>
        </div>
    )
}