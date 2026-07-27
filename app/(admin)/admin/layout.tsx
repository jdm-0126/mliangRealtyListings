"use client"

import AuthGuard from "../components/AuthGuard"
import Navigation from "@/components/Navigation"
import ChatWidget from "@/components/ChatWidget"

export default function AdminLayout({
    children,
}:{
    children:React.ReactNode
}){

    return (

        // <AuthGuard>

            <div className="min-h-screen bg-[#141414]">

                <Navigation/>

                <main>

                    {children}

                </main>

                <ChatWidget/>

            </div>

        // </AuthGuard>

    )

}