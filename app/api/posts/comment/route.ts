import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addComment, getPost } from "@/lib/services/posts";
import { notifyPostCommented } from "@/lib/services/notifications";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 },
      );
    }

    const comment = await addComment(postId, user.id, content);

    // Get comment with user info
    const { data: commentWithUser } = await supabase
      .from("post_comments")
      .select(
        `
        *,
        user:users!post_comments_user_id_fkey(id, name, email)
      `,
      )
      .eq("id", comment.id)
      .single();

    // Notify post author
    const post = await getPost(postId);
    if (post && post.author_id !== user.id) {
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();

      if (userData) {
        await notifyPostCommented(
          post.author_id,
          userData.name,
          postId,
          post.title,
        );
      }
    }

    return NextResponse.json({
      ...commentWithUser,
      user: Array.isArray(commentWithUser?.user)
        ? commentWithUser.user[0]
        : commentWithUser?.user,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 },
    );
  }
}
