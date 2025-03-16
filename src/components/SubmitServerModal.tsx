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
import { MarketplaceCapability, MarketplaceListing } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { submitServer } from "@/utils/marketplaceService";
import { useAuth } from "@/contexts/AuthContext";

// Define form validation schema
const submitFormSchema = z.object({
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
  serverUrl: z.string().url({
    message: "Server URL must be a valid URL",
  }),
  tags: z.string(),
});

type SubmitFormValues = z.infer<typeof submitFormSchema>;

interface CapabilityInput {
  type: "resource" | "tool";
  name: string;
  description: string;
}

interface SubmitServerModalProps {
  onSubmitted?: (listing: MarketplaceListing) => void;
}

export default function SubmitServerModal({
  onSubmitted,
}: SubmitServerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [capabilities, setCapabilities] = useState<CapabilityInput[]>([]);
  const [capabilityInput, setCapabilityInput] = useState<CapabilityInput>({
    type: "resource",
    name: "",
    description: "",
  });
  const { user } = useAuth();

  const form = useForm<SubmitFormValues>({
    resolver: zodResolver(submitFormSchema),
    defaultValues: {
      title: "",
      description: "",
      author: user?.user_metadata?.username || user?.email?.split("@")[0] || "",
      version: "1.0.0",
      serverUrl: "",
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

  const handleAddCapability = () => {
    if (capabilityInput.name && capabilityInput.description) {
      setCapabilities([...capabilities, { ...capabilityInput }]);
      setCapabilityInput({
        type: "resource",
        name: "",
        description: "",
      });
    } else {
      toast.error("Capability name and description are required");
    }
  };

  const removeCapability = (index: number) => {
    setCapabilities(capabilities.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: SubmitFormValues) => {
    if (!user) {
      toast.error("You need to be logged in to submit a server");
      return;
    }

    if (capabilities.length === 0) {
      toast.error("Please add at least one capability");
      return;
    }

    try {
      setIsSubmitting(true);

      // Process the tags
      const tagsList = newTags.length > 0 ? newTags : values.tags.split(",").map(tag => tag.trim()).filter(tag => tag);

      // Submit the server
      const listing = await submitServer({
        title: values.title,
        description: values.description,
        author: values.author,
        version: values.version,
        server_url: values.serverUrl,
        tags: tagsList,
        capabilities: capabilities.map(cap => ({
          type: cap.type,
          name: cap.name,
          description: cap.description,
        })),
      });

      toast.success("Server submitted to marketplace successfully!");
      setIsOpen(false);
      
      if (onSubmitted) {
        onSubmitted(listing);
      }
    } catch (error) {
      console.error("Error submitting server:", error);
      toast.error("Failed to submit server to marketplace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Package className="h-4 w-4" />
          Submit Server
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit MCP Server to Marketplace</DialogTitle>
          <DialogDescription>
            Share your MCP server with others through the marketplace.
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

            <FormField
              control={form.control}
              name="serverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-mcp-server.example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The URL where your MCP server is hosted
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="space-y-2">
              <FormLabel>Capabilities</FormLabel>
              <div className="space-y-4 mb-2">
                {capabilities.map((cap, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 p-3 rounded-md flex justify-between items-start"
                  >
                    <div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {cap.type}
                        </Badge>
                        <h4 className="font-medium">{cap.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cap.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => removeCapability(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-4 border rounded-md">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Type:</label>
                  <select
                    value={capabilityInput.type}
                    onChange={(e) => setCapabilityInput({
                      ...capabilityInput,
                      type: e.target.value as "resource" | "tool",
                    })}
                    className="rounded-md border px-3 py-1 text-sm"
                  >
                    <option value="resource">Resource</option>
                    <option value="tool">Tool</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm">Name:</label>
                  <Input
                    value={capabilityInput.name}
                    onChange={(e) => setCapabilityInput({
                      ...capabilityInput,
                      name: e.target.value,
                    })}
                    placeholder="capability_name"
                    className="h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm">Description:</label>
                  <Input
                    value={capabilityInput.description}
                    onChange={(e) => setCapabilityInput({
                      ...capabilityInput,
                      description: e.target.value,
                    })}
                    placeholder="What this capability does..."
                    className="h-8"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCapability}
                  className="mt-2 w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Capability
                </Button>
              </div>
              <FormDescription>
                Add the resources and tools your MCP server provides
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit to Marketplace"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
