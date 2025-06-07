"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JiraConfigForm } from "@/components/jira-config-form"
import { SprintData } from "@/components/sprint-data"
import { DeveloperCapacity } from "@/components/developer-capacity"
import { SprintTrimmer } from "@/components/sprint-trimmer"
import { Activity, Users, Scissors, Settings } from "lucide-react"

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
  projectKey: string
  sprintName: string
  labels: string[]
}

export interface JiraIssue {
  key: string
  summary: string
  assignee: string | null
  storyPoints: number
  status: string
  priority: string
  labels: string[]
}

export interface DeveloperCapacityData {
  [developer: string]: number
}

export default function JiraSprintTrimmer() {
  const [jiraConfig, setJiraConfig] = useState<JiraConfig | null>(null)
  const [sprintIssues, setSprintIssues] = useState<JiraIssue[]>([])
  const [developerCapacity, setDeveloperCapacity] = useState<DeveloperCapacityData>({})
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Jira Sprint Trimmer</h1>
          <p className="text-lg text-gray-600">Optimize your sprint scope based on team capacity and story points</p>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="sprint" className="flex items-center gap-2" disabled={!jiraConfig}>
              <Activity className="h-4 w-4" />
              Sprint Data
            </TabsTrigger>
            <TabsTrigger value="capacity" className="flex items-center gap-2" disabled={sprintIssues.length === 0}>
              <Users className="h-4 w-4" />
              Team Capacity
            </TabsTrigger>
            <TabsTrigger
              value="trimmer"
              className="flex items-center gap-2"
              disabled={Object.keys(developerCapacity).length === 0}
            >
              <Scissors className="h-4 w-4" />
              Sprint Trimmer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Jira Configuration</CardTitle>
                <CardDescription>Configure your Jira connection and sprint filters</CardDescription>
              </CardHeader>
              <CardContent>
                <JiraConfigForm
                  onConfigSave={setJiraConfig}
                  onIssuesFetched={setSprintIssues}
                  loading={loading}
                  setLoading={setLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sprint">
            <SprintData issues={sprintIssues} loading={loading} />
          </TabsContent>

          <TabsContent value="capacity">
            <DeveloperCapacity issues={sprintIssues} onCapacityUpdate={setDeveloperCapacity} />
          </TabsContent>

          <TabsContent value="trimmer">
            <SprintTrimmer issues={sprintIssues} developerCapacity={developerCapacity} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
