import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json()

    // Validate required fields
    if (!config.baseUrl || !config.email || !config.apiToken || !config.projectKey || !config.sprintName) {
      return NextResponse.json({ error: "Missing required configuration fields" }, { status: 400 })
    }

    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64")

    // First, get the board ID
    const boardUrl = `${config.baseUrl}/rest/agile/1.0/board?projectKeyOrId=${config.projectKey}`
    const boardResponse = await fetch(boardUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!boardResponse.ok) {
      const errorText = await boardResponse.text()
      return NextResponse.json(
        { error: `Failed to fetch boards: ${boardResponse.status} - ${errorText}` },
        { status: boardResponse.status },
      )
    }

    const boardData = await boardResponse.json()
    if (!boardData.values || boardData.values.length === 0) {
      return NextResponse.json({ error: `No boards found for project ${config.projectKey}` }, { status: 404 })
    }

    const boardId = boardData.values[0].id

    // Get sprints for the board
    const sprintUrl = `${config.baseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active,future,closed&maxResults=50`
    const sprintResponse = await fetch(sprintUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!sprintResponse.ok) {
      const errorText = await sprintResponse.text()
      return NextResponse.json(
        { error: `Failed to fetch sprints: ${sprintResponse.status} - ${errorText}` },
        { status: sprintResponse.status },
      )
    }

    const sprintData = await sprintResponse.json()
    const sprint = sprintData.values.find(
      (s: any) =>
        s.name.toLowerCase().includes(config.sprintName.toLowerCase()) ||
        config.sprintName.toLowerCase().includes(s.name.toLowerCase()),
    )

    if (!sprint) {
      return NextResponse.json(
        {
          error: `Sprint "${config.sprintName}" not found. Available sprints: ${sprintData.values.map((s: any) => s.name).join(", ")}`,
        },
        { status: 404 },
      )
    }

    // Build JQL query
    let jql = `sprint = ${sprint.id}`

    if (config.labels && config.labels.length > 0) {
      const labelQuery = config.labels.map((label: string) => `labels = "${label}"`).join(" OR ")
      jql += ` AND (${labelQuery})`
    }

    // Search for issues
    const searchUrl = `${config.baseUrl}/rest/api/3/search`
    const searchBody = {
      jql: jql,
      fields: [
        "summary",
        "assignee",
        "status",
        "priority",
        "labels",
        "customfield_10016", // Common story points field
        "customfield_10020", // Alternative story points field
        "customfield_10026", // Another alternative
        "customfield_10002", // Another common one
      ],
      maxResults: 100,
    }

    const searchResponse = await fetch(searchUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchBody),
    })

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      return NextResponse.json(
        { error: `Failed to search issues: ${searchResponse.status} - ${errorText}` },
        { status: searchResponse.status },
      )
    }

    const searchData = await searchResponse.json()

    // Transform issues
    const issues = searchData.issues.map((issue: any) => {
      // Try to find story points in various custom fields
      const storyPoints =
        issue.fields.customfield_10016 ||
        issue.fields.customfield_10020 ||
        issue.fields.customfield_10026 ||
        issue.fields.customfield_10002 ||
        0

      return {
        key: issue.key,
        summary: issue.fields.summary,
        assignee: issue.fields.assignee?.displayName || null,
        storyPoints: typeof storyPoints === "number" ? storyPoints : 0,
        status: issue.fields.status.name,
        priority: issue.fields.priority.name,
        labels: issue.fields.labels || [],
      }
    })

    return NextResponse.json({ issues })
  } catch (error) {
    console.error("Jira API Error:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
