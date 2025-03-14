import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Info, Package, Search, Server } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderLayout from "@/components/layouts/HeaderLayout";

// Import server types from MCP Servers component
import { MCPServer } from "@/types";

// Sample MCP servers data
const mockServers: MCPServer[] = [
  {
    id: "1",
    name: "OpenWeather MCP",
    description:
      "Access current weather data and forecasts for cities worldwide",
    author: "WeatherAPI Team",
    version: "1.2.0",
    stars: 245,
    downloads: 5432,
    capabilities: [
      {
        type: "resource",
        name: "getCurrentWeather",
        description: "Get current weather for a location",
      },
      {
        type: "resource",
        name: "getForecast",
        description: "Get weather forecast for a location",
      },
    ],
    tags: ["weather", "forecast", "geolocation"],
    updatedAt: "2025-02-20",
  },
  {
    id: "2",
    name: "News MCP",
    description: "Access the latest news articles from various sources",
    author: "NewsAPI",
    version: "1.0.5",
    stars: 198,
    downloads: 3891,
    capabilities: [
      {
        type: "resource",
        name: "getTopHeadlines",
        description: "Get top news headlines",
      },
      {
        type: "resource",
        name: "searchNews",
        description: "Search for news articles",
      },
    ],
    tags: ["news", "articles", "media"],
    updatedAt: "2025-01-15",
  },
  {
    id: "3",
    name: "Database MCP",
    description: "Store and retrieve structured data in the cloud",
    author: "CloudDB",
    version: "2.1.0",
    stars: 412,
    downloads: 8901,
    capabilities: [
      {
        type: "tool",
        name: "storeData",
        description: "Store data in the database",
      },
      {
        type: "tool",
        name: "queryData",
        description: "Query data from the database",
      },
      { type: "tool", name: "updateData", description: "Update existing data" },
      {
        type: "tool",
        name: "deleteData",
        description: "Delete data from the database",
      },
    ],
    tags: ["database", "storage", "cloud"],
    updatedAt: "2025-03-05",
  },
  {
    id: "4",
    name: "Code Translator MCP",
    description: "Translate code between different programming languages",
    author: "CodeAI Team",
    version: "1.1.2",
    stars: 325,
    downloads: 6789,
    capabilities: [
      {
        type: "tool",
        name: "translateCode",
        description: "Translate code between languages",
      },
      {
        type: "tool",
        name: "formatCode",
        description: "Format code according to language standards",
      },
    ],
    tags: ["code", "programming", "translation"],
    updatedAt: "2025-02-28",
  },
];

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Filter servers based on search term and selected tag
  const filteredServers = mockServers.filter((server) => {
    const matchesSearch = searchTerm === "" ||
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = !selectedTag || server.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  // Extract all unique tags
  const allTags = Array.from(
    new Set(mockServers.flatMap((server) => server.tags)),
  );

  return (
    <HeaderLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">MCP Server Marketplace</h1>
          <Button variant="default">
            <Package className="mr-2 h-4 w-4" />
            Submit Server
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search servers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <Badge
              variant={selectedTag === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedTag(null)}
            >
              All
            </Badge>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <Link to={`/marketplace/${server.id}`} key={server.id}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle>{server.name}</CardTitle>
                  <CardDescription>by {server.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {server.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {server.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>⭐ {server.stars}</span>
                    <span>📦 {server.downloads}</span>
                    <span>v{server.version}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex justify-between w-full text-xs">
                    <span>Updated: {server.updatedAt}</span>
                    <span className="text-primary">
                      {server.capabilities.length} capabilities
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </HeaderLayout>
  );
}
