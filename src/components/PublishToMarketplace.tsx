import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Deployment, MarketplaceListing } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { publishDeployment, generateInstallationInstructions } from "@/utils/marketplaceService";
import { useAuth } from "@/contexts/AuthContext";

// Define form validation schema
const publishFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  author: z.string().min(2, {
    message: "Author name must be at least 2 characters.",
  }),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: "Version must be in the format x.y.z (e.g. 1.0.0)",
  }),
  tags: z.string(),
});

type PublishFormValues = z.infer<typeof publishFormSchema>;

interface PublishToMarketplaceProps {
  deployment: Deployment;
  projectName: string;
  onPublished?: (listing: MarketplaceListing) => void;
}

export default function PublishToMarketplace({
  deployment,
  projectName,
  onPublished,
}: PublishToMarketplaceProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { user } = useAuth();

  const form = useForm<PublishFormValues>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: {
      title: projectName || "",
      description: deployment.files?.find(f => f.name === "README.md")?.content.split("\n")[0].replace("# ", "") || "",
      author: user?.user_metadata?.username || user?.email?.split("@")[0] || "",
      version: "1.0.0",
      tags: "",
    },
  });

  const handleAddTag = () => {
    if (tagInput && !newTags.includes(tagInput)) {
      setNewTags([...newTags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setNewTags(newTags.filter(t => t !== tag));
  };

  const onSubmit = async (values: PublishFormValues) => {
    if (!deployment) {
      toast.error("No deployment to publish");
      return;
    }

    try {
      setIsPublishing(true);

      // Extract server URL from the deployment
      const serverUrl = deployment.server_url || `https://mcp-${values.title.toLowerCase().replace(/\s+/g, "-")}.example.com`;

      // Process the tags
      const tagsList = newTags.length > 0 ? newTags : values.tags.split(",").map(tag => tag.trim()).filter(tag => tag);

      // Generate installation instructions
      const mockListing = {
        id: "temp",
        deployment_id: deployment.id,
        title: values.title,
        description: values.description,
        author: values.author,
        user_id: user?.id || "",
        version: values.version,
        stars: 0,
        downloads: 0,
        tags: tagsList,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const installationInstructions = generateInstallationInstructions(
        mockListing,
        serverUrl
      );

      // Publish the deployment
      const listing = await publishDeployment(deployment, {
        title: values.title,
        description: values.description,
        author: values.author,
        version: values.version,
        tags: tagsList,
        installation_instructions: installationInstructions,
      });

      toast.success("Server published to marketplace successfully!");
      setIsOpen(false);
      
      if (onPublished) {
        onPublished(listing);
      }
    } catch (error) {
      console.error("Error publishing to marketplace:", error);
      toast.error("Failed to publish server to marketplace");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Package className="h-4 w-4" />
          Publish to Marketplace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Server to Marketplace</DialogTitle>
          <DialogDescription>
            Make your MCP server available to others through the marketplace.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Title</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome MCP Server" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your MCP server
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="This MCP server provides..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain what your server does and why it's useful
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name or organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {newTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-2 py-1"
                  >
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => removeTag(tag)}
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormDescription>
                Add tags to help users find your server (e.g., "database", "weather", "api")
              </FormDescription>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPublishing}>
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish to Marketplace"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
