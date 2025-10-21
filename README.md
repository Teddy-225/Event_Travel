# Roka Event Travel Details Webpage 💍

A beautiful, mobile-friendly webpage for collecting guest travel details for a Roka celebration. Features elegant Indian-themed design, Google Sheets integration, and automated notifications.

## Features ✨

- **Elegant Design**: Pastel colors, floral motifs, and Indian celebration aesthetic
- **Mobile Responsive**: Optimized for all devices
- **Form Validation**: Real-time validation with user-friendly feedback
- **Google Sheets Integration**: Automatic data storage
- **Email Notifications**: Host receives email with guest details
- **WhatsApp Integration**: Automated acknowledgments to guests
- **Admin Dashboard**: View and download all travel details
- **Confirmation Messages**: Beautiful success animations

## Setup Instructions 🚀

### 1. Google Sheets Setup

1. Create a new Google Sheet
2. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)
3. Update `CONFIG.SHEET_ID` in `script.js`

### 2. Google Apps Script Setup

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the code from `google-apps-script.js`
4. Update the configuration variables:
   - `SHEET_ID`: Your Google Sheet ID
   - `ADMIN_EMAIL`: Host's email address
   - `ADMIN_PHONE`: Host's WhatsApp number
5. Deploy as a web app:
   - Click "Deploy" > "New Deployment"
   - Choose "Web app" as type
   - Set execute permissions to "Anyone"
   - Copy the web app URL
6. Update `GOOGLE_SCRIPT_URL` in `script.js`

### 3. Customization

Update these values in `script.js` and `index.html`:

```javascript
// In script.js
const CONFIG = {
    GOOGLE_SHEET_ID: 'YOUR_GOOGLE_SHEET_ID',
    GOOGLE_SCRIPT_URL: 'YOUR_GOOGLE_SCRIPT_URL',
    ADMIN_EMAIL: 'host@example.com',
    ADMIN_PHONE: '+919876543210',
    EVENT_NAME: 'Priya & Arjun\'s Roka Celebration',
    EVENT_DATE: '15th March 2024',
    EVENT_VENUE: 'The Grand Palace, Mumbai'
};
```

```html
<!-- In index.html -->
<h1 class="main-title">Welcome to <span class="couple-names">Priya & Arjun's</span> Roka Celebration 💍</h1>
<p class="event-date">📅 15th March 2024</p>
<p class="event-location">📍 The Grand Palace, Mumbai</p>
```

### 4. WhatsApp Integration (Optional)

For WhatsApp notifications, you'll need to integrate with a service like:
- Twilio WhatsApp API
- WhatsApp Business API
- A third-party service like MessageBird

Update the `sendWhatsAppMessage` function in `google-apps-script.js` with your chosen service.

## File Structure 📁

```
Wedding/
├── index.html              # Main webpage
├── styles.css              # Styling and responsive design
├── script.js               # Frontend JavaScript
├── google-apps-script.js    # Backend Google Apps Script
└── README.md               # This file
```

## Design Features 🎨

- **Color Scheme**: Peach, gold, cream, and blush pink
- **Typography**: Playfair Display (serif) + Poppins (sans-serif)
- **Mobile First**: Responsive design for all screen sizes
- **Animations**: Smooth transitions and loading states
- **Accessibility**: Proper form labels and keyboard navigation

## Form Fields 📝

- Guest Name
- Number of Guests
- Arrival Date & Time
- Arrival Location
- Transport Mode (Flight/Train/Car/Bus)
- Departure Date & Time
- Contact Number
- WhatsApp Number (optional)
- Special Notes

## Admin Features 👨‍💼

- **Dashboard**: View all submitted travel details
- **Download**: Export data as CSV
- **Real-time Updates**: Refresh to see new submissions
- **Mobile Friendly**: Admin panel works on all devices

## Browser Support 🌐

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Security 🔒

- Form validation on both client and server side
- HTTPS required for production
- Google Sheets API security
- Input sanitization

## Troubleshooting 🔧

### Common Issues

1. **Form not submitting**: Check Google Apps Script URL
2. **No email notifications**: Verify Gmail permissions
3. **WhatsApp not working**: Check API integration
4. **Mobile layout issues**: Clear browser cache

### Testing

1. Test form submission with sample data
2. Verify Google Sheets data entry
3. Check email notifications
4. Test on different devices

## Support 💬

For issues or questions:
1. Check the browser console for errors
2. Verify Google Apps Script deployment
3. Test with sample data first
4. Check network connectivity

## License 📄

This project is created for personal use. Feel free to customize and use for your own events!

---

**Made with love for our Roka 💫**
