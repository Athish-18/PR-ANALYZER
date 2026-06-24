import { pool } from './src/config/db.js';
import { generateAnswer } from './src/services/rag.service.js';

async function investigate() {
  try {
    const queries = [
      "Trace useState -> mountState -> dispatchSetState",
      "Trace useReducer initialization flow",
      "How does dispatchSetState update state?",
      "How does mountState create state?"
    ];

    for (const question of queries) {
      console.log(`\n===========================================`);
      console.log(`QUESTION: "${question}"`);
      
      const response = await generateAnswer(1, question, false);
      
      console.log(`\nANSWER:\n${response.answer}`);
      console.log(`\nSOURCES:`);
      response.sources.slice(0, 3).forEach(s => console.log(`  - ${s.filePath}`));
      if (response.sources.length > 3) {
        console.log(`  - ... and ${response.sources.length - 3} more`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
investigate();
