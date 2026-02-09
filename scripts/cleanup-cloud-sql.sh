#!/bin/bash
# Safe Cloud SQL Cleanup Script
# This script helps safely remove the unused Cloud SQL instance

set -e

INSTANCE_NAME="trade-taper-postgres"
BACKUP_BUCKET="gs://tradetaper-uploads/backups"
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)

echo "========================================="
echo "Cloud SQL Cleanup Script"
echo "Instance: $INSTANCE_NAME"
echo "Date: $(date)"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify instance exists
echo "Step 1: Verifying instance..."
if ! gcloud sql instances describe $INSTANCE_NAME &>/dev/null; then
    echo -e "${RED}ERROR: Instance $INSTANCE_NAME not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Instance found${NC}"
echo ""

# Step 2: Check current status
echo "Step 2: Checking current status..."
STATUS=$(gcloud sql instances describe $INSTANCE_NAME --format="value(state)")
TIER=$(gcloud sql instances describe $INSTANCE_NAME --format="value(settings.tier)")
POLICY=$(gcloud sql instances describe $INSTANCE_NAME --format="value(settings.activationPolicy)")

echo "  Status: $STATUS"
echo "  Tier: $TIER"
echo "  Activation Policy: $POLICY"
echo ""

# Step 3: Check recent operations
echo "Step 3: Checking recent connections..."
RECENT_OPS=$(gcloud sql operations list --instance=$INSTANCE_NAME --limit=5 --format="table(operationType,status,startTime)")
echo "$RECENT_OPS"
echo ""

# Step 4: Show estimated cost
echo "Step 4: Current cost estimate..."
echo -e "  Monthly cost: ${YELLOW}\$10-15/month${NC}"
echo -e "  Annual cost: ${YELLOW}\$120-180/year${NC}"
echo ""

# Step 5: Offer options
echo "========================================="
echo "What would you like to do?"
echo "========================================="
echo ""
echo "1. Create backup and STOP instance (RECOMMENDED)"
echo "   - Creates final backup to Cloud Storage"
echo "   - Stops the instance (saves 80% of costs)"
echo "   - Data preserved for 1 week testing"
echo "   - Reversible (can restart if needed)"
echo ""
echo "2. Create backup and DELETE instance immediately"
echo "   - Creates final backup to Cloud Storage"
echo "   - Permanently deletes instance"
echo "   - Cannot be undone"
echo "   - Saves $10-15/month immediately"
echo ""
echo "3. Just create backup (no changes)"
echo "   - Creates backup for safety"
echo "   - Leaves instance running"
echo ""
echo "4. Cancel (exit without changes)"
echo ""
read -p "Enter choice (1-4): " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "========================================="
        echo "Option 1: Backup and STOP"
        echo "========================================="
        echo ""

        # Create backup
        echo "Creating backup..."
        BACKUP_FILE="$BACKUP_BUCKET/cloud-sql-final-backup-$BACKUP_DATE.sql"
        echo "  Destination: $BACKUP_FILE"

        gcloud sql export sql $INSTANCE_NAME $BACKUP_FILE \
            --database=postgres || {
            echo -e "${RED}Backup failed! Aborting.${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ Backup created successfully${NC}"
        echo ""

        # Stop instance
        echo "Stopping instance..."
        gcloud sql instances patch $INSTANCE_NAME \
            --activation-policy=NEVER || {
            echo -e "${RED}Failed to stop instance${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ Instance stopped${NC}"
        echo ""

        echo "========================================="
        echo -e "${GREEN}SUCCESS!${NC}"
        echo "========================================="
        echo ""
        echo "What happened:"
        echo "  • Backup saved to: $BACKUP_FILE"
        echo "  • Instance STOPPED (not deleted)"
        echo "  • Compute billing stopped (saves ~80%)"
        echo "  • Storage still billed (~$1-2/month)"
        echo "  • Data preserved and safe"
        echo ""
        echo "Next steps:"
        echo "  1. Test your application for 1 week"
        echo "  2. Verify Supabase handles all queries"
        echo "  3. If everything works, delete instance:"
        echo "     gcloud sql instances delete $INSTANCE_NAME"
        echo ""
        echo "To restart if needed:"
        echo "  gcloud sql instances patch $INSTANCE_NAME --activation-policy=ALWAYS"
        echo ""
        ;;

    2)
        echo ""
        echo "========================================="
        echo "Option 2: Backup and DELETE"
        echo "========================================="
        echo ""
        echo -e "${RED}WARNING: This action cannot be undone!${NC}"
        echo ""
        read -p "Type 'DELETE' to confirm: " CONFIRM

        if [ "$CONFIRM" != "DELETE" ]; then
            echo "Cancelled."
            exit 0
        fi

        # Create backup
        echo "Creating backup..."
        BACKUP_FILE="$BACKUP_BUCKET/cloud-sql-final-backup-$BACKUP_DATE.sql"
        echo "  Destination: $BACKUP_FILE"

        gcloud sql export sql $INSTANCE_NAME $BACKUP_FILE \
            --database=postgres || {
            echo -e "${RED}Backup failed! Aborting deletion.${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ Backup created successfully${NC}"
        echo ""

        # Delete instance
        echo "Deleting instance..."
        gcloud sql instances delete $INSTANCE_NAME --quiet || {
            echo -e "${RED}Failed to delete instance${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ Instance deleted${NC}"
        echo ""

        echo "========================================="
        echo -e "${GREEN}SUCCESS!${NC}"
        echo "========================================="
        echo ""
        echo "What happened:"
        echo "  • Backup saved to: $BACKUP_FILE"
        echo "  • Instance PERMANENTLY DELETED"
        echo "  • Monthly savings: $10-15"
        echo "  • Annual savings: $120-180"
        echo ""
        echo "Backup details:"
        echo "  • Location: $BACKUP_FILE"
        echo "  • Size: $(gsutil du -sh $BACKUP_FILE 2>/dev/null || echo 'calculating...')"
        echo "  • Retention: Keep for 90 days minimum"
        echo ""
        ;;

    3)
        echo ""
        echo "========================================="
        echo "Option 3: Backup Only"
        echo "========================================="
        echo ""

        # Create backup
        echo "Creating backup..."
        BACKUP_FILE="$BACKUP_BUCKET/cloud-sql-backup-$BACKUP_DATE.sql"
        echo "  Destination: $BACKUP_FILE"

        gcloud sql export sql $INSTANCE_NAME $BACKUP_FILE \
            --database=postgres || {
            echo -e "${RED}Backup failed!${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ Backup created successfully${NC}"
        echo ""

        echo "Backup saved to: $BACKUP_FILE"
        echo "Instance left running (no changes made)"
        echo ""
        ;;

    4)
        echo "Cancelled. No changes made."
        exit 0
        ;;

    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo "========================================="
echo "Script complete"
echo "========================================="
