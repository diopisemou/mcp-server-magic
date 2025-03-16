import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Globe, 
  Info, 
  Loader2, 
  Package, 
  Search, 
  Server,
  AlertCircle 
} from "lucide-react";
import SubmitServerModal from "@/components/SubmitServerModal";
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

import { MarketplaceListing } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchMarketplaceListings, 
  searchMarketplaceListings 
} from "@/utils/marketplaceService";
import { toast } from "sonner";

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "downloads">("latest");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (searchTerm || selectedTag) {
      handleSearch();
    }
  }, [selectedTag, sortBy]);

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarketplaceListings();
      setListings(data);
    } catch (err) {
      console.error("Error fetching marketplace listings:", err);
      setError("Failed to load marketplace listings");
      // Fall back to empty array
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tags = selectedTag ? [selectedTag] : undefined;
      const data = await searchMarketplaceListings(searchTerm, tags, sortBy);
      setListings(data);
    } catch (err) {
      console.error("Error searching marketplace listings:", err);
      toast.error("Failed to search marketplace listings");
      // Keep the current listings
    } finally {
      setIsLoading(false);
    }
  };

  // Extract all unique tags from available listings
  const allTags = Array.from(
    new Set(listings.flatMap((listing) => listing.tags || []))
  );

  const handleSubmitServerClick = () => {
    if (!user) {
      toast.info("Please sign in to submit a server", {
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }
    navigate("/submit-server");
  };

  return (
    <HeaderLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">MCP Server Marketplace</h1>
          {user ? (
            <SubmitServerModal
              onSubmitted={(listing) => {
                toast.success("Server submitted to marketplace!");
                fetchListings();
              }}
            />
          ) : (
            <Button 
              variant="default" 
              onClick={() => {
                toast.info("Please sign in to submit a server", {
                  action: {
                    label: "Sign In",
                    onClick: () => navigate("/auth"),
                  },
                });
              }}
            >
              <Package className="mr-2 h-4 w-4" />
              Submit Server
            </Button>
          )}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="rounded-md border border-input px-3 py-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "latest" | "popular" | "downloads")}
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="downloads">Most Downloads</option>
              </select>
              <Button variant="outline" onClick={handleSearch}>
                Search
              </Button>
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

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading marketplace servers...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <h3 className="text-lg font-medium">Failed to load servers</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchListings}>
              Try Again
            </Button>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No servers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedTag
                ? "Try adjusting your search filters"
                : "There are no MCP servers in the marketplace yet"}
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedTag(null);
              setSortBy("latest");
              fetchListings();
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link to={`/marketplace/${listing.id}`} key={listing.id}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>{listing.title}</CardTitle>
                    <CardDescription>by {listing.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {listing.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {listing.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>⭐ {listing.stars}</span>
                      <span>📦 {listing.downloads}</span>
                      <span>v{listing.version}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex justify-between w-full text-xs">
                      <span>Updated: {new Date(listing.updated_at).toLocaleDateString()}</span>
                      <span className="text-primary">
                        {listing.capabilities?.length || 0} capabilities
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </HeaderLayout>
  );
}
