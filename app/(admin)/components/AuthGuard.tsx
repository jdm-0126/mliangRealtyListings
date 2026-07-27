"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"

export default function AuthGuard({
    children,
}: {
    children: React.ReactNode
}) {

    const router = useRouter()

    const [loading,setLoading]=useState(true)

    useEffect(()=>{

        if(!isAuthenticated()){
            router.replace("/login")
            return
        }

        setLoading(false)

    },[router])

    if(loading){

        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        )
    }

    return <>{children}</>

}