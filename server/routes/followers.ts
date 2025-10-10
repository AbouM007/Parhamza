import { Router } from "express";
import { supabaseServer as supabase } from "../supabase";
import { insertFollowerSchema } from "../../shared/schema.js";
import { z } from "zod";

const router = Router();

// Middleware to verify authentication
async function verifyAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid authentication" });
  }

  req.user = user;
  next();
}

// Get users that a user is following
router.get("/following/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all followers records
    const { data: followersData, error: followersError } = await supabase
      .from("followers")
      .select("id, followed_user_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (followersError) throw followersError;

    if (!followersData || followersData.length === 0) {
      return res.json([]);
    }

    // Get user IDs
    const userIds = followersData.map((f: any) => f.followed_user_id);

    // Fetch user details separately
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, display_name, avatar, type, company_name, followers_count")
      .in("id", userIds);

    if (usersError) throw usersError;

    // Create a map of users by ID
    const usersMap = new Map(usersData?.map((u: any) => [u.id, u]) || []);

    // Get active listings count for each followed user
    const { data: listingsCount, error: listingsError } = await supabase
      .from("annonces")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "approved")
      .is("deleted_at", null);

    // Count listings per user
    const listingsCountMap = new Map<string, number>();
    listingsCount?.forEach((listing: any) => {
      const count = listingsCountMap.get(listing.user_id) || 0;
      listingsCountMap.set(listing.user_id, count + 1);
    });

    // Get verification status for professional users
    const { data: verificationData, error: verificationError } = await supabase
      .from("professional_accounts")
      .select("user_id, status")
      .in("user_id", userIds);

    // Create verification status map
    const verificationMap = new Map(
      verificationData?.map((v: any) => [v.user_id, v.status === "approved"]) || []
    );

    // Transform data to include user info
    const following = followersData.map((f: any) => {
      const user = usersMap.get(f.followed_user_id);
      return {
        id: f.id,
        followedUserId: f.followed_user_id,
        createdAt: f.created_at,
        followedUser: user ? {
          id: user.id,
          name: user.name,
          displayName: user.display_name,
          avatar: user.avatar,
          type: user.type,
          companyName: user.company_name,
          followersCount: user.followers_count || 0,
          activeListingsCount: listingsCountMap.get(user.id) || 0,
          isVerified: verificationMap.get(user.id) || false,
        } : null,
      };
    });

    res.json(following);
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ error: "Failed to fetch following" });
  }
});

// Get followers of a user (who follows this user)
router.get("/followers/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all followers records
    const { data: followersData, error: followersError } = await supabase
      .from("followers")
      .select("id, user_id, created_at")
      .eq("followed_user_id", userId)
      .order("created_at", { ascending: false });

    if (followersError) throw followersError;

    if (!followersData || followersData.length === 0) {
      return res.json([]);
    }

    // Get user IDs
    const userIds = followersData.map((f: any) => f.user_id);

    // Fetch user details separately
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, display_name, avatar")
      .in("id", userIds);

    if (usersError) throw usersError;

    // Create a map of users by ID
    const usersMap = new Map(usersData?.map((u: any) => [u.id, u]) || []);

    // Transform data to include user info
    const followers = followersData.map((f: any) => {
      const user = usersMap.get(f.user_id);
      return {
        id: f.id,
        userId: f.user_id,
        createdAt: f.created_at,
        follower: user ? {
          id: user.id,
          name: user.name,
          displayName: user.display_name,
          avatar: user.avatar,
        } : null,
      };
    });

    res.json(followers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
});

// Follow a user (requires authentication)
router.post("/", verifyAuth, async (req: any, res) => {
  try {
    const { followedUserId } = req.body;
    
    if (!followedUserId) {
      return res.status(400).json({ error: "followedUserId is required" });
    }

    // Use authenticated user's ID
    const authenticatedUserId = req.user.id;

    // Prevent self-follow
    if (authenticatedUserId === followedUserId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }
    
    // Insert follower
    const { data: followerData, error: insertError } = await supabase
      .from("followers")
      .insert({
        user_id: authenticatedUserId,
        followed_user_id: followedUserId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Increment followers count
    const { error: rpcError } = await supabase.rpc(
      "increment_user_followers",
      { p_user_id: followedUserId }
    );

    if (rpcError) {
      console.error("Error incrementing followers count:", rpcError);
    }

    res.json(followerData);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      res.status(400).json({ error: "Already following this user" });
    } else {
      console.error("Error following user:", error);
      res.status(500).json({ error: "Failed to follow user" });
    }
  }
});

// Unfollow a user (requires authentication)
router.delete("/:followedUserId", verifyAuth, async (req: any, res) => {
  try {
    const { followedUserId } = req.params;
    
    // Use authenticated user's ID
    const authenticatedUserId = req.user.id;
    
    // Delete follower
    const { error: deleteError } = await supabase
      .from("followers")
      .delete()
      .eq("user_id", authenticatedUserId)
      .eq("followed_user_id", followedUserId);

    if (deleteError) throw deleteError;

    // Decrement followers count
    const { error: rpcError } = await supabase.rpc(
      "decrement_user_followers",
      { p_user_id: followedUserId }
    );

    if (rpcError) {
      console.error("Error decrementing followers count:", rpcError);
    }

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Check if user is following another user
router.get("/:userId/:followedUserId/check", async (req, res) => {
  try {
    const { userId, followedUserId } = req.params;
    
    const { data, error } = await supabase
      .from("followers")
      .select("id")
      .eq("user_id", userId)
      .eq("followed_user_id", followedUserId)
      .maybeSingle();

    if (error) throw error;

    res.json({ isFollowing: !!data });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ error: "Failed to check follow status" });
  }
});

export default router;
