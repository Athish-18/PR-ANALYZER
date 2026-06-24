

async function testPersistence() {
  console.log("Creating dummy repository record if needed...");
  const repoRes = await fetch('http://localhost:3000/api/repos/fetch', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({repoUrl: 'https://github.com/facebook/react'})
  });
  const repoData = await repoRes.json();
  const repoId = repoData.repositoryId;
  console.log("Repo ID:", repoId);

  console.log("Sending question 1...");
  const q1 = await fetch(`http://localhost:3000/api/repos/${repoId}/ask`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({question: 'How does useState work?', debug: true})
  });
  const r1 = await q1.json();
  const conversationId = r1.conversationId;
  console.log("Conversation ID created:", conversationId);
  console.log("Has diagnostics:", !!r1.diagnostics);

  console.log("Sending question 2 on same conversation...");
  const q2 = await fetch(`http://localhost:3000/api/repos/${repoId}/ask`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({question: 'Explain mountState in Fiber', debug: true, conversationId})
  });
  await q2.json();

  console.log("Fetching conversations...");
  const cRes = await fetch(`http://localhost:3000/api/repos/${repoId}/conversations`);
  const conversations = await cRes.json();
  console.log("Conversations found:", conversations.length);
  console.log("Title of first:", conversations[0].title);

  console.log("Fetching messages for conversation...");
  const mRes = await fetch(`http://localhost:3000/api/repos/${repoId}/conversations/${conversationId}/messages`);
  const messagesData = await mRes.json();
  console.log("Messages found:", messagesData.messages.length); // Should be 4 (2 user, 2 assistant)
  console.log("First assistant message has diagnostics?", !!messagesData.messages[1].diagnostics);
}

testPersistence();
