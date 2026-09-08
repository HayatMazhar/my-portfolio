import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import PostEditor from "@/components/admin/PostEditor";
import { getPost } from "@/lib/admin-db";
import { getLinkedInConnectionStatus } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

export default async function AdminPostPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const [post, linkedin] = await Promise.all([
    getPost(params.id),
    getLinkedInConnectionStatus(),
  ]);

  if (!post) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-coal line-clamp-2">{post.topic}</h1>
        <p className="mt-1 text-sm text-coal-muted">Review, approve, publish.</p>
      </div>
      <PostEditor post={post} linkedinConnected={linkedin.connected} />
    </div>
  );
}
