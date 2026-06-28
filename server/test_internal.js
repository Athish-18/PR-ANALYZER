import { pool } from './src/config/db.js';
import { reviewGithubPr } from './src/services/review.service.js';

async function test() {
  try {
    console.log("Testing reviewGithubPr with repoId=44 (axios) and pmndrs/zustand PR...");
    const result = await reviewGithubPr(44, "https://github.com/pmndrs/zustand/pull/3532");
    console.log("SUCCESSFUL REVIEW:", result);
  } catch (error) {
    console.error("VALIDATION ERROR CAUGHT:", error.message);
  } finally {
    await pool.end();
  }
}

test();
