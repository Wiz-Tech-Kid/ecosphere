import React from "react";
import { Search, Plus, Send, Paperclip, AlertTriangle, MapPin, Users, ClipboardList } from "lucide-react";

const ColabHub = () => {
  // Environmental response data
  const activeProjects = [
    { id: 1, type: "Reforestation", location: "Okavango Delta", status: "ongoing", priority: "high", updated: "10 min ago" },
    { id: 2, type: "Solar Panel Installation", location: "Gaborone", status: "in progress", priority: "medium", updated: "1 hour ago" },
    { id: 3, type: "Waste Management Initiative", location: "Francistown", status: "completed", priority: "low", updated: "Yesterday" },
  ];

  const collaborationTeams = [
    { id: 1, name: "Renewable Energy Taskforce", status: "active", members: 15, location: "Gaborone" },
    { id: 2, name: "Wildlife Conservation Unit", status: "standby", members: 10, location: "Maun" },
    { id: 3, name: "Urban Sustainability Team", status: "active", members: 8, location: "Francistown" },
  ];

  const resources = [
    { id: 1, name: "Solar Panels", available: 50, deployed: 30 },
    { id: 2, name: "Recycling Bins", available: 100, deployed: 60 },
    { id: 3, name: "Tree Saplings", available: 500, deployed: 300 },
  ];

  return (
    <div className="min-h-screen bg-[#021526] text-white">
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-[#03346E] border-b border-[#1B262C] p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#e1f5fe]">Collaborators Hub</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-9 pr-4 py-2 rounded-lg border border-[#1B262C] bg-[#021526] text-[#e1f5fe] text-sm focus:outline-none focus:ring-2 focus:ring-[#4fc3f7] w-64"
              />
              <Search className="absolute left-3 top-2.5 text-[#81d4fa] h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects Card */}
          <div className="bg-[#03346E] rounded-xl shadow-md border border-[#1B262C] overflow-hidden">
            <div className="p-4 border-b border-[#1B262C] flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2 text-[#e1f5fe]">
                <AlertTriangle className="h-5 w-5 text-[#FF5722]" />
                Active Projects
              </h2>
            </div>
            <div className="divide-y divide-[#1B262C]">
              {activeProjects.map((project) => (
                <div key={project.id} className="p-4 hover:bg-[#021526] cursor-pointer">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium text-[#81d4fa]">{project.type}</h3>
                      <p className="text-sm text-[#81d4fa] flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {project.location}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.priority === "high"
                          ? "bg-[#FF5722] text-white"
                          : project.priority === "medium"
                          ? "bg-[#FFEB3B] text-black"
                          : "bg-[#4CAF50] text-white"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#81d4fa] mt-2">Updated {project.updated}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collaboration Teams Card */}
          <div className="bg-[#03346E] rounded-xl shadow-md border border-[#1B262C] overflow-hidden">
            <div className="p-4 border-b border-[#1B262C] flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2 text-[#e1f5fe]">
                <Users className="h-5 w-5 text-[#4CAF50]" />
                Collaboration Teams
              </h2>
            </div>
            <div className="divide-y divide-[#1B262C]">
              {collaborationTeams.map((team) => (
                <div key={team.id} className="p-4 hover:bg-[#021526] cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-[#81d4fa]">{team.name}</h3>
                      <p className="text-sm text-[#81d4fa] mt-1">{team.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          team.status === "active" ? "bg-[#4CAF50]" : "bg-[#FFEB3B]"
                        }`}
                      ></span>
                      <span className="text-xs text-[#81d4fa]">{team.members} members</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources Card */}
          <div className="bg-[#03346E] rounded-xl shadow-md border border-[#1B262C] overflow-hidden">
            <div className="p-4 border-b border-[#1B262C] flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2 text-[#e1f5fe]">
                <ClipboardList className="h-5 w-5 text-[#FFEB3B]" />
                Resource Allocation
              </h2>
            </div>
            <div className="p-4">
              {resources.map((resource) => (
                <div key={resource.id} className="mb-4 last:mb-0">
                  <div className="flex justify-between text-sm mb-1 text-[#81d4fa]">
                    <span>{resource.name}</span>
                    <span>
                      {resource.deployed}/{resource.available + resource.deployed} deployed
                    </span>
                  </div>
                  <div className="w-full bg-[#1B262C] rounded-full h-2">
                    <div
                      className="bg-[#4CAF50] h-2 rounded-full"
                      style={{
                        width: `${(resource.deployed / (resource.available + resource.deployed)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ColabHub;