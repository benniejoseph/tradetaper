#!/bin/bash

# 🚀 Deploy TradeTaper Backend to Cloud Run (trade-taper project)

PROJECT_ID="trade-taper"
SERVICE_NAME="tradetaper-backend"
REGION="us-central1"
INSTANCE_CONNECTION_NAME="trade-taper:us-central1:trade-taper-postgres"

echo "🚀 Deploying TradeTaper Backend to Cloud Run..."
echo "📦 Project: ${PROJECT_ID}"
echo "🌍 Region: ${REGION}"
echo ""

# Set the project
gcloud config set project ${PROJECT_ID}

# Build and push container image
echo "🏗️ Building container image..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest .

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the logs above."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Cloud Run with ICT system
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 5 \
  --cpu-boost \
  --update-env-vars "NODE_ENV=production,INSTANCE_CONNECTION_NAME=${INSTANCE_CONNECTION_NAME},DB_HOST=/cloudsql/${INSTANCE_CONNECTION_NAME},DB_PORT=5432,DB_NAME=tradetaper,DB_USER=postgres,DB_USERNAME=postgres,DB_PASSWORD=TradetaperDB2024!,JWT_SECRET=311d5e52dd8896799b6a7dcf73832d30647f823817e68e70d153b7f77427b97c958e0eca65aed664fc7466848ade1e70c04c7249398b29c46d17a14235b2d112,GEMINI_API_KEY=AIzaSyAl7EUlHvOVAVeeOoIqChfkiVxriMgTgYc,GLOBAL_PREFIX=api/v1,FRONTEND_URL=https://tradetaper-frontend-jtgcjetsx-benniejosephs-projects.vercel.app,GOOGLE_CLIENT_ID=326520250422-jl7bee78315684rflpf3djijhr8pgnt0.apps.googleusercontent.com,GOOGLE_CLIENT_SECRET=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,GOOGLE_CALLBACK_URL=https://tradetaper-backend-yhiuxa72ja-uc.a.run.app/api/v1/auth/google/callback,ALPHA_VANTAGE_API_KEY=7VSF3159NOLQ4KBL,FMP_API_KEY=d70qpAx9bJCRSDkV7C9n5dvN4wCmAdW9,NEWS_API_KEY=236fe13ee70740df8190cca7e77dea86,POLYGON_API_KEY=_OJDrbB9SjEaz5V5YRB44qm4rVsWz2Xi,TRADERMADE_API_KEY=X4FgwHzL7HpukWs4FjYV,JWT_EXPIRATION_TIME=24h,ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,https://tradetaper-frontend-jtgcjetsx-benniejosephs-projects.vercel.app,https://tradetaper-admin-44q1gbakx-benniejosephs-projects.vercel.app,https://tradetaper-admin.vercel.app,https://tradetaper-frontend.vercel.app"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 CLOUD RUN DEPLOYMENT SUCCESSFUL!"
    echo ""
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 Backend URL: ${SERVICE_URL}"
    echo "🏥 Health Check: ${SERVICE_URL}/health"
    echo "📡 API Base: ${SERVICE_URL}/api/v1"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔗 Update your frontend .env.production files:"
    echo ""
    echo "   NEXT_PUBLIC_API_URL=${SERVICE_URL}/api/v1"
    echo "   NEXT_PUBLIC_BACKEND_URL=${SERVICE_URL}/api/v1"
    echo "   NEXT_PUBLIC_WS_URL=${SERVICE_URL}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ ICT TRADING SYSTEM DEPLOYED!"
    echo ""
    echo "📸 Chart Image Analysis: ${SERVICE_URL}/api/v1/ict/analyze-charts"
    echo "🤖 ICT AI Agent: ${SERVICE_URL}/api/v1/ict/ai-analysis"
    echo "💰 Premium/Discount: ${SERVICE_URL}/api/v1/ict/premium-discount"
    echo "⚡ Power of Three: ${SERVICE_URL}/api/v1/ict/power-of-three"
    echo "🏛️ Order Blocks: ${SERVICE_URL}/api/v1/ict/order-blocks"
    echo "📊 Fair Value Gaps: ${SERVICE_URL}/api/v1/ict/fair-value-gaps"
    echo "🕐 Kill Zones: ${SERVICE_URL}/api/v1/ict/kill-zones"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🧪 Test the deployment:"
    echo "   curl ${SERVICE_URL}/health"
    echo "   curl ${SERVICE_URL}/api/v1/market-intelligence/public/status"
    echo ""
    echo "💰 Cost Optimization:"
    echo "   ✅ Scale to zero when idle"
    echo "   ✅ Pay-per-request billing"
    echo "   ✅ 50-70% cost reduction"
    echo ""
else
    echo "❌ Cloud Run deployment failed!"
    exit 1
fi

