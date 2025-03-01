"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, CheckCircle, Copy, ExternalLink } from "lucide-react"
import Cookies from "js-cookie"

export default function DidaOAuthApp() {
  const searchParams = useSearchParams()
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [redirectUri, setRedirectUri] = useState("")
  const [code, setCode] = useState("")
  const [token, setToken] = useState<any>(null)
  const [rawResponse, setRawResponse] = useState("")
  const [requestString, setRequestString] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [processSteps, setProcessSteps] = useState<string[]>([])
  const [showRawResponse, setShowRawResponse] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.search = ""
    setRedirectUri(url.toString())

    const savedClientId = Cookies.get("dida_client_id")
    const savedClientSecret = Cookies.get("dida_client_secret")

    if (savedClientId) setClientId(savedClientId)
    if (savedClientSecret) setClientSecret(savedClientSecret)

    const codeParam = searchParams.get("code")
    if (codeParam) {
      setCode(codeParam)
    }
  }, [searchParams])

  const getAuthorizationCode = () => {
    Cookies.set("dida_client_id", clientId, { expires: 30 })
    Cookies.set("dida_client_secret", clientSecret, { expires: 30 })

    const authURL = `https://dida365.com/oauth/authorize?scope=tasks:write tasks:read&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=state`

    const popupWidth = 600
    const popupHeight = 700
    const left = (window.innerWidth - popupWidth) / 2
    const top = (window.innerHeight - popupHeight) / 2

    const popup = window.open(
      authURL,
      "didaOAuthPopup",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`,
    )

    if (!popup) {
      setError("Failed to open popup window. Please allow popups for this site.")
      return
    }

    const checkPopup = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(checkPopup)
          return
        }

        const popupUrl = popup.location.href
        if (popupUrl.includes(redirectUri)) {
          clearInterval(checkPopup)
          const url = new URL(popupUrl)
          const code = url.searchParams.get("code")
          if (code) {
            setCode(code)
            popup.close()
          }
        }
      } catch (e) {
        // Cross-origin error, ignore
      }
    }, 500)
  }

  const logStep = (step: string) => {
    setProcessSteps((prev) => [...prev, `${new Date().toISOString()}: ${step}`])
  }

  const getAccessToken = async () => {
    setIsLoading(true)
    setError("")
    setProcessSteps([])
    setRawResponse("")

    try {
      logStep("Starting token exchange process")

      const params = new URLSearchParams()
      params.append("client_id", clientId)
      params.append("client_secret", clientSecret)
      params.append("redirect_uri", redirectUri)
      params.append("grant_type", "authorization_code")
      params.append("scope", "tasks:write tasks:read")
      params.append("code", code)

      const reqString = params.toString()
      setRequestString(reqString)
      logStep("Request data prepared")
      logStep(`Request body: ${reqString}`)

      logStep("Sending request to token endpoint")
      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }).catch((e) => {
        logStep(`Network error: ${e.message}`)
        throw e
      })

      logStep(`Response status: ${response.status} ${response.statusText}`)
      logStep("Response headers:")
      for (const [key, value] of response.headers.entries()) {
        logStep(`${key}: ${value}`)
      }

      const responseText = await response.text()
      logStep("Raw response received")
      logStep("----------------------------------------")
      logStep(responseText)
      logStep("----------------------------------------")
      setRawResponse(responseText)

      if (responseText.trim().startsWith("{")) {
        try {
          const data = JSON.parse(responseText)
          logStep("Response successfully parsed as JSON")

          if (data.access_token) {
            logStep("Successfully received access token")
            setToken({
              message: "Authorization successful",
              token: data.access_token,
              req: reqString,
              response: data,
            })
          } else {
            throw new Error("access_token not found in response")
          }
        } catch (e) {
          logStep(`Failed to parse response as JSON: ${e instanceof Error ? e.message : String(e)}`)
          throw new Error(`Invalid JSON response: ${e instanceof Error ? e.message : String(e)}`)
        }
      } else {
        logStep("Response is not JSON format")
        throw new Error("Unexpected response format. Full response shown in Raw Response tab.")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      logStep(`Error occurred: ${errorMessage}`)
      setError(`Error: ${errorMessage}`)
      console.error("Token exchange error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const createTestTask = async () => {
    if (!token || !token.token) {
      setError("Token is missing. Please get the access token first.")
      return
    }
  
    try {
      const response = await fetch("https://api.dida365.com/open/v1/task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.token}`,
        },
        body: JSON.stringify({
          title: "This is a task created by API Token",
        }),
      })
  
      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`)
      }
  
      const data = await response.json()
      alert("Task created successfully: " + JSON.stringify(data, null, 2))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Error: ${errorMessage}`)
      console.error("Create task error:", err)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderRawResponsePreview = () => {
    if (!rawResponse) return null

    const blob = new Blob([rawResponse], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    return (
      <Dialog open={showRawResponse} onOpenChange={setShowRawResponse}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Raw Response Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0">
            <iframe src={url} className="w-full h-full border rounded-md" onLoad={() => URL.revokeObjectURL(url)} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Dida365 OAuth Client</CardTitle>
          <CardDescription>Connect to Dida365 API using OAuth 2.0</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="redirectUri">Redirect URI</Label>
            <div className="flex items-center gap-2">
              <Input id="redirectUri" value={redirectUri} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(redirectUri)}
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter your client secret"
              />
            </div>
          </div>

          {code ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Authorization Code</Label>
                <div className="flex items-center gap-2">
                  <Input id="code" value={code} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(code)} title="Copy to clipboard">
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={getAccessToken}
                disabled={isLoading || !code || !clientId || !clientSecret}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Token...
                  </>
                ) : (
                  "Get Access Token"
                )}
              </Button>
            </div>
          ) : (
            <Button onClick={getAuthorizationCode} disabled={!clientId || !clientSecret} className="w-full">
              Get Authorization Code
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {processSteps.length > 0 && (
            <div className="space-y-2">
              <Label>Process Steps</Label>
              <div className="bg-muted p-4 rounded-lg space-y-1 max-h-48 overflow-y-auto">
                {processSteps.map((step, index) => (
                  <div key={index} className="text-sm font-mono">
                    {step}
                  </div>
                ))}
              </div>
              {rawResponse && (
                <Button variant="outline" onClick={() => setShowRawResponse(true)} className="w-full mt-2">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Raw Response in Preview
                </Button>
              )}
            </div>
          )}

          {token && (
            <div className="space-y-4">
              <Tabs defaultValue="formatted">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="formatted">Formatted</TabsTrigger>
                  <TabsTrigger value="raw">Raw Response</TabsTrigger>
                  <TabsTrigger value="request">Request</TabsTrigger>
                </TabsList>
                <TabsContent value="formatted" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <div className="flex items-center gap-2">
                      <Input value={token.token} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(token.token)}
                        title="Copy to clipboard"
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Response</Label>
                    <Textarea
                      value={JSON.stringify(token.response, null, 2)}
                      readOnly
                      className="font-mono text-sm h-48"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="raw" className="space-y-2">
                  <Label>Raw Response</Label>
                  <div className="space-y-2">
                    <Textarea value={rawResponse} readOnly className="font-mono text-sm h-64" />
                    <Button variant="outline" onClick={() => setShowRawResponse(true)} className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in Preview
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="request" className="space-y-2">
                  <Label>Request String</Label>
                  <Textarea value={requestString} readOnly className="font-mono text-sm h-64" />
                </TabsContent>
              </Tabs>
              <Button onClick={createTestTask} className="w-full mt-4">
                Create Test Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {renderRawResponsePreview()}
    </div>
  )
}

