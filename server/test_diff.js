const diff = '+++ b/src/store.ts\\n+ function createStore() {\\n+ console.log("hello");\\n+ }';
fetch('http://localhost:5000/api/repos/43/review', {
  method: 'POST', 
  headers: {'Content-Type': 'application/json'}, 
  body: JSON.stringify({type: 'diff', diff})
}).then(r=>r.json()).then(console.log);
