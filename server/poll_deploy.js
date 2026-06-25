import { fileURLToPath } from 'url';
import path from 'path';

const RENDER_API_KEY = "rnd_Tx7yzeBOqzgd8mpaLUi0TrwKAgVE";
const SERVICE_ID = "srv-d8ump66gvqtc73baottg";
const DEPLOY_ID = "dep-d8ump6egvqtc73baoudg";
const HEADERS = {
  "Authorization": `Bearer ${RENDER_API_KEY}`,
  "Accept": "application/json"
};

async function poll() {
  while (true) {
    const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys/${DEPLOY_ID}`, {
      headers: HEADERS
    });
    const data = await res.json();
    console.log("Status:", data.status);
    if (data.status === "live" || data.status === "live_with_errors" || data.status === "canceled" || data.status === "build_failed" || data.status === "update_failed" || data.status === "deactivated") {
      break;
    }
    await new Promise(r => setTimeout(r, 10000));
  }
}

poll();
