import type { PostTemplate } from "@/lib/admin-types";

export const POST_TEMPLATES: {
  id: PostTemplate;
  label: string;
  description: string;
}[] = [
  {
    id: "story",
    label: "Story",
    description: "Personal narrative with a clear takeaway",
  },
  {
    id: "lesson",
    label: "Lesson learned",
    description: "What you learned shipping in production",
  },
  {
    id: "case_study",
    label: "Case study",
    description: "Project breakdown with metrics",
  },
  {
    id: "hot_take",
    label: "Hot take",
    description: "Opinionated but grounded POV",
  },
  {
    id: "hiring_signal",
    label: "Hiring signal",
    description: "Subtle availability without sounding desperate",
  },
];

export const POST_TONES = [
  { id: "professional", label: "Professional" },
  { id: "conversational", label: "Conversational" },
  { id: "bold", label: "Bold" },
  { id: "technical", label: "Technical" },
] as const;
