"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Save, AlertTriangle } from "lucide-react"
import type { JiraIssue, DeveloperCapacityData } from "@/app/page"

interface DeveloperCapacityProps {
  issues: JiraIssue[]
  onCapacityUpdate: (capacity: DeveloperCapacityData) => void
}

export function DeveloperCapacity({ issues, onCapacityUpdate }: DeveloperCapacityProps) {
  const [capacity, setCapacity] = useState<DeveloperCapacityData>({})

  // Get unique developers from issues
  const developers = Array.from(new Set(issues.filter((issue) => issue.assignee).map((issue) => issue.assignee!)))

  // Calculate current workload for each developer
  const developerWorkload = issues.reduce(
    (acc, issue) => {
      if (issue.assignee) {
        acc[issue.assignee] = (acc[issue.assignee] || 0) + issue.storyPoints
      }
      return acc
    },
    {} as Record<string, number>,
  )

  useEffect(() => {
    // Initialize capacity with default values if not set
    const initialCapacity: DeveloperCapacityData = {}
    developers.forEach((dev) => {
      if (!capacity[dev]) {
        initialCapacity[dev] = 32 // Default 32 story points capacity
      } else {
        initialCapacity[dev] = capacity[dev]
      }
    })
    setCapacity(initialCapacity)
  }, [developers])

  const handleCapacityChange = (developer: string, value: string) => {
    const numValue = Number.parseInt(value) || 0
    setCapacity((prev) => ({
      ...prev,
      [developer]: numValue,
    }))
  }

  const handleSave = () => {
    onCapacityUpdate(capacity)
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization <= 80) return "bg-green-500"
    if (utilization <= 100) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getUtilizationStatus = (utilization: number) => {
    if (utilization <= 80) return "Optimal"
    if (utilization <= 100) return "At Capacity"
    return "Overloaded"
  }

  if (developers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No developers found in sprint issues.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Capacity Planning</CardTitle>
          <CardDescription>
            Set the story point capacity for each team member to optimize sprint planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {developers.map((developer) => {
            const currentWorkload = developerWorkload[developer] || 0
            const developerCapacity = capacity[developer] || 0
            const utilization = developerCapacity > 0 ? (currentWorkload / developerCapacity) * 100 : 0

            return (
              <div key={developer} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {developer
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{developer}</p>
                      <p className="text-sm text-gray-500">
                        Current: {currentWorkload} SP • Status: {getUtilizationStatus(utilization)}
                      </p>
                    </div>
                  </div>
                  {utilization > 100 && <AlertTriangle className="h-5 w-5 text-red-500" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`capacity-${developer}`}>Sprint Capacity (Story Points)</Label>
                    <Input
                      id={`capacity-${developer}`}
                      type="number"
                      min="0"
                      value={capacity[developer] || ""}
                      onChange={(e) => handleCapacityChange(developer, e.target.value)}
                      placeholder="Enter capacity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Utilization</Label>
                    <div className="space-y-1">
                      <Progress value={Math.min(utilization, 100)} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span>
                          {currentWorkload} / {developerCapacity} SP
                        </span>
                        <span
                          className={`font-medium ${
                            utilization > 100 ? "text-red-600" : utilization > 80 ? "text-yellow-600" : "text-green-600"
                          }`}
                        >
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          <Button onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Capacity Settings
          </Button>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Team Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {Object.values(capacity).reduce((sum, cap) => sum + cap, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Team Capacity</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {Object.values(developerWorkload).reduce((sum, work) => sum + work, 0)}
              </p>
              <p className="text-sm text-gray-500">Current Workload</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p
                className={`text-2xl font-bold ${
                  Object.values(developerWorkload).reduce((sum, work) => sum + work, 0) >
                  Object.values(capacity).reduce((sum, cap) => sum + cap, 0)
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {Object.values(capacity).reduce((sum, cap) => sum + cap, 0) -
                  Object.values(developerWorkload).reduce((sum, work) => sum + work, 0)}
              </p>
              <p className="text-sm text-gray-500">Remaining Capacity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
