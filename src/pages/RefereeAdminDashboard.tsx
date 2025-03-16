import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Check, X, User, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Referee, Commission } from '../types/referral';

export function RefereeAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [referees, setReferees] = useState<any[]>([]);
  const [pendingReferees, setPendingReferees] = useState<any[]>([]);
  const [pendingCommissions, setPendingCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalReferees: 0,
    activeReferees: 0,
    pendingReferees: 0,
    totalReferrals: 0,
    totalRevenue: 0,
    totalCommissions: 0,
  });
  const [selectedReferee, setSelectedReferee] = useState<any>(null);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [showRefereeDialog, setShowRefereeDialog] = useState<boolean>(false);
  const [showCommissionDialog, setShowCommissionDialog] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          navigate('/auth');
          return;
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profileError || !profile || profile.role !== 'admin') {
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
        setChecking(false);
      } catch (err) {
        navigate('/');
      }
    };
    
    checkAdmin();
  }, [navigate]);

  // Load admin dashboard data
  useEffect(() => {
    if (checking || !isAdmin) return;
    
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load referees
        const { data: refereesData, error: refereesError } = await supabase
          .from('referees')
          .select(`
            *,
            profiles:user_id (email, full_name)
          `)
          .order('created_at', { ascending: false });
          
        if (refereesError) throw refereesError;
        
        setReferees(refereesData || []);
        
        // Load pending referees
        const pendingRefs = refereesData?.filter(ref => ref.status === 'pending') || [];
        setPendingReferees(pendingRefs);
        
        // Load stats
        const { data: statsData, error: statsError } = await supabase.rpc('get_referee_admin_stats');
        
        if (!statsError && statsData) {
          setStats(statsData);
        } else {
          // Fallback if RPC not available
          setStats({
            totalReferees: refereesData?.length || 0,
            activeReferees: refereesData?.filter(r => r.status === 'approved').length || 0,
            pendingReferees: pendingRefs.length,
            totalReferrals: 0,
            totalRevenue: 0,
            totalCommissions: 0,
          });
        }
        
        // Load pending commissions
        const { data: commissionsData, error: commissionsError } = await supabase
          .from('commissions')
          .select(`
            *,
            referees (
              id,
              profiles:user_id (email, full_name)
            ),
            subscriptions (plan, amount)
          `)
          .eq('status', 'pending')
          .order('commission_date', { ascending: false });
          
        if (!commissionsError) {
          setPendingCommissions(commissionsData || []);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [checking, isAdmin]);

  // Function to update referee status
  const updateRefereeStatus = async (refereeId: string, status: 'approved' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('referees')
        .update({ 
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', refereeId);
        
      if (error) throw error;
      
      // Update local state
      setReferees(referees.map(ref => {
        if (ref.id === refereeId) {
          return { 
            ...ref, 
            status,
            approved_at: status === 'approved' ? new Date().toISOString() : null
          };
        }
        return ref;
      }));
      
      // Update pending referees
      if (status === 'approved') {
        setPendingReferees(pendingReferees.filter(ref => ref.id !== refereeId));
      }
      
      setShowRefereeDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update referee status');
    }
  };

  // Function to update commission status
  const updateCommissionStatus = async (commissionId: string, status: 'paid' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ 
          status,
          paid_at: status === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', commissionId);
        
      if (error) throw error;
      
      // Update local state
      setPendingCommissions(pendingCommissions.filter(comm => comm.id !== commissionId));
      
      setShowCommissionDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update commission status');
    }
  };

  const handleViewReferee = (referee: any) => {
    setSelectedReferee(referee);
    setShowRefereeDialog(true);
  };

  const handleViewCommission = (commission: any) => {
    setSelectedCommission(commission);
    setShowCommissionDialog(true);
  };

  const getFilteredReferees = () => {
    if (filterStatus === 'all') return referees;
    return referees.filter(ref => ref.status === filterStatus);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (checking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Referee Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Manage referees, approve applications, and process commissions
      </p>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Referees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReferees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReferees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Items */}
      {(pendingReferees.length > 0 || pendingCommissions.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pending Items</CardTitle>
            <CardDescription>Items that require your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="referees">
              <TabsList className="mb-4">
                <TabsTrigger value="referees">
                  Referee Applications
                  {pendingReferees.length > 0 && (
                    <Badge className="ml-2 bg-primary">{pendingReferees.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="commissions">
                  Pending Commissions
                  {pendingCommissions.length > 0 && (
                    <Badge className="ml-2 bg-primary">{pendingCommissions.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="referees">
                {pendingReferees.length === 0 ? (
                  <div className="text-center py-4">
                    <p>No pending referee applications</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingReferees.map((referee) => (
                          <TableRow key={referee.id}>
                            <TableCell>{referee.profiles?.full_name || 'Unknown'}</TableCell>
                            <TableCell>{referee.profiles?.email || 'Unknown'}</TableCell>
                            <TableCell>{formatDate(referee.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleViewReferee(referee)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => updateRefereeStatus(referee.id, 'approved')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateRefereeStatus(referee.id, 'suspended')}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="commissions">
                {pendingCommissions.length === 0 ? (
                  <div className="text-center py-4">
                    <p>No pending commissions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Referee</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingCommissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>
                              {commission.referees?.profiles?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell>{commission.subscriptions?.plan || 'Unknown'}</TableCell>
                            <TableCell>{formatCurrency(commission.amount)}</TableCell>
                            <TableCell>{formatDate(commission.commission_date)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleViewCommission(commission)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => updateCommissionStatus(commission.id, 'paid')}
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Pay
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateCommissionStatus(commission.id, 'cancelled')}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* All Referees */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Referees</CardTitle>
              <CardDescription>Manage your referee network</CardDescription>
            </div>
            <div className="flex items-center">
              <Label htmlFor="status-filter" className="mr-2">
                Filter:
              </Label>
              <Select 
                value={filterStatus} 
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Referees</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {referees.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="mt-4 font-medium">No referees yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No one has signed up for your referee program yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredReferees().map((referee) => (
                    <TableRow key={referee.id}>
                      <TableCell>{referee.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>{referee.profiles?.email || 'Unknown'}</TableCell>
                      <TableCell>
                        {referee.status === 'approved' && (
                          <Badge className="bg-green-600">Approved</Badge>
                        )}
                        {referee.status === 'pending' && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                        {referee.status === 'suspended' && (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(referee.created_at)}</TableCell>
                      <TableCell>{formatDate(referee.approved_at)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReferee(referee)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referee Details Dialog */}
      {selectedReferee && (
        <Dialog open={showRefereeDialog} onOpenChange={setShowRefereeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Referee Details</DialogTitle>
              <DialogDescription>
                {selectedReferee.profiles?.full_name || 'Unknown'} - {selectedReferee.profiles?.email || 'Unknown'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p>
                    {selectedReferee.status === 'approved' && (
                      <Badge className="bg-green-600 mt-1">Approved</Badge>
                    )}
                    {selectedReferee.status === 'pending' && (
                      <Badge variant="outline" className="mt-1">Pending</Badge>
                    )}
                    {selectedReferee.status === 'suspended' && (
                      <Badge variant="destructive" className="mt-1">Suspended</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                  <p>{formatDate(selectedReferee.created_at)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Approved On</h4>
                  <p>{formatDate(selectedReferee.approved_at)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">User ID</h4>
                  <p className="truncate">{selectedReferee.user_id}</p>
                </div>
              </div>
              
              {selectedReferee.payment_info && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Payment Information</h4>
                  <pre className="mt-1 text-xs p-2 bg-muted rounded-md overflow-auto">
                    {JSON.stringify(selectedReferee.payment_info, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              <div>
                {selectedReferee.status !== 'approved' && (
                  <Button
                    onClick={() => updateRefereeStatus(selectedReferee.id, 'approved')}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                )}
                
                {selectedReferee.status !== 'suspended' && (
                  <Button
                    variant="destructive"
                    onClick={() => updateRefereeStatus(selectedReferee.id, 'suspended')}
                    className="ml-2"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Suspend
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowRefereeDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Commission Details Dialog */}
      {selectedCommission && (
        <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Commission Details</DialogTitle>
              <DialogDescription>
                {formatCurrency(selectedCommission.amount)} - {formatDate(selectedCommission.commission_date)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Referee</h4>
                  <p>{selectedCommission.referees?.profiles?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p>{selectedCommission.referees?.profiles?.email || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Plan</h4>
                  <p>{selectedCommission.subscriptions?.plan || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Subscription Amount</h4>
                  <p>{formatCurrency(selectedCommission.subscriptions?.amount || 0)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Commission Amount</h4>
                  <p className="font-bold">{formatCurrency(selectedCommission.amount)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p>
                    <Badge variant="outline">Pending</Badge>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Created On</h4>
                  <p>{formatDate(selectedCommission.created_at)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Calculated On</h4>
                  <p>{formatDate(selectedCommission.calculated_at)}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCommissionDialog(false)}
                className="mr-auto"
              >
                Close
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => updateCommissionStatus(selectedCommission.id, 'cancelled')}
                className="ml-2"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button
                onClick={() => updateCommissionStatus(selectedCommission.id, 'paid')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
