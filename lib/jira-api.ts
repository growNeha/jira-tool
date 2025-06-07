import type { JiraConfig, JiraIssue } from "@/app/page"

export async function fetchSprintIssues(config: JiraConfig): Promise<JiraIssue[]> {
  try {
    const response = await fetch("/api/jira", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ config }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.issues || []
  } catch (error) {
    console.error("Error fetching Jira issues:", error)
    throw error
  }
}
