import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import PostEditor from "@/components/admin/PostEditor";
import { getPost, listPosts } from "@/lib/admin-db";
import { getLinkedInConnectionStatus } from "@/lib/linkedin";
import { recommendPublishingSlot } from "@/lib/linkedin-scheduling";

export const dynamic = "force-dynamic";

export default async function AdminPostPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const [post, linkedin, publishedPosts] = await Promise.all([
    getPost(params.id),
    getLinkedInConnectionStatus(),
    listPosts("posted"),
  ]);

  if (!post) notFound();

  return (
    <PostEditor
      post={post}
      linkedinConnected={linkedin.connected}
      recommendedSlot={recommendPublishingSlot(publishedPosts)}
    />
  );
}
