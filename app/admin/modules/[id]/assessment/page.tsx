// app/admin/modules/[id]/assessment/page.tsx
// Assessment management has been consolidated into the unified tabbed module page.
// This route now simply redirects to the Tryout tab on that page.

import { redirect } from "next/navigation";

type PageProps = {
  params:
    | { id?: string; [key: string]: unknown }
    | Promise<{ id?: string; [key: string]: unknown }>;
};

export default async function ModuleAssessmentPage({ params }: PageProps) {
  const resolvedParams = await params;
  const moduleId =
    typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  redirect(`/admin/modules/${moduleId}/topics?tab=assessment`);
}
