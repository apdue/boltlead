# Lead Management System

A Next.js application for managing and downloading Facebook lead form data.

## Features

- Connect to Facebook Pages and access lead forms
- View lead data with filtering options
- Download leads as Excel or CSV files
- Split large datasets into multiple files
- Send lead data directly via email

## Email Functionality Setup

To use the email sending feature, you need to configure the following environment variables in your `.env.local` file:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Setting up with Gmail

If you're using Gmail as your email provider:

1. Use your Gmail address as `EMAIL_USER`
2. For `EMAIL_PASS`, you need to create an "App Password":
   - Go to your Google Account settings
   - Navigate to Security > 2-Step Verification
   - At the bottom, select "App passwords"
   - Create a new app password for "Mail" and "Other (Custom name)"
   - Use the generated 16-character password as your `EMAIL_PASS`
3. Keep the default `EMAIL_HOST` and `EMAIL_PORT` settings

### Using Other Email Providers

If you're using a different email provider, update the `EMAIL_HOST` and `EMAIL_PORT` values according to your provider's SMTP settings.

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Usage Instructions

### Sending Leads via Email

1. Select a lead form from the dropdown
2. Choose your desired date range
3. Go to the "Download Options" tab
4. Select "Excel" as the format
5. Click "Send via Email" instead of "Download Files"
6. Enter the recipient email address(es)
7. If splitting into multiple files, you can specify different email addresses for each file
8. Click "Send via Email" to process and send the data

The email will be sent with the Excel file(s) attached and will include information about the lead form, date range, and number of leads in the email body. 