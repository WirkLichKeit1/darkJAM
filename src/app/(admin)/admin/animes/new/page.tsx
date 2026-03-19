import AnimeForm from "./AnimeForm";

export default function NewAnimePage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "2rem" }}>
        Novo anime
      </h1>
      <AnimeForm />
    </div>
  );
}