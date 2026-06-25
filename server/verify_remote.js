const BASE_URL = "https://pr-analyzer-backend-hpoe.onrender.com";

async function verify() {
  try {
    console.log("1. Checking health endpoint...");
    const hRes = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (hRes && hRes.ok) {
      console.log("✅ Health endpoint responded:", await hRes.json());
    } else {
      console.error("❌ Health endpoint failed");
    }
    
    console.log("2. Checking repository fetch (zustand)...");
    const repoRes = await fetch(`${BASE_URL}/api/repos/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl: "https://github.com/pmndrs/zustand" })
    });
    if (repoRes.ok) {
      const data = await repoRes.json();
      console.log("✅ Repository fetched:", data);
      
      const repoId = data.repositoryId;
      
      console.log("3. Polling progress...");
      let done = false;
      while(!done) {
        const progRes = await fetch(`${BASE_URL}/api/repos/${repoId}/progress`);
        const prog = await progRes.json();
        console.log(`   Status: ${prog.status}`);
        if (prog.status === 'Indexed' || prog.status === 'Failed') {
          done = true;
          if (prog.status === 'Indexed') console.log("✅ Ingestion, chunking, and embeddings finished!");
          else console.error("❌ Ingestion failed");
        }
        await new Promise(r => setTimeout(r, 3000));
      }
      
      console.log("4. Testing RAG Queries...");
      const askRes = await fetch(`${BASE_URL}/api/repos/${repoId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Explain createStore" })
      });
      if (askRes.ok) {
        const askData = await askRes.json();
        console.log("✅ RAG response received. Length:", askData.answer.length);
      } else {
        console.error("❌ RAG Query failed");
      }
      
      console.log("5. Testing PR Review...");
      const diff = `
+++ b/src/store.ts
@@ -1,5 +1,5 @@
 function createStore() {
-  let state = { count: 0 };
+  let state = { count: 0 };
   
   return {
     getState: () => state,
-    setState: (fn) => { state = fn(state); }
+    setState: (fn) => { state = fn(state); }
   };
 }`;
      const reviewRes = await fetch(`${BASE_URL}/api/repos/${repoId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diff })
      });
      if (reviewRes.ok) {
        console.log("✅ PR Review returned successfully");
      } else {
        console.error("❌ PR Review failed");
      }

    } else {
      console.error("❌ Repo fetch failed:", await repoRes.text());
    }

  } catch (err) {
    console.error("Verification crashed:", err);
  }
}

verify();
