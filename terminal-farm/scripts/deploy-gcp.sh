#!/bin/bash
set -e

# Ensure gcloud is in PATH
export PATH="$HOME/google-cloud-sdk/bin:$PATH"

# Configuration
INSTANCE_NAME="tradetaper-terminal"
ZONE="us-central1-a"
MACHINE_TYPE="e2-micro" # Always Free Tier
IMAGE_PROJECT="ubuntu-os-cloud"
IMAGE_FAMILY="ubuntu-2204-lts"
DISK_SIZE="30GB" # Free tier limit is 30GB
PROJECT_ID=$(gcloud config get-value project)

echo "=== TradeTaper Terminal Farm - GCP Deployment ==="
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE_NAME"
echo "Zone: $ZONE"
echo "Machine: $MACHINE_TYPE (Free Tier eligible)"

# Check if instance exists
if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --quiet >/dev/null 2>&1; then
    echo "Instance $INSTANCE_NAME already exists."
else
    echo "Creating instance $INSTANCE_NAME..."
    gcloud compute instances create $INSTANCE_NAME \
        --project=$PROJECT_ID \
        --zone=$ZONE \
        --machine-type=$MACHINE_TYPE \
        --network-interface=network-tier=STANDARD,subnet=default \
        --maintenance-policy=MIGRATE \
        --provisioning-model=STANDARD \
        --scopes=https://www.googleapis.com/auth/cloud-platform \
        --tags=http-server,https-server \
        --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image=projects/$IMAGE_PROJECT/global/images/family/$IMAGE_FAMILY,mode=rw,size=$DISK_SIZE,type=pd-standard \
        --metadata=startup-script='#! /bin/bash
# Enable Swap (Crucial for 1GB RAM)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo "/swapfile none swap sw 0 0" >> /etc/fstab

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Docker Compose
apt-get update && apt-get install -y docker-compose-plugin
'
    echo "Instance created. Waiting for startup (approx 60s)..."
    sleep 60
fi

echo "Deploying files..."
# Create directory
gcloud compute ssh ubuntu@$INSTANCE_NAME --zone=$ZONE --command="mkdir -p ~/terminal-farm/ea ~/terminal-farm/scripts"

# Copy files
gcloud compute scp --zone=$ZONE docker-compose.yml ubuntu@$INSTANCE_NAME:~/terminal-farm/
gcloud compute scp --zone=$ZONE Dockerfile ubuntu@$INSTANCE_NAME:~/terminal-farm/
gcloud compute scp --zone=$ZONE .env ubuntu@$INSTANCE_NAME:~/terminal-farm/
gcloud compute scp --zone=$ZONE supervisor.conf ubuntu@$INSTANCE_NAME:~/terminal-farm/
gcloud compute scp --zone=$ZONE mt5-install.zip ubuntu@$INSTANCE_NAME:~/terminal-farm/
gcloud compute scp --zone=$ZONE scripts/start-terminal.sh ubuntu@$INSTANCE_NAME:~/terminal-farm/scripts/
gcloud compute scp --zone=$ZONE scripts/run-docker.sh ubuntu@$INSTANCE_NAME:~/terminal-farm/scripts/
gcloud compute scp --recurse --zone=$ZONE ea/TradeTaperSync.mq5 ubuntu@$INSTANCE_NAME:~/terminal-farm/ea/

echo "Starting Application..."
gcloud compute ssh ubuntu@$INSTANCE_NAME --zone=$ZONE --command="bash ~/terminal-farm/scripts/run-docker.sh"

echo "=== Deployment Complete ==="
echo "Terminal should be starting up."
echo "You can check logs with: gcloud compute ssh ubuntu@$INSTANCE_NAME --zone=$ZONE --command='cd ~/terminal-farm && sudo docker compose logs -f'"
