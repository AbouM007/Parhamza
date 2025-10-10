import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FollowedUser {
  id: string;
  name: string;
  displayName: string | null;
  avatar: string | null;
  type: string;
  companyName: string | null;
  followersCount: number;
}

interface FollowingItem {
  id: number;
  followedUserId: string;
  createdAt: string;
  followedUser: FollowedUser | null;
}

export function useFollowers() {
  const { profile } = useAuth();
  const { toast } = useToast();

  // Get users that current user is following
  const {
    data: following = [],
    isLoading: followingLoading,
    refetch: refetchFollowing,
  } = useQuery<FollowingItem[]>({
    queryKey: ["/api/followers/following", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const res = await fetch(`/api/followers/following/${profile.id}`);
      if (!res.ok) throw new Error("Failed to fetch following");
      return res.json();
    },
    enabled: !!profile?.id,
  });

  // Check if following a specific user
  const useIsFollowing = (userId: string | undefined) => {
    return useQuery<{ isFollowing: boolean }>({
      queryKey: ["/api/followers/check", profile?.id, userId],
      queryFn: async () => {
        if (!profile?.id || !userId) {
          return { isFollowing: false };
        }
        const res = await fetch(`/api/followers/${profile.id}/${userId}/check`);
        if (!res.ok) throw new Error("Failed to check follow status");
        return res.json();
      },
      enabled: !!profile?.id && !!userId,
    });
  };

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (followedUserId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");
      
      return apiRequest(`/api/followers`, {
        method: "POST",
        body: JSON.stringify({
          followedUserId,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followers/check"] });
      toast({
        title: "Suivi ajouté",
        description: "Vous suivez maintenant ce vendeur professionnel",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("Already following")) {
        toast({
          title: "Déjà suivi",
          description: "Vous suivez déjà ce vendeur",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de suivre ce vendeur",
          variant: "destructive",
        });
      }
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (followedUserId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");
      
      return apiRequest(`/api/followers/${followedUserId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followers/check"] });
      toast({
        title: "Suivi retiré",
        description: "Vous ne suivez plus ce vendeur",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de retirer le suivi",
        variant: "destructive",
      });
    },
  });

  // Toggle follow (follow or unfollow)
  const toggleFollow = async (followedUserId: string, isCurrentlyFollowing: boolean) => {
    if (!profile?.id) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour suivre des vendeurs",
        variant: "destructive",
      });
      return;
    }

    if (isCurrentlyFollowing) {
      await unfollowMutation.mutateAsync(followedUserId);
    } else {
      await followMutation.mutateAsync(followedUserId);
    }
  };

  return {
    following,
    followingLoading,
    refetchFollowing,
    useIsFollowing,
    follow: (userId: string) => followMutation.mutateAsync(userId),
    unfollow: (userId: string) => unfollowMutation.mutateAsync(userId),
    toggleFollow,
    isFollowPending: followMutation.isPending,
    isUnfollowPending: unfollowMutation.isPending,
  };
}
