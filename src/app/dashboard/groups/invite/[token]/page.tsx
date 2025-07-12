'use client';

import { useState, useEffect } from 'react';


import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { GroupInvitation } from '@/lib/types';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<GroupInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const inviteToken = params.token as string;

  useEffect(() => {
    if (!inviteToken) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const invitationsQuery = query(
          collection(db, 'invitations'),
          where('inviteToken', '==', inviteToken)
        );

        const snapshot = await getDocs(invitationsQuery);
        
        if (snapshot.empty) {
          setError('Invitation not found or has expired');
          setLoading(false);
          return;
        }

        const invitationDoc = snapshot.docs[0];
        const data = invitationDoc.data();
        
        const invitationData: GroupInvitation = {
          id: invitationDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date()
        } as GroupInvitation;

        // Check if invitation is expired
        if (invitationData.expiresAt < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        // Check if invitation is still pending
        if (invitationData.status !== 'pending') {
          setError('This invitation has already been used');
          setLoading(false);
          return;
        }

        setInvitation(invitationData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setError('Failed to load invitation');
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [inviteToken]);

  const acceptInvitation = async () => {
    if (!user || !invitation) return;

    // Check if user's email matches the invitation
    if (user.email !== invitation.invitedEmail) {
      toast({
        title: "Email mismatch",
        description: `This invitation was sent to ${invitation.invitedEmail}. Please sign in with that email address.`,
        variant: "destructive",
      });
      return;
    }

    setAccepting(true);

    try {
      // Add user to group members
      await updateDoc(doc(db, 'groups', invitation.groupId), {
        members: arrayUnion({
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'member',
          joinedAt: Timestamp.now()
        }),
        memberIds: arrayUnion(user.uid) // Add to memberIds for security rules
      });

      // Update invitation status
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'accepted'
      });

      toast({
        title: "Invitation accepted",
        description: `You've joined ${invitation.groupName}!`,
      });

      // Redirect to groups page
      router.push('/dashboard/groups');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const rejectInvitation = async () => {
    if (!invitation) return;

    try {
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'rejected'
      });

      toast({
        title: "Invitation declined",
        description: `You've declined the invitation to ${invitation.groupName}.`,
      });

      router.push('/dashboard/groups');
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-center text-muted-foreground mt-4">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/dashboard/groups')}
            >
              Go to Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <UserPlus className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <CardTitle>Group Invitation</CardTitle>
            <CardDescription>
              You've been invited to join {invitation?.groupName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Please sign in to accept this invitation.
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <CardTitle>Group Invitation</CardTitle>
          <CardDescription>
            {invitation?.invitedByName} has invited you to join
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold">{invitation?.groupName}</h3>
            <p className="text-sm text-muted-foreground">
              Invited to: {invitation?.invitedEmail}
            </p>
            {user.email !== invitation?.invitedEmail && (
              <p className="text-sm text-red-600 mt-2">
                This invitation was sent to {invitation?.invitedEmail}. 
                You're signed in as {user.email}.
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={rejectInvitation}
            >
              Decline
            </Button>
            <Button 
              className="flex-1"
              onClick={acceptInvitation}
              disabled={accepting || user.email !== invitation?.invitedEmail}
            >
              {accepting ? 'Joining...' : 'Accept & Join'}
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={() => router.push('/dashboard/groups')}
          >
            Go to Groups
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
