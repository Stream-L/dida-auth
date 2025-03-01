"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function Callback() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")

    // If we're in a popup and have a code, send it to the parent window
    if (window.opener && code) {
      window.opener.postMessage({ type: "OAUTH_CALLBACK", code }, "*")
      // Close this window after sending the message
      setTimeout(() => window.close(), 500)
    } else if (code) {
      // If we're not in a popup but have a code, redirect to the main page with the code
      window.location.href = `/?code=${code}&state=state`
    }
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authorization Successful</h1>
        <p>Redirecting back to the application...</p>
      </div>
    </div>
  )
}

