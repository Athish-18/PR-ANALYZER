async function fetchRepo() {
  console.log("Starting ingestion...");
  const res = await fetch("http://localhost:3000/api/repos/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl: "https://github.com/pmndrs/zustand" })
  });
  const data = await res.json();
  console.log("Ingestion finished:", data);
}
fetchRepo();
