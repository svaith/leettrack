# Vercel Deployment Guide

This guide will help you deploy LeetTrack to Vercel securely.

## Pre-Deployment Checklist

1. **Environment Variables**
   - Copy all variables from `.env.local` to Vercel environment variables
   - Required variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `CRON_SECRET` (generate a secure random string)

2. **Supabase Configuration**
   - Ensure all Row Level Security (RLS) policies are enabled
   - Verify authentication settings
   - Set up proper CORS configuration in Supabase dashboard

3. **Vercel Settings**
   - Enable HTTPS-only
   - Set Node.js version to 18.x or higher
   - Enable Production Environment

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. Configure the environment variables
3. Deploy the application
4. Verify the cron job is set up correctly
5. Test all functionality in the production environment

## Security Features

- **Security Headers**: Configured in both `next.config.js` and `vercel.json`
- **HTTPS Enforcement**: Enabled by default on Vercel
- **Rate Limiting**: Implemented for all API endpoints
- **Input Validation**: Added for user inputs
- **Error Handling**: Generic error messages in production
- **Cron Job Security**: Protected by `CRON_SECRET`

## Monitoring

After deployment, monitor:
- API response times
- Error rates
- Cron job execution
- User authentication flows

## Troubleshooting

If you encounter issues:
1. Check Vercel logs
2. Verify environment variables
3. Test API endpoints
4. Check Supabase connection

## Regular Maintenance

- Update dependencies regularly
- Monitor security advisories
- Back up Supabase database
- Review application logs