import os
import time
import requests
import docker
import logging
from typing import Dict, List, Any

# Configuration
API_ENDPOINT = os.getenv("API_ENDPOINT", "https://api.tradetaper.io")
ORCHESTRATOR_SECRET = os.getenv("ORCHESTRATOR_SECRET", "your-orchestrator-secret")
IMAGE_NAME = os.getenv("IMAGE_NAME", "tradetaper/mt5-terminal:latest")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "60"))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("Orchestrator")

def get_docker_client():
    return docker.from_env()

def fetch_config() -> List[Dict[str, Any]]:
    """Fetch active terminal configuration from backend"""
    url = f"{API_ENDPOINT}/api/v1/orchestrator/config"
    headers = {
        "x-orchestrator-secret": ORCHESTRATOR_SECRET
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Failed to fetch config: {e}")
        return []

def reconcile_containers(client, config: List[Dict[str, Any]]):
    """Reconcile running containers with desired configuration"""
    
    # 1. Get running containers managed by us
    containers = client.containers.list(all=True, filters={"label": "managed_by=tradetaper"})
    running_map = {c.name: c for c in containers}
    
    # 2. Process desired state
    desired_ids = set()
    
    for term_config in config:
        term_id = term_config['id']
        container_name = f"tt-mt5-{term_id}"
        desired_ids.add(container_name)
        
        status = term_config.get('status', 'RUNNING')
        
        if status == 'STOPPED':
            if container_name in running_map:
                logger.info(f"Stopping container {container_name}...")
                try:
                    running_map[container_name].stop()
                    running_map[container_name].remove()
                    logger.info(f"Container {container_name} removed.")
                except Exception as e:
                    logger.error(f"Failed to remove {container_name}: {e}")
            continue

        # If it should be running
        if container_name not in running_map:
            logger.info(f"Starting new terminal {term_id}...")
            start_terminal(client, container_name, term_config)
        else:
            container = running_map[container_name]
            if container.status != 'running':
                logger.info(f"Restarting container {container_name}...")
                container.start()

    # 3. Cleanup orphans (optional - be careful not to kill manual containers)
    # for name, container in running_map.items():
    #     if name not in desired_ids:
    #         logger.warning(f"Found orphan container {name}. Stopping...")
    #         container.stop()
    #         container.remove()

def start_terminal(client, container_name: str, config: Dict[str, Any]):
    """Start a single MT5 terminal container"""
    env = config.get('environment', {})
    
    # Add standard env vars
    env['API_ENDPOINT'] = API_ENDPOINT
    env['ENABLE_VNC'] = "false" # Disable VNC for headless by default
    
    try:
        client.containers.run(
            IMAGE_NAME,
            detach=True,
            name=container_name,
            environment=env,
            labels={"managed_by": "tradetaper"},
            restart_policy={"Name": "unless-stopped"},
            # Mount volume for persistence if needed
            # volumes={'mt5-data': {'bind': '/home/trader/.wine', 'mode': 'rw'}}
        )
        logger.info(f"Started {container_name} successfully.")
    except Exception as e:
        logger.error(f"Failed to start {container_name}: {e}")

def main():
    logger.info("Starting TradeTaper Terminal Orchestrator")
    client = get_docker_client()
    
    while True:
        logger.info("Checking configuration...")
        config = fetch_config()
        
        if config:
            reconcile_containers(client, config)
        
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
