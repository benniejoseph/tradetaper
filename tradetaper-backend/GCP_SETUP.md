# 🌐 GCP Cloud Storage Setup Guide for TradeTaper

This guide helps you set up Google Cloud Storage for TradeTaper's image upload functionality in both development and production environments.

## 📋 Prerequisites

1. **Google Cloud CLI** installed (already done ✅)
2. **GCP Project** (`tradetaper`) with billing enabled
3. **Service Account** with Storage permissions
4. **GCS Bucket** for image storage

## 🔧 Development Setup (Local)

### 1. Environment Configuration

Your `.env` file should include:

```bash
# GCP Configuration
GOOGLE_APPLICATION_CREDENTIALS=./tradetaper-161a7b4779bc.json
GCS_BUCKET_NAME=tradetaper-bucket-images
GCS_PUBLIC_URL_PREFIX=https://storage.googleapis.com/tradetaper-bucket-images
```

### 2. Test GCP Connection

Run the test script to verify everything works:

```bash
cd tradetaper-backend
node test-gcp.js
```

You should see:
```
🎉 GCP Storage is working correctly!
```

## 🚀 Production Setup (Railway/Vercel/Render)

### 1. Service Account JSON

For production, you need to set the entire service account JSON as an environment variable.

**Copy the content of `tradetaper-161a7b4779bc.json` and set it as:**

```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"tradetaper","private_key_id":"161a7b4779bc41e6e14ee6596a63dc2ada6713e6","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCfoujWkS+BQvoA...","client_email":"tradetaperimageuploader@tradetaper.iam.gserviceaccount.com",...}
```

### 2. Bucket Configuration

```bash
GCS_BUCKET_NAME=tradetaper-bucket-images
GCS_PUBLIC_URL_PREFIX=https://storage.googleapis.com/tradetaper-bucket-images
```

### 3. Railway Deployment

In Railway dashboard → Environment Variables, add:

```
GOOGLE_APPLICATION_CREDENTIALS_JSON=[paste entire JSON content]
GCS_BUCKET_NAME=tradetaper-bucket-images
GCS_PUBLIC_URL_PREFIX=https://storage.googleapis.com/tradetaper-bucket-images
```

### 4. Update Backend Code for Production

The backend automatically handles both file path (development) and JSON string (production) configurations in `src/files/files.service.ts`.

## 🔒 Bucket Permissions

### Current Service Account Permissions

The service account `tradetaperimageuploader@tradetaper.iam.gserviceaccount.com` has:

- ✅ Storage Object Admin (on bucket `tradetaper-bucket-images`)
- ✅ Storage Legacy Bucket Reader

### File Access

Files are stored with public read access via:
- **Direct URLs**: `https://storage.googleapis.com/tradetaper-bucket-images/users/{userId}/trades/images/{filename}`
- **Next.js Image Optimization**: Configured in `next.config.ts`

## 📁 File Structure

Images are uploaded to:
```
gs://tradetaper-bucket-images/
├── users/
│   └── {userId}/
│       └── trades/
│           └── images/
│               ├── uuid1.jpg
│               ├── uuid2.png
│               └── ...
└── test/
    └── [test files - auto-cleaned]
```

## 🧪 Testing Image Upload Flow

### 1. Start Development Servers

```bash
./start-dev.sh
```

### 2. Test Upload

1. Navigate to `http://localhost:3001/journal/new`
2. Fill out the trade form
3. Upload an image in the "Chart Snapshot" section
4. Submit the form
5. Verify image appears in GCP bucket

### 3. Production Testing

Deploy to your platform and test the same flow. Check logs for any GCP-related errors.

## 🚨 Troubleshooting

### Common Issues

1. **"Service account not found"**
   - Check `GOOGLE_APPLICATION_CREDENTIALS` path in development
   - Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is properly set in production

2. **"Bucket not found"**
   - Verify `GCS_BUCKET_NAME=tradetaper-bucket-images`
   - Check bucket exists: `gcloud storage ls gs://tradetaper-bucket-images`

3. **"Permission denied"**
   - Verify service account has Storage Object Admin role
   - Check bucket IAM permissions

4. **"Files not loading in frontend"**
   - Verify `next.config.ts` includes correct `storage.googleapis.com` pattern
   - Check bucket public access policy

### Debug Commands

```bash
# Test bucket access
gcloud storage ls gs://tradetaper-bucket-images

# Check service account
gcloud iam service-accounts list

# Test file upload
node test-gcp.js
```

## 📱 Frontend Configuration

Ensure `tradetaper-frontend/next.config.ts` includes:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'storage.googleapis.com',
      pathname: '/tradetaper-bucket-images/**',
    },
  ],
},
```

## ✅ Verification Checklist

- [ ] GCP CLI installed and authenticated
- [ ] Service account JSON file exists
- [ ] Environment variables configured
- [ ] Test script passes (`node test-gcp.js`)
- [ ] Development servers start without errors
- [ ] Image upload works in browser
- [ ] Images display correctly in journal
- [ ] Production deployment includes GCP env vars

## 📞 Support

If you encounter issues:

1. Run `node test-gcp.js` for diagnostic information
2. Check server logs for GCP-related errors
3. Verify all environment variables are set correctly
4. Ensure bucket permissions are properly configured 