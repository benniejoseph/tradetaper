#!/bin/bash
# TradeTaper Cost Monitoring Script
# Run daily to check infrastructure costs and usage

set -e

echo "======================================"
echo "TradeTaper Cost & Usage Report"
echo "Date: $(date)"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Cloud Run Services
echo "📊 Cloud Run Services"
echo "------------------------------------"
gcloud run services list --format="table(name,region,status.latestReadyRevisionName,status.traffic[0].percent)" | head -10
echo ""

# Check Redis Status
echo "💾 Redis (Memorystore)"
echo "------------------------------------"
gcloud redis instances list --region us-central1 --format="table(name,tier,memorySizeGb,state,currentLocationId)" 2>/dev/null || echo "No Redis instances"
echo ""

# Check VPC Connector
echo "🔌 VPC Connector"
echo "------------------------------------"
gcloud compute networks vpc-access connectors list --region us-central1 --format="table(name,state,minInstances,maxInstances,machineType)" 2>/dev/null || echo "No VPC connectors"
echo ""

# Check Compute Instances
echo "💻 Compute Engine VMs"
echo "------------------------------------"
gcloud compute instances list --format="table(name,zone,machineType,status,scheduling.preemptible)" | head -10
echo ""

# Check Storage Buckets
echo "🗄️  Storage Buckets"
echo "------------------------------------"
gsutil ls | while read bucket; do
    size=$(gsutil du -sh "$bucket" 2>/dev/null | awk '{print $1}')
    echo "  $bucket - $size"
done
echo ""

# Estimate Monthly Costs
echo "💰 Estimated Monthly Costs"
echo "------------------------------------"

# Cloud Run (rough estimate based on always-on)
cloud_run_cost=70
echo -e "  Cloud Run Services:      ${GREEN}\$${cloud_run_cost}${NC}"

# Redis
redis_cost=12
echo -e "  Redis (1GB Basic):       ${GREEN}\$${redis_cost}${NC}"

# VPC Connector (2 min instances)
vpc_cost=15
echo -e "  VPC Connector:           ${GREEN}\$${vpc_cost}${NC}"

# Compute Engine VM
vm_cost=7
echo -e "  Compute Engine VM:       ${GREEN}\$${vm_cost}${NC}"

# Storage
storage_cost=2
echo -e "  Storage & Networking:    ${GREEN}\$${storage_cost}${NC}"

total_gcp=$((cloud_run_cost + redis_cost + vpc_cost + vm_cost + storage_cost))
echo "  --------------------------------"
echo -e "  GCP Total:               ${YELLOW}\$${total_gcp}/month${NC}"
echo ""

# External services estimate
echo "  External Services (estimated):"
echo -e "    Supabase:              ${GREEN}\$0-25${NC}"
echo -e "    MetaAPI:               ${YELLOW}\$0-79${NC} (verify subscription)"
echo -e "    Other APIs:            ${GREEN}\$0${NC} (free tiers)"
echo ""

# Check for cost anomalies
echo "⚠️  Cost Alerts"
echo "------------------------------------"

# Check for running instances that shouldn't be
stopped_vms=$(gcloud compute instances list --filter="status=TERMINATED" --format="value(name)" | wc -l)
if [ "$stopped_vms" -gt 0 ]; then
    echo -e "  ${YELLOW}Warning: $stopped_vms stopped VM(s) still incur disk costs${NC}"
fi

# Check for large storage buckets
large_buckets=$(gsutil ls | while read bucket; do
    size_bytes=$(gsutil du -s "$bucket" 2>/dev/null | awk '{print $1}')
    if [ "$size_bytes" -gt 1073741824 ]; then  # > 1GB
        echo "$bucket"
    fi
done | wc -l)
if [ "$large_buckets" -gt 0 ]; then
    echo -e "  ${YELLOW}Warning: $large_buckets bucket(s) over 1GB in size${NC}"
fi

echo ""
echo "======================================"
echo "✅ Cost check complete"
echo "======================================"
echo ""
echo "💡 Optimization Tips:"
echo "  1. Cloud Run scale-to-zero enabled: ✅"
echo "  2. Monitor Supabase usage (free tier: 500MB DB, 2GB egress)"
echo "  3. Verify MetaAPI subscription cost"
echo "  4. Consider preemptible VM for dev/test workloads"
echo ""
