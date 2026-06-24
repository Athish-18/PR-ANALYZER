async function testRag() {
  const q1 = "Explain createStore";
  console.log(`\nTesting: ${q1}`);
  const r1 = await fetch("http://localhost:5000/api/repos/43/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: q1, debug: true })
  });
  const data1 = await r1.json();
  console.log("Answer:", data1.answer?.substring(0, 200));
  console.log("Diagnostics:", data1.diagnostics ? "Present" : "Missing");
}

testRag();
