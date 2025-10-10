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
    
    const { data: followersData, error } = await supabase
      .from("followers")
      .select(`
        id,
        followed_user_id,
        created_at,
        followed:users!followers_followed_user_id_fkey(
          id,
          name,
          display_name,
          avatar,
          type,
          company_name,
          followers_count
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform data to include user info
    const following = followersData?.map((f: any) => ({
      id: f.id,
      followedUserId: f.followed_user_id,
      createdAt: f.created_at,
      followedUser: f.followed ? {
        id: f.followed.id,
        name: f.followed.name,
        displayName: f.followed.display_name,
        avatar: f.followed.avatar,
        type: f.followed.type,
        companyName: f.followed.company_name,
        followersCount: f.followed.followers_count || 0,
      } : null,
    })) || [];

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
    
    const { data: followersData, error } = await supabase
      .from("followers")
      .select(`
        id,
        user_id,
        created_at,
        follower:users!followers_user_id_fkey(
          id,
          name,
          display_name,
          avatar
        )
      `)
      .eq("followed_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const followers = followersData?.map((f: any) => ({
      id: f.id,
      userId: f.user_id,
      createdAt: f.created_at,
      follower: f.follower ? {
        id: f.follower.id,
        name: f.follower.name,
        displayName: f.follower.display_name,
        avatar: f.follower.avatar,
      } : null,
    })) || [];

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
