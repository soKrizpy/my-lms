// app/admin/modules/[id]/topics/page.tsx

import { supabase } from "../../../../../lib/supabaseClient";
import { AddTopicForm } from "./AddTopicForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ModuleTopicsPage(props: PageProps) {
  const params = await props.params;
  const moduleIdParam = params.id;

  if (!moduleIdParam) {
    return (
      <section>
        <h1>Topik Modul</h1>
        <p style={{ color: "red" }}>ID modul tidak valid.</p>
      </section>
    );
  }

  const { data: moduleData, error: moduleError } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleIdParam)
    .single();

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("*")
    .eq("module_id", Number(moduleIdParam))
    .order("order_index", { ascending: true });

  console.log("topics query result:", topics);
  console.log("topics query error:", topicsError);
  if (moduleError) {
    return (
      <section>
        <h1>Topik Modul</h1>
        <p style={{ color: "red" }}>Error modul: {moduleError.message}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Topik untuk Modul: {moduleData?.title}</h1>
      <p>{moduleData?.description}</p>
      {/* Form tambah topik */}
      <AddTopicForm moduleId={moduleIdParam} />
      {topicsError && (
        <p style={{ color: "red" }}>Error topik: {topicsError.message}</p>
      )}
      {!topics || topics.length === 0 ? (
        <p>Belum ada topik untuk modul ini.</p>
      ) : (
        <ol style={{ marginTop: "1rem" }}>
          {topics.map((t: any) => (
            <li key={t.id}>
              {t.order_index}. {t.title}{" "}
              <a
                href={`/admin/modules/${moduleIdParam}/topics/${t.id}/quiz`}
                style={{ marginLeft: "0.5rem" }}
              >
                Kelola quiz
              </a>
            </li>
          ))}
        </ol>
      )}{" "}
    </section>
  );

  console.log("topics query result:", topics);
  console.log("topics query error:", topicsError);
}
