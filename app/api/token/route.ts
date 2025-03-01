import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    // Convert FormData to URLSearchParams exactly like Go's url.Values
    const params = new URLSearchParams()
    for (const [key, value] of formData.entries()) {
      params.append(key, value.toString())
    }

    // Log the request details for debugging
    console.log("Request body:", params.toString())

    const response = await fetch("https://dida365.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        // Add additional headers that might help
        "User-Agent": "OAuth-Client",
        "Cache-Control": "no-cache",
      },
      // Send the encoded params directly in the body
      body: params.toString(),
    })

    // Read response as text first
    const responseText = await response.text()
    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))
    console.log("Response body:", responseText)

    // Try to parse as JSON first
    try {
      const jsonData = JSON.parse(responseText)
      return new NextResponse(JSON.stringify(jsonData), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch (e) {
      // If not JSON, return the raw text with error details
      return new NextResponse(responseText, {
        status: response.status,
        headers: {
          "Content-Type": "text/plain",
          "X-Error-Details": "Failed to parse response as JSON",
        },
      })
    }
  } catch (error) {
    console.error("Token proxy error:", error)
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

