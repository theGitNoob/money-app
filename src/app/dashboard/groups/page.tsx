'use client';


import { useState, useEffect } from 'react';
import { Plus, Users, UserPlus, MoreHorizontal, Copy, Check, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Group, GroupInvitation } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  arrayUnion,
  deleteDoc,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });

  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (!user) return;

    // Subscribe to groups where user is a member using memberIds array
    const groupsQuery = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', user.uid)
    );

    const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData: Group[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        groupsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          members: data.members || [],
          memberIds: data.memberIds || [],
          invitations: data.invitations || []
        } as Group);
      });
      setGroups(groupsData);
      setLoading(false);
    });

    // Subscribe to invitations for current user
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('invitedEmail', '==', user.email)
    );

    const unsubscribeInvitations = onSnapshot(invitationsQuery, (snapshot) => {
      const invitationsData: GroupInvitation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        invitationsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date()
        } as GroupInvitation);
      });
      setInvitations(invitationsData.filter(inv => inv.status === 'pending'));
    });

    return () => {
      unsubscribeGroups();
      unsubscribeInvitations();
    };
  }, [user]);

  const createGroup = async () => {
    if (!user || !newGroup.name.trim()) return;

    try {
      const groupData = {
        name: newGroup.name.trim(),
        description: newGroup.description.trim(),
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        members: [{
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'admin',
          joinedAt: Timestamp.now()
        }],
        memberIds: [user.uid], // Array of user IDs for security rules
        invitations: []
      };

      await addDoc(collection(db, 'groups'), groupData);
      
      toast({
        title: "Group created",
        description: `${newGroup.name} has been created successfully.`,
      });

      setNewGroup({ name: '', description: '' });
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateInviteLink = async (group: Group) => {
    if (!user || !inviteEmail.trim()) return;

    try {
      // Generate a unique invite token
      const inviteToken = `${group.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      const invitationData = {
        groupId: group.id,
        groupName: group.name,
        invitedBy: user.uid,
        invitedByName: user.displayName || user.email?.split('@')[0] || 'User',
        invitedEmail: inviteEmail.trim(),
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
        inviteToken
      };

      await addDoc(collection(db, 'invitations'), invitationData);
      
      // Generate the invite link
      const inviteLink = `${window.location.origin}/dashboard/groups/invite/${inviteToken}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(inviteToken);
      
      toast({
        title: "Invitation created",
        description: `Invitation link copied to clipboard. Share it with ${inviteEmail}.`,
      });

      setInviteEmail('');
      setInviteDialogOpen(false);
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Error",
        description: "Failed to create invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const acceptInvitation = async (invitation: GroupInvitation) => {
    if (!user) return;

    try {
      // Get the group document
      const groupsQuery = query(
        collection(db, 'groups'),
        where('__name__', '==', invitation.groupId)
      );
      
      const groupSnapshot = await getDocs(groupsQuery);
      if (groupSnapshot.empty) {
        toast({
          title: "Error",
          description: "Group not found.",
          variant: "destructive",
        });
        return;
      }

      const groupDoc = groupSnapshot.docs[0];
      
      // Add user to group members
      await updateDoc(doc(db, 'groups', invitation.groupId), {
        members: arrayUnion({
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'member',
          joinedAt: Timestamp.now()
        })
      });

      // Update invitation status
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'accepted'
      });

      toast({
        title: "Invitation accepted",
        description: `You've joined ${invitation.groupName}!`,
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const rejectInvitation = async (invitation: GroupInvitation) => {
    try {
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'rejected'
      });

      toast({
        title: "Invitation declined",
        description: `You've declined the invitation to ${invitation.groupName}.`,
      });
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const leaveGroup = async (group: Group) => {
    if (!user) return;

    try {
      const updatedMembers = group.members.filter(member => member.userId !== user.uid);
      const updatedMemberIds = group.memberIds.filter(id => id !== user.uid);
      
      if (updatedMembers.length === 0) {
        // If no members left, delete the group
        await deleteDoc(doc(db, 'groups', group.id));
        toast({
          title: "Group deleted",
          description: `${group.name} has been deleted as you were the last member.`,
        });
      } else {
        // Update group members and memberIds
        await updateDoc(doc(db, 'groups', group.id), {
          members: updatedMembers,
          memberIds: updatedMemberIds
        });
        toast({
          title: "Left group",
          description: `You've left ${group.name}.`,
        });
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error",
        description: "Failed to leave group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteGroup = async (group: Group) => {
    if (!user || user.uid !== group.createdBy) return;

    // Show confirmation before deleting
    if (!confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete the group document
      await deleteDoc(doc(db, 'groups', group.id));
      
      // Also delete any pending invitations for this group
      const invitationsQuery = query(
        collection(db, 'invitations'),
        where('groupId', '==', group.id),
        where('status', '==', 'pending')
      );
      
      const invitationsSnapshot = await getDocs(invitationsQuery);
      const deletePromises = invitationsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      toast({
        title: "Group deleted",
        description: `${group.name} has been permanently deleted.`,
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Groups</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Groups</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new group to share expenses and collaborate with others.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter group description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createGroup} disabled={!newGroup.name.trim()}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
          <div className="grid gap-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{invitation.groupName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Invited by {invitation.invitedByName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptInvitation(invitation)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectInvitation(invitation)}>
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription>{group.description || 'No description'}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedGroup(group);
                      setInviteDialogOpen(true);
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push(`/dashboard/groups/${group.id}`)}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    View Transactions
                  </DropdownMenuItem>
                    {user?.uid === group.createdBy ? (
                      <DropdownMenuItem 
                        onClick={() => deleteGroup(group)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Group
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => leaveGroup(group)}
                        className="text-red-600"
                      >
                        Leave Group
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {group.members.slice(0, 3).map((member) => (
                  <div key={member.userId} className="flex items-center gap-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {member.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {member.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                    )}
                  </div>
                ))}
                {group.members.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{group.members.length - 3} more
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push(`/dashboard/groups/${group.id}`)}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                View Transactions
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Card className="text-center py-10">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first group to start collaborating with others on expense tracking.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Invite someone to join {selectedGroup?.name}. They'll receive an invitation link.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedGroup && generateInviteLink(selectedGroup)}
              disabled={!inviteEmail.trim()}
            >
              {copiedLink ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Generate & Copy Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
