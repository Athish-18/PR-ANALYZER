import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RENDER_API_KEY = "rnd_Tx7yzeBOqzgd8mpaLUi0TrwKAgVE";
const HEADERS = {
  "Authorization": `Bearer ${RENDER_API_KEY}`,
  "Accept": "application/json",
  "Content-Type": "application/json"
};

async function deploy() {
  try {
    // 1. Get Owner ID
    console.log("Fetching owner info...");
    const ownerRes = await fetch("https://api.render.com/v1/owners", { headers: HEADERS });
    if (!ownerRes.ok) throw new Error("Failed to fetch owners: " + await ownerRes.text());
    const owners = await ownerRes.json();
    if (owners.length === 0) throw new Error("No owner found on Render account");
    const ownerId = owners[0].owner.id;
    console.log("Owner ID:", ownerId);

    // 2. Read environment variables from .env
    const envPath = path.join(__dirname, '.env');
    const envVarsList = [];
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#') && line.includes('=')) {
          const [key, ...rest] = line.split('=');
          envVarsList.push({ key: key.trim(), value: rest.join('=').trim() });
        }
      }
    }
    
    // Add NODE_ENV
    envVarsList.push({ key: "NODE_ENV", value: "production" });
    
    // Force port 10000 for render if needed, but render sets PORT automatically
    // Make sure frontend url is set, we can leave it generic or update later

    // 3. Create Web Service
    console.log("Creating Web Service...");
    const createRes = await fetch("https://api.render.com/v1/services", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        type: "web_service",
        name: "pr-analyzer-backend",
        ownerId: ownerId,
        repo: "https://github.com/Athish-18/PR-ANALYZER",
        autoDeploy: "yes",
        branch: "main",
        buildFilter: {
          paths: ["server/**"],
          ignoredPaths: ["client/**"]
        },
        rootDir: "server",
        serviceDetails: {
          env: "node",
          plan: "free",
          region: "oregon",
          envVars: envVarsList,
          envSpecificDetails: {
            buildCommand: "npm install",
            startCommand: "npm start"
          }
        }
      })
    });

    if (!createRes.ok) {
      throw new Error("Failed to create service: " + await createRes.text());
    }

    const service = await createRes.json();
    console.log("Service created successfully!");
    console.log("Service ID:", service.id);
    console.log("Service URL:", service.service.serviceDetails.url);
    
    // We should trigger a deploy if it doesn't start automatically
    console.log("Deployment initiated. Render URL:", service.service.serviceDetails.url);
    
    // Write service info to a file for later steps
    fs.writeFileSync(path.join(__dirname, 'render_info.json'), JSON.stringify(service, null, 2));
    
  } catch (err) {
    console.error("Deploy script failed:", err);
  }
}

deploy();
