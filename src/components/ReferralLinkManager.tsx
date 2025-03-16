import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Loader2, Copy, MoreVertical, Link, Share2 } from 'lucide-react';
import { referralService } from '../utils/referralService';
import { ReferralLink } from '../types/referral';

interface ReferralLinkManagerProps {
  refereeStatus: 'pending' | 'approved' | 'suspended';
}

export function ReferralLinkManager({ refereeStatus }: ReferralLinkManagerProps) {
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [newLinkName, setNewLinkName] = useState<string>('');
  const [creatingLink, setCreatingLink] = useState<boolean>(false);

  useEffect(() => {
    loadReferralLinks();
  }, []);

  const loadReferralLinks = async () => {
    try {
      setLoading(true);
      const fetchedLinks = await referralService.getReferralLinks();
      setLinks(fetchedLinks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!newLinkName.trim()) {
      return;
    }

    try {
      setCreatingLink(true);
      const newLink = await referralService.createReferralLink(newLinkName);
      setLinks([newLink, ...links]);
      setNewLinkName('');
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create referral link');
    } finally {
      setCreatingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Referral Links</CardTitle>
            <CardDescription>
              Create and manage your referral links
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={refereeStatus !== 'approved'}>
                Create New Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Referral Link</DialogTitle>
                <DialogDescription>
                  Create a custom referral link to track different referral sources.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="link-name">Link Name</Label>
                <Input
                  id="link-name"
                  placeholder="e.g., Twitter, LinkedIn, Blog"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  This name is only visible to you and helps you identify which channel is most effective.
                </p>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateLink} 
                  disabled={creatingLink || !newLinkName.trim()}
                >
                  {creatingLink ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Link'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {refereeStatus !== 'approved' && (
          <Alert className="mb-4">
            <AlertDescription>
              Your referee account must be approved before you can create or manage referral links.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-muted/20">
            <Link className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 font-medium">No referral links yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {refereeStatus === 'approved'
                ? 'Create your first referral link to start earning commissions.'
                : 'You\'ll be able to create referral links once your referee account is approved.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell className="font-mono text-sm truncate max-w-[200px]">
                      <div className="flex items-center space-x-2">
                        <span>{referralService.getReferralUrl(link.code)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(referralService.getReferralUrl(link.code))}
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{link.clicks}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(referralService.getReferralUrl(link.code))}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const shareUrl = referralService.getReferralUrl(link.code);
                            if (navigator.share) {
                              navigator.share({
                                title: 'Check out this app!',
                                text: 'I thought you might be interested in this app I\'m using.',
                                url: shareUrl,
                              });
                            } else {
                              copyToClipboard(shareUrl);
                            }
                          }}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
