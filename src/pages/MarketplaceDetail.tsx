import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  CopyPlus,
  Download,
  ExternalLink,
  Github,
  Server,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { MarketplaceListing, InstallationInstructions } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchMarketplaceListing, 
  trackDownload, 
  toggleStar,
  generateInstallationInstructions
} from "@/utils/marketplaceService";

function MarketplaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const { user } = useAuth();
  const [userHasStarred, setUserHasStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedText, setCopiedText] = useState("");

  useEffect(() => {
    const fetchListingDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await fetchMarketplaceListing(id);
        setListing(data);
        
        // Check if user has starred this listing (from local storage)
        if (user) {
          const starredListings = JSON.parse(localStorage.getItem('starredListings') || '[]');
          setUserHasStarred(starredListings.includes(id));
        }
      } catch (error) {
        console.error("Error fetching listing details:", error);
        toast.error("Failed to load server details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListingDetails();
  }, [id, user]);

  const handleCopyCode = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    toast.success(`${type} copied to clipboard`);
    setTimeout(() => setCopiedText(""), 2000);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading server details...</p>
        </div>
      </div>
    );
  }

  const handleDownload = useCallback(async () => {
    if (!listing) return;
    
    try {
      await trackDownload(listing.id);
      // Update the local download count for immediate feedback
      setListing(prev => prev ? {
        ...prev,
        downloads: prev.downloads + 1
      } : null);
      toast.success("Download tracked successfully");
    } catch (error) {
      console.error("Error tracking download:", error);
    }
  }, [listing]);

  const handleToggleStar = useCallback(async () => {
    if (!listing || !user) {
      toast.info("Please sign in to star this server", {
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }
    
    try {
      await toggleStar(listing.id, !userHasStarred);
      
      // Update the star count for immediate feedback
      setListing(prev => prev ? {
        ...prev,
        stars: userHasStarred ? prev.stars - 1 : prev.stars + 1
      } : null);
      
      // Toggle the user's star status
      setUserHasStarred(!userHasStarred);
      
      // Update localStorage
      const starredListings = JSON.parse(localStorage.getItem('starredListings') || '[]');
      if (userHasStarred) {
        localStorage.setItem('starredListings', JSON.stringify(
          starredListings.filter((id: string) => id !== listing.id)
        ));
      } else {
        starredListings.push(listing.id);
        localStorage.setItem('starredListings', JSON.stringify(starredListings));
      }
      
      toast.success(userHasStarred ? "Server unstarred" : "Server starred");
    } catch (error) {
      console.error("Error toggling star:", error);
      toast.error("Failed to update star status");
    }
  }, [listing, user, userHasStarred, navigate]);
  
  if (!listing && !isLoading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col justify-center items-center h-64">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="mb-4 text-lg">Server not found</p>
          <Button onClick={() => navigate("/marketplace")}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  // Generate installation instructions if they don't exist yet
  const getInstallationInstructions = useCallback((): InstallationInstructions => {
    if (!listing) return {};
    
    if (listing.installation_instructions) {
      return listing.installation_instructions;
    }
    
    // Generate from server URL
    const serverUrl = "https://mcp-servers.example.com/" + listing.title.toLowerCase().replace(/\s+/g, '-');
    return generateInstallationInstructions(listing, serverUrl);
  }, [listing]);
  
  const instructions = getInstallationInstructions();
  
  const claudeCode = instructions.claude?.configContent || '';
  const pythonCode = `
# Python example for using this MCP Server
import requests

API_KEY = "your_api_key_here"
MCP_SERVER_URL = "${listing?.title ? 'https://mcp-servers.example.com/' + listing.title.toLowerCase().replace(/\s+/g, '-') : ''}"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Example request
response = requests.get(
    f"{MCP_SERVER_URL}/endpoint",
    headers=headers
)

if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f"Error: {response.status_code}")
    print(response.text)
`;

  const nodejsCode = `
// Node.js example for using this MCP Server
const axios = require('axios');

const API_KEY = 'your_api_key_here';
const MCP_SERVER_URL = '${listing?.title ? 'https://mcp-servers.example.com/' + listing.title.toLowerCase().replace(/\s+/g, '-') : ''}';

const headers = {
  'Authorization': \`Bearer \${API_KEY}\`,
  'Content-Type': 'application/json'
};

// Example request
async function callMcpServer() {
  try {
    const response = await axios.get(
      \`\${MCP_SERVER_URL}/endpoint\`,
      { headers }
    );
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.status);
    console.error(error.response?.data);
  }
}

callMcpServer();
`;

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/marketplace")}
        className="mb-6 pl-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{listing?.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {listing?.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {listing?.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="mr-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                  <TabsTrigger value="integration">Integration</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="py-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Author
                        </h3>
                        <p>{listing?.author}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Version
                        </h3>
                        <p>{listing?.version}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Stars
                        </h3>
                        <p>{listing?.stars.toLocaleString()}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Downloads
                        </h3>
                        <p>{listing?.downloads.toLocaleString()}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">
                        About this MCP Server
                      </h3>
                      <p className="text-muted-foreground">
                        {listing?.description || "No description available."}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Github className="h-4 w-4 mr-1" />
                          View on GitHub
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Documentation
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="capabilities" className="py-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Resources</h3>
                      <div className="space-y-3">
                        {listing?.capabilities
                          ?.filter((cap) => cap.type === "resource")
                          .map((capability) => (
                            <div
                              key={capability.name}
                              className="bg-muted/50 p-3 rounded-md"
                            >
                              <div className="flex items-start">
                                <Server className="h-5 w-5 text-primary mt-0.5 mr-2" />
                                <div>
                                  <h4 className="font-medium">
                                    {capability.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {capability.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Tools</h3>
                      <div className="space-y-3">
                        {listing?.capabilities
                          ?.filter((cap) => cap.type === "tool")
                          .map((capability) => (
                            <div
                              key={capability.name}
                              className="bg-muted/50 p-3 rounded-md"
                            >
                              <div className="flex items-start">
                                <Wrench className="h-5 w-5 text-primary mt-0.5 mr-2" />
                                <div>
                                  <h4 className="font-medium">
                                    {capability.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {capability.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="integration" className="py-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Claude Integration</h3>
                      <div className="relative bg-muted p-4 rounded-md">
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            handleCopyCode(claudeCode, "Claude code")}
                        >
                          {copiedText === "Claude code"
                            ? <Check className="h-4 w-4 mr-1" />
                            : <Copy className="h-4 w-4 mr-1" />}
                          {copiedText === "Claude code" ? "Copied" : "Copy"}
                        </Button>
                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{claudeCode}</pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Python Example</h3>
                      <div className="relative bg-muted p-4 rounded-md">
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            handleCopyCode(pythonCode, "Python code")}
                        >
                          {copiedText === "Python code"
                            ? <Check className="h-4 w-4 mr-1" />
                            : <Copy className="h-4 w-4 mr-1" />}
                          {copiedText === "Python code" ? "Copied" : "Copy"}
                        </Button>
                        <pre className="text-sm overflow-x-auto">{pythonCode}</pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Node.js Example</h3>
                      <div className="relative bg-muted p-4 rounded-md">
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            handleCopyCode(nodejsCode, "Node.js code")}
                        >
                          {copiedText === "Node.js code"
                            ? <Check className="h-4 w-4 mr-1" />
                            : <Copy className="h-4 w-4 mr-1" />}
                          {copiedText === "Node.js code" ? "Copied" : "Copy"}
                        </Button>
                        <pre className="text-sm overflow-x-auto">{nodejsCode}</pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
              <CardDescription>
                Connect this MCP server to your AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Server URL</h3>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={`https://mcp-servers.example.com/${listing?.title.toLowerCase().replace(/\s+/g, '-')}`}
                    readOnly
                    className="w-full rounded-md border px-3 py-2 text-sm bg-muted"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() =>
                      handleCopyCode(
                        "https://mcp-servers.example.com/google-drive",
                        "Server URL",
                      )}
                  >
                    {copiedText === "Server URL"
                      ? <Check className="h-4 w-4" />
                      : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Authentication</h3>
                <div className="space-y-2">
                  <div className="rounded-md border px-4 py-3 text-sm bg-muted/50">
                    <span className="font-medium">Type:</span> Bearer Token
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Server Package
                </Button>
                
                <Button 
                  variant={userHasStarred ? "default" : "outline"} 
                  className="w-full"
                  onClick={handleToggleStar}
                >
                  <Star className={`h-4 w-4 mr-2 ${userHasStarred ? 'text-yellow-300 fill-yellow-300' : ''}`} />
                  {userHasStarred ? 'Starred' : 'Star This Server'}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 rounded-b-lg p-4 text-sm text-muted-foreground">
              This is a sample MCP server for demonstration. In a real
              application, you would need to register for an API key and follow
              specific installation instructions.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceDetail;
