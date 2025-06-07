import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  sprintName: string;
  labels: string[];
}

interface Developer {
  name: string;
  points: number;
}

export default function DeveloperCapacityPage() {
  // Separate state for projectKey input
  const [projectKey, setProjectKey] = useState<string>("");
  const [config, setConfig] = useState<JiraConfig>({
    baseUrl: "",
    email: "",
    apiToken: "",
    projectKey: "",
    sprintName: "",
    labels: [],
  });
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [maxPoints, setMaxPoints] = useState<Record<string, number>>({});

  // Only load config when projectKey changes (and only if not already loaded)
  useEffect(() => {
    if (projectKey) {
      const saved = localStorage.getItem(`jiraConfig-${projectKey}`);
      if (saved) setConfig(JSON.parse(saved));
      else setConfig((prev) => ({ ...prev, projectKey })); // set projectKey in config
      // Also load maxPoints for this projectKey
      const savedMax = localStorage.getItem(`maxPoints-${projectKey}`);
      setMaxPoints(savedMax ? JSON.parse(savedMax) : {});
    }
  }, [projectKey]);

  // Fetch issues from Jira API and group by assignee
  useEffect(() => {
    if (!config.baseUrl || !config.email || !config.apiToken || !config.projectKey || !config.sprintName) return;
    fetch("/api/jira", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    })
      .then(res => res.json())
      .then((data) => {
        const devMap: Record<string, number> = {};
        (data.issues || []).forEach((issue: any) => {
          if (!issue.assignee) return;
          devMap[issue.assignee] = (devMap[issue.assignee] || 0) + (issue.storyPoints || 0);
        });
        setDevelopers(Object.entries(devMap).map(([name, points]) => ({ name, points })));
      });
  }, [config]);

  // Save maxPoints to localStorage whenever it changes
  useEffect(() => {
    if (projectKey) {
      localStorage.setItem(`maxPoints-${projectKey}`, JSON.stringify(maxPoints));
    }
  }, [maxPoints, projectKey]);

  // Save config to localStorage on submit
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem(`jiraConfig-${config.projectKey}`, JSON.stringify(config));
    alert("Project settings saved!");
  };

  const handleProjectKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProjectKey(e.target.value);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaxChange = (name: string, value: string) => {
    setMaxPoints(prev => ({ ...prev, [name]: Number(value) }));
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded shadow p-4 mb-8">
        <h2 className="text-xl font-bold mb-2">Project Settings</h2>
        <input name="projectKey" value={projectKey} onChange={handleProjectKeyChange} placeholder="Project Key" className="w-full border rounded px-2 py-1" />
        <input name="baseUrl" value={config.baseUrl} onChange={handleChange} placeholder="Jira Base URL" className="w-full border rounded px-2 py-1" />
        <input name="email" value={config.email} onChange={handleChange} placeholder="Email" className="w-full border rounded px-2 py-1" />
        <input name="apiToken" value={config.apiToken} onChange={handleChange} placeholder="API Token" className="w-full border rounded px-2 py-1" />
        <input name="sprintName" value={config.sprintName} onChange={handleChange} placeholder="Sprint Name" className="w-full border rounded px-2 py-1" />
        {/* Add more fields as needed */}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">Save Settings</button>
      </form>
      <h2 className="text-xl font-bold mb-4">Developer Capacity</h2>
      <div className="space-y-4">
        {developers.map(dev => (
          <div key={dev.name} className="bg-white rounded shadow p-4 flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <div className="font-semibold">{dev.name}</div>
              <div className="text-sm text-gray-500">Assigned: {dev.points} pts</div>
            </div>
            <div className="flex items-center mt-2 sm:mt-0">
              <input
                type="number"
                min={0}
                className="border rounded px-2 py-1 w-20 mr-2"
                placeholder="Max pts"
                value={maxPoints[dev.name] || ""}
                onChange={e => handleMaxChange(dev.name, e.target.value)}
              />
              <span className="text-sm">
                {maxPoints[dev.name]
                  ? `${dev.points}/${maxPoints[dev.name]} (${maxPoints[dev.name] > 0 ? Math.round((dev.points / maxPoints[dev.name]) * 100) : 0}%)`
                  : "Set max"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 