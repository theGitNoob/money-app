'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import { loadUserProfile, saveUserProfile, UserProfile } from '@/lib/profile';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const userProfile = await loadUserProfile(user.uid);
          if (userProfile) {
            setProfile(userProfile);
          } else if (user.email) {
            // If no profile exists, create one
            const newProfile: UserProfile = {
              name: user.displayName || user.email,
              email: user.email,
              photoURL: user.photoURL || '',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await saveUserProfile(user.uid, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
          toast({
            title: "Error",
            description: "Failed to load your profile.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user, toast]);

  const handleSave = async () => {
    if (user && profile) {
      try {
        await saveUserProfile(user.uid, { name: profile.name });
        setIsEditing(false);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      } catch (error) {
        console.error("Failed to save profile:", error);
        toast({
          title: "Error",
          description: "Failed to save your profile.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!user || !profile) {
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'US';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.photoURL || ''} alt={profile.name || 'User'} />
                <AvatarFallback className="text-2xl">{getInitials(profile.name)}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{profile.name || 'User'}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant={user.emailVerified ? "default" : "secondary"}>
                {user.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatDate(profile.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Last updated {formatDate(profile.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="flex space-x-2">
                  <Input
                    id="displayName"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isEditing}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="email"
                    value={profile.email || ''}
                    disabled
                    className="flex-1"
                  />
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email address cannot be changed from this interface.
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Account ID</Label>
                <Input value={user.uid} disabled />
                <p className="text-xs text-muted-foreground">
                  Your unique account identifier.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-medium">Account Status</h3>
                <p className="text-sm text-muted-foreground">
                  Your account is active and in good standing.
                </p>
              </div>
              <Badge variant="outline" className="self-start">
                Active
              </Badge>
            </div>

            {isEditing && (
              <div className="flex space-x-2">
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => {
                  // This would need to refetch original profile to be a true cancel
                  setIsEditing(false);
                }}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
