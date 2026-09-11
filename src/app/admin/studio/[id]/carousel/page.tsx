import { notFound } from "next/navigation";
import CarouselDocument from "@/components/admin/CarouselDocument";
import { requireAdmin } from "@/lib/admin-guard";
import { getPost } from "@/lib/admin-db";

export const dynamic = "force-dynamic";

export default async function CarouselPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const post = await getPost(params.id);
  if (!post?.carousel_slides?.length) notFound();

  return <CarouselDocument title={post.topic} slides={post.carousel_slides} />;
}
