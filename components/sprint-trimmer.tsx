"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Scissors, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react"
import type { JiraIssue, DeveloperCapacityData } from "@/app/page"

interface SprintTrimmerProps {
  issues: JiraIssue[]
  developerCapacity: DeveloperCapacityData
}

interface TrimSuggestion {
  issue: JiraIssue
  reason: string
  impact: number
}

export function SprintTrimmer({ issues, developerCapacity }: SprintTrimmerProps) {
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set())

  // Calculate current workload per developer
  const developerWorkload = useMemo(() => {
    return issues.reduce(
      (acc, issue) => {
        if (issue.assignee) {
          acc[issue.assignee] = (acc[issue.assignee] || 0) + issue.storyPoints
        }
        return acc
      },
      {} as Record<string, number>,
    )
  }, [issues])

  // Generate trim suggestions
  const trimSuggestions = useMemo(() => {
    const suggestions: TrimSuggestion[] = []

    // Find overloaded developers
    Object.entries(developerWorkload).forEach(([developer, workload]) => {
      const capacity = developerCapacity[developer] || 0
      if (workload > capacity) {
        const overload = workload - capacity

        // Get issues for this developer, sorted by priority and story points
        const developerIssues = issues
          .filter((issue) => issue.assignee === developer)
          .sort((a, b) => {
            // Sort by priority (lowest first) and then by story points (highest first)
            const priorityOrder = { lowest: 0, low: 1, medium: 2, high: 3, highest: 4 }
            const aPriority = priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder] || 2
            const bPriority = priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] || 2

            if (aPriority !== bPriority) return aPriority - bPriority
            return b.storyPoints - a.storyPoints
          })

        let remainingOverload = overload
        for (const issue of developerIssues) {
          if (remainingOverload <= 0) break

          suggestions.push({
            issue,
            reason: `${developer} is overloaded by ${overload} SP`,
            impact: Math.min(issue.storyPoints, remainingOverload),
          })

          remainingOverload -= issue.storyPoints
        }
      }
    })

    // Sort suggestions by impact (highest first)
    return suggestions.sort((a, b) => b.impact - a.impact)
  }, [issues, developerCapacity, developerWorkload])

  // Calculate metrics
  const totalCapacity = Object.values(developerCapacity).reduce((sum, cap) => sum + cap, 0)
  const totalWorkload = Object.values(developerWorkload).reduce((sum, work) => sum + work, 0)
  const selectedStoryPoints = Array.from(selectedIssues).reduce((sum, issueKey) => {
    const issue = issues.find((i) => i.key === issueKey)
    return sum + (issue?.storyPoints || 0)
  }, 0)

  const handleIssueToggle = (issueKey: string) => {
    setSelectedIssues((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(issueKey)) {
        newSet.delete(issueKey)
      } else {
        newSet.add(issueKey)
      }
      return newSet
    })
  }

  const handleSelectSuggested = () => {
    const suggestedKeys = new Set(trimSuggestions.map((s) => s.issue.key))
    setSelectedIssues(suggestedKeys)
  }

  const handleClearSelection = () => {
    setSelectedIssues(new Set())
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "highest":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      case "lowest":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isSprintOverloaded = totalWorkload > totalCapacity
  const newWorkload = totalWorkload - selectedStoryPoints
  const isBalanced = newWorkload <= totalCapacity

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Capacity</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground">Story Points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Workload</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isSprintOverloaded ? "text-red-600" : "text-blue-600"}`}>
              {totalWorkload}
            </div>
            <p className="text-xs text-muted-foreground">Story Points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected to Remove</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{selectedStoryPoints}</div>
            <p className="text-xs text-muted-foreground">{selectedIssues.size} issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">After Trimming</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isBalanced ? "text-green-600" : "text-red-600"}`}>{newWorkload}</div>
            <p className="text-xs text-muted-foreground">{isBalanced ? "Balanced" : "Still overloaded"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {isSprintOverloaded && (
        <Alert variant={isBalanced ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isBalanced
              ? `Great! Removing ${selectedIssues.size} issues (${selectedStoryPoints} SP) will balance your sprint.`
              : `Sprint is overloaded by ${totalWorkload - totalCapacity} SP. ${selectedIssues.size > 0 ? `Removing selected issues will reduce overload to ${newWorkload - totalCapacity} SP.` : "Select issues to remove."}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSelectSuggested} variant="outline">
          Select Suggested ({trimSuggestions.length})
        </Button>
        <Button onClick={handleClearSelection} variant="outline">
          Clear Selection
        </Button>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sprint Issues - Trimming View</CardTitle>
          <CardDescription>
            Select issues to remove from the sprint. Suggested removals are highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Remove</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Story Points</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Suggestion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => {
                const suggestion = trimSuggestions.find((s) => s.issue.key === issue.key)
                const isSelected = selectedIssues.has(issue.key)
                const isSuggested = !!suggestion

                return (
                  <TableRow
                    key={issue.key}
                    className={`${isSuggested ? "bg-orange-50" : ""} ${isSelected ? "bg-blue-50" : ""}`}
                  >
                    <TableCell>
                      <Checkbox checked={isSelected} onCheckedChange={() => handleIssueToggle(issue.key)} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{issue.key}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{issue.summary}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {issue.assignee ? (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {issue.assignee
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{issue.assignee}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{issue.storyPoints}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {suggestion && (
                        <div className="text-sm">
                          <Badge variant="secondary" className="mb-1">
                            Suggested
                          </Badge>
                          <p className="text-xs text-gray-600">{suggestion.reason}</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
