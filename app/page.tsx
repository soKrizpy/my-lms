import { supabase } from "../lib/supabaseClient";

export default async function Home() {
  const { data: modules, error } = await supabase
    .from("modules")
    .select("*")
    .limit(5);

  console.log("modules", modules);
  console.log("error", error);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>My LMS</h1>
      <h2>Daftar Modul (test Supabase)</h2>

      {error && <p>Error: {error.message}</p>}

      <ul>
        {modules && modules.length > 0 ? (
          modules.map((m: any) => <li key={m.id}>{m.title}</li>)
        ) : (
          <li>Tidak ada modul</li>
        )}
      </ul>
    </main>
  );
}
