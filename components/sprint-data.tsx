"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, User, Target, TrendingUp } from "lucide-react"
import type { JiraIssue } from "@/app/page"

interface SprintDataProps {
  issues: JiraIssue[]
  loading: boolean
}

export function SprintData({ issues, loading }: SprintDataProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading sprint data...</span>
        </CardContent>
      </Card>
    )
  }

  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No sprint data available. Please configure Jira connection first.</p>
        </CardContent>
      </Card>
    )
  }

  const totalStoryPoints = issues.reduce((sum, issue) => sum + issue.storyPoints, 0)
  const assignedIssues = issues.filter((issue) => issue.assignee)
  const unassignedIssues = issues.filter((issue) => !issue.assignee)

  const developerStats = issues.reduce(
    (acc, issue) => {
      if (issue.assignee) {
        if (!acc[issue.assignee]) {
          acc[issue.assignee] = { issues: 0, storyPoints: 0 }
        }
        acc[issue.assignee].issues++
        acc[issue.assignee].storyPoints += issue.storyPoints
      }
      return acc
    },
    {} as Record<string, { issues: number; storyPoints: number }>,
  )

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "to do":
        return "bg-gray-100 text-gray-800"
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "done":
        return "bg-green-100 text-green-800"
      case "blocked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issues.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignedIssues.length} assigned, {unassignedIssues.length} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Story Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStoryPoints}</div>
            <p className="text-xs text-muted-foreground">Across all sprint issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(developerStats).length}</div>
            <p className="text-xs text-muted-foreground">Active developers</p>
          </CardContent>
        </Card>
      </div>

      {/* Developer Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Workload</CardTitle>
          <CardDescription>Story points and issue count per developer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(developerStats).map(([developer, stats]) => {
              // Get issues assigned to this developer
              const devIssues = issues.filter((issue) => issue.assignee === developer)
              return (
                <div key={developer} className="flex flex-col space-y-2 p-3 border rounded-lg">
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
                    <div className="flex-1">
                      <p className="font-medium">{developer}</p>
                      <p className="text-sm text-gray-500">
                        {stats.storyPoints} SP • {stats.issues} issues
                      </p>
                    </div>
                  </div>
                  {/* Assigned tickets */}
                  <div className="pl-10 pt-1">
                    <p className="text-xs font-semibold text-gray-400 mb-1">Assigned Tickets:</p>
                    <ul className="space-y-1">
                      {devIssues.map((issue) => (
                        <li key={issue.key} className="flex flex-col md:flex-row md:items-center md:space-x-2 text-xs text-gray-700 bg-gray-50 rounded px-2 py-1">
                          <span className="font-semibold text-blue-700">{issue.key}</span>
                          <span className="truncate max-w-xs md:max-w-[180px] lg:max-w-[220px]">{issue.summary}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sprint Issues</CardTitle>
          <CardDescription>All issues in the current sprint</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Story Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Labels</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.key}>
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
                    <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {issue.labels.map((label) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
