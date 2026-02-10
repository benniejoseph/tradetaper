import subprocess
import sys
import re

# Configuration
SERVICE_NAME = "tradetaper-backend"
REGION = "us-central1"
PROJECT_ID = "trade-taper"
INSTANCE_CONNECTION_NAME = "trade-taper:us-central1:trade-taper-postgres"
IMAGE_URL = f"{REGION}-docker.pkg.dev/{PROJECT_ID}/{SERVICE_NAME}/{SERVICE_NAME}:latest"

def deploy():
    # Read env-vars.yaml manually to avoid pyyaml dependency
    env_vars = {}
    try:
        with open('env-vars.yaml', 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                # Parse KEY: "VALUE" or KEY: VALUE
                # Look for first colon
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    val = parts[1].strip()
                    
                    # Remove surrounding quotes if present
                    if (val.startswith('"') and val.endswith('"')) or \
                       (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1]
                    
                    env_vars[key] = val
    except Exception as e:
        print(f"Error reading env-vars.yaml: {e}")
        sys.exit(1)

    # Add INSTANCE_CONNECTION_NAME to env list
    env_list.append(f"INSTANCE_CONNECTION_NAME={INSTANCE_CONNECTION_NAME}")
    
    env_string = ",".join(env_list)

    # Cloud Run Deploy Command
    cmd = [
        "gcloud", "run", "deploy", SERVICE_NAME,
        "--image", IMAGE_URL,
        "--region", REGION,
        "--project", PROJECT_ID,
        "--allow-unauthenticated",
        "--memory", "2Gi",
        "--cpu", "2",
        "--timeout", "900",
        "--concurrency", "80",
        "--max-instances", "5",
        "--cpu-boost",
        "--add-cloudsql-instances", INSTANCE_CONNECTION_NAME,
        "--set-env-vars", env_string
    ]

    print("🚀 Deploying to Cloud Run with Python Helper (No-Dep)...")
    print(f"Command: {' '.join(cmd)}")

    try:
        subprocess.run(cmd, check=True)
        print("✅ Deployment Successful!")
    except subprocess.CalledProcessError as e:
        print("❌ Deployment Failed!")
        sys.exit(1)

if __name__ == "__main__":
    deploy()
