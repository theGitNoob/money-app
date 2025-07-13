import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  arrayUnion,
  deleteDoc,
  Timestamp,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { Group, GroupInvitation, GroupMember } from './types';

export const groupService = {
  async createGroup(name: string, description: string, creatorId: string, creatorEmail: string, creatorDisplayName: string): Promise<string> {
    const groupData = {
      name: name.trim(),
      description: description.trim(),
      createdBy: creatorId,
      createdAt: Timestamp.now(),
      members: [{
        userId: creatorId,
        email: creatorEmail,
        displayName: creatorDisplayName,
        role: 'admin' as const,
        joinedAt: Timestamp.now()
      }],
      memberIds: [creatorId],
      invitations: []
    };

    const docRef = await addDoc(collection(db, 'groups'), groupData);
    return docRef.id;
  },

  async createInvitation(
    groupId: string, 
    groupName: string,
    invitedBy: string, 
    invitedByName: string,
    invitedEmail: string
  ): Promise<string> {
    const inviteToken = `${groupId}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const invitationData = {
      groupId,
      groupName,
      invitedBy,
      invitedByName,
      invitedEmail: invitedEmail.trim(),
      status: 'pending' as const,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      inviteToken
    };

    const docRef = await addDoc(collection(db, 'invitations'), invitationData);
    return inviteToken;
  },

  async acceptInvitation(invitationId: string, groupId: string, userId: string, userEmail: string, userDisplayName: string): Promise<void> {
    // Add user to group members
    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayUnion({
        userId,
        email: userEmail,
        displayName: userDisplayName,
        role: 'member' as const,
        joinedAt: Timestamp.now()
      }),
      memberIds: arrayUnion(userId)
    });

    // Update invitation status
    await updateDoc(doc(db, 'invitations', invitationId), {
      status: 'accepted'
    });
  },

  async rejectInvitation(invitationId: string): Promise<void> {
    await updateDoc(doc(db, 'invitations', invitationId), {
      status: 'rejected'
    });
  },

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const groupDoc = await getDocs(query(collection(db, 'groups'), where('__name__', '==', groupId)));
    
    if (groupDoc.empty) {
      throw new Error('Group not found');
    }

    const group = { id: groupDoc.docs[0].id, ...groupDoc.docs[0].data() } as Group;
    const updatedMembers = group.members.filter(member => member.userId !== userId);
    
    if (updatedMembers.length === 0) {
      // Delete the group if no members left
      await deleteDoc(doc(db, 'groups', groupId));
      return true; // Group was deleted
    } else {
      // Update group members
      await updateDoc(doc(db, 'groups', groupId), {
        members: updatedMembers,
        memberIds: arrayRemove(userId)
      });
      return false; // Group still exists
    }
  },

  async getInvitationByToken(token: string): Promise<GroupInvitation | null> {
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('inviteToken', '==', token)
    );

    const snapshot = await getDocs(invitationsQuery);
    
    if (snapshot.empty) {
      return null;
    }

    const invitationDoc = snapshot.docs[0];
    const data = invitationDoc.data();
    
    return {
      id: invitationDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date()
    } as GroupInvitation;
  },

  isInvitationValid(invitation: GroupInvitation): { valid: boolean; reason?: string } {
    if (invitation.expiresAt < new Date()) {
      return { valid: false, reason: 'This invitation has expired' };
    }

    if (invitation.status !== 'pending') {
      return { valid: false, reason: 'This invitation has already been used' };
    }

    return { valid: true };
  },

  generateInviteLink(token: string, baseUrl: string): string {
    return `${baseUrl}/dashboard/groups/invite/${token}`;
  }
};
