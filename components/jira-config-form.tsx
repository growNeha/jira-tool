"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { fetchSprintIssues } from "@/lib/jira-api"
import type { JiraConfig, JiraIssue } from "@/app/page"

interface JiraConfigFormProps {
  onConfigSave: (config: JiraConfig) => void
  onIssuesFetched: (issues: JiraIssue[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export function JiraConfigForm({ onConfigSave, onIssuesFetched, loading, setLoading }: JiraConfigFormProps) {
  const [config, setConfig] = useState<JiraConfig>({
    baseUrl: "",
    email: "",
    apiToken: "",
    projectKey: "",
    sprintName: "",
    labels: [],
  })
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("jiraConfig")
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch {}
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const issues = await fetchSprintIssues(config)
      onConfigSave(config)
      onIssuesFetched(issues)
      setSuccess(`Successfully fetched ${issues.length} issues from sprint "${config.sprintName}"`)
      // Save config to localStorage
      localStorage.setItem("jiraConfig", JSON.stringify(config))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sprint data")
    } finally {
      setLoading(false)
    }
  }

  const handleLabelsChange = (value: string) => {
    const labels = value
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean)
    setConfig((prev) => ({ ...prev, labels }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="baseUrl">Jira Base URL</Label>
          <Input
            id="baseUrl"
            placeholder="https://yourcompany.atlassian.net"
            value={config.baseUrl}
            onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@company.com"
            value={config.email}
            onChange={(e) => setConfig((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiToken">API Token</Label>
        <Input
          id="apiToken"
          type="password"
          placeholder="Your Jira API Token"
          value={config.apiToken}
          onChange={(e) => setConfig((prev) => ({ ...prev, apiToken: e.target.value }))}
          required
        />
        <p className="text-sm text-gray-500">Generate an API token from your Atlassian account settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="projectKey">Project Key</Label>
          <Input
            id="projectKey"
            placeholder="PROJ"
            value={config.projectKey}
            onChange={(e) => setConfig((prev) => ({ ...prev, projectKey: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sprintName">Sprint Name</Label>
          <Input
            id="sprintName"
            placeholder="Sprint 1"
            value={config.sprintName}
            onChange={(e) => setConfig((prev) => ({ ...prev, sprintName: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="labels">Labels (comma-separated, optional)</Label>
        <Textarea
          id="labels"
          placeholder="backend, frontend, bug-fix"
          value={config.labels.join(", ")}
          onChange={(e) => handleLabelsChange(e.target.value)}
          rows={2}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Fetching Sprint Data...
          </>
        ) : (
          "Fetch Sprint Data"
        )}
      </Button>
    </form>
  )
}
