const diff = `
+++ b/src/store.ts
@@ -1,5 +1,5 @@
 function createStore() {
-  let state = { count: 0 };
+  let state = { count: 0 };
+  let listeners = [];
   
   return {
     getState: () => state,
-    setState: (fn) => { state = fn(state); }
+    setState: (fn) => { state = fn(state); /* oops forgot to call listeners */ }
   };
 }
`;

async function testReview() {
  console.log("Testing POST /api/repos/43/review..."); // Using 43 for pmndrs/zustand based on previous chat logs
  try {
    const res = await fetch("http://localhost:5000/api/repos/43/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diff })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("\nReview:\n", data.review);
    console.log("\nDiagnostics:\n", data.diagnostics);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testReview();
