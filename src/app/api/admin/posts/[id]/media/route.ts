import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPost, updatePost } from "@/lib/admin-db";
import { generateCardCopy } from "@/lib/linkedin-card-copy";
import { renderCarouselPdf, renderPostImage } from "@/lib/linkedin-media";
import { CARD_TEMPLATES, type CardTemplate } from "@/lib/linkedin-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function responseBody(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const post = await getPost(params.id);
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  const params_ = new URL(req.url).searchParams;
  const kind = params_.get("kind") ?? "image";
  if (kind === "document") {
    if (!post.carousel_slides?.length) {
      return NextResponse.json(
        { error: "Generate carousel slides first." },
        { status: 400 },
      );
    }
    const bytes = await renderCarouselPdf(post.carousel_slides);
    return new Response(responseBody(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="linkedin-carousel-${post.id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  const requested = params_.get("template");
  const template = CARD_TEMPLATES.some((item) => item.id === requested)
    ? (requested as CardTemplate)
    : "auto";

  // Card copy is written once and cached on the post: it costs a Groq call, and
  // the same image is re-requested by the preview, the editor, and publishing.
  let source = post;
  const needsCopy =
    params_.get("refresh") === "1" ||
    !post.card_copy ||
    (template !== "auto" && post.card_copy.template !== template);

  if (needsCopy) {
    const copy = await generateCardCopy(post, template);
    if (copy) {
      source = (await updatePost(post.id, { card_copy: copy })) ?? post;
    }
  }

  const bytes = await renderPostImage(source, template, {
    refreshArtwork: params_.get("refresh") === "1",
  });
  return new Response(responseBody(bytes), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="linkedin-card-${post.id}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
