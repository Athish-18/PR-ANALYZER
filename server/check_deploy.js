import { fileURLToPath } from 'url';
import path from 'path';

const RENDER_API_KEY = "rnd_Tx7yzeBOqzgd8mpaLUi0TrwKAgVE";
const SERVICE_ID = "srv-d8ump66gvqtc73baottg";
const DEPLOY_ID = "dep-d8ump6egvqtc73baoudg";
const HEADERS = {
  "Authorization": `Bearer ${RENDER_API_KEY}`,
  "Accept": "application/json"
};

async function checkDeploy() {
  try {
    const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys/${DEPLOY_ID}`, {
      headers: HEADERS
    });
    if (!res.ok) throw new Error("Failed to fetch deploy status");
    const data = await res.json();
    console.log("Status:", data.status);
  } catch (err) {
    console.error(err);
  }
}

checkDeploy();
