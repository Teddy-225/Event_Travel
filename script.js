// Configuration
const CONFIG = {
    GOOGLE_SHEET_ID: '1V7esjrwW6kZ7oQyuyrtL9xGlDWIkEoeUvWBXlJbdkvQ',
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby08YZbJHnIBV6pwsDe9fFHA93oeymZy1efuHo-Y7ey2biYTeBnI3ceK2MDXydkMWxgNg/exec',
    ADMIN_EMAIL: 'kapoorsharan98@gmail.com', // Replace with host email
    ADMIN_PHONE: '+919587566699', // Replace with host WhatsApp number
    EVENT_NAME: 'Angel & Sharan\'s Roka Celebration',
    EVENT_DATE: '24th October 2025',
    EVENT_VENUE: 'Kapoor Vilas, Udaipur'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setMinDate();
});

// Set minimum date to today
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('arrivalDate').min = today;
    document.getElementById('departureDate').min = today;
}

// Initialize form handling
function initializeForm() {
    const form = document.getElementById('travelForm');
    const confirmationMessage = document.getElementById('confirmationMessage');
    
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
        submitBtn.disabled = true;
        
        try {
            // Collect form data
            const formData = collectFormData();
            
            // Validate form data
            if (!validateFormData(formData)) {
                showError('Please fill in all required fields and try again.');
                return;
            }
            
            // Submit to Google Sheets (don't block on this)
            submitToGoogleSheets(formData).catch(error => {
                showError('There was an issue saving your data. Please try again or contact us directly.');
            });
            
            // Send notifications (don't block on this)
            sendNotifications(formData).catch(error => {
                // Don't show error for notifications as they're not critical
            });
            
            // Always show confirmation regardless of backend success
            showConfirmation();
            
            // Reset form
            form.reset();
            
        } catch (error) {
            showError('Something went wrong. Please check your details and try again.');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Collect form data
function collectFormData() {
    const form = document.getElementById('travelForm');
    const formData = new FormData(form);
    
    return {
        guestName: formData.get('guestName'),
        numberOfGuests: formData.get('numberOfGuests'),
        arrivalDate: formData.get('arrivalDate'),
        arrivalTime: formData.get('arrivalTime'),
        arrivalLocation: formData.get('arrivalLocation'),
        transportMode: formData.get('transportMode'),
        departureDate: formData.get('departureDate'),
        departureTime: formData.get('departureTime'),
        contactNumber: formData.get('contactNumber'),
        guestEmail: formData.get('guestEmail'),
        notes: formData.get('notes'),
        submissionTime: new Date().toISOString(),
        eventName: CONFIG.EVENT_NAME
    };
}

// Validate form data
function validateFormData(data) {
    const requiredFields = [
        { name: 'guestName', label: 'Guest Name' },
        { name: 'numberOfGuests', label: 'Number of Guests' },
        { name: 'arrivalDate', label: 'Arrival Date' },
        { name: 'arrivalTime', label: 'Arrival Time' },
        { name: 'arrivalLocation', label: 'Arrival Location' },
        { name: 'transportMode', label: 'Transport Mode' },
        { name: 'contactNumber', label: 'Contact Number' },
        { name: 'guestEmail', label: 'Email Address' }
    ];
    
    // Check required fields
    for (const field of requiredFields) {
        if (!data[field.name] || data[field.name].trim() === '') {
            showError(`Please fill in the ${field.label} field.`);
            return false;
        }
    }
    
    // Validate dates
    const arrivalDate = new Date(data.arrivalDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (arrivalDate < today) {
        showError('Arrival date cannot be in the past. Please select a future date.');
        return false;
    }
    
    // Only validate departure date if provided
    if (data.departureDate && data.departureDate.trim() !== '') {
        const departureDate = new Date(data.departureDate);
        if (departureDate < arrivalDate) {
            showError('Departure date cannot be before arrival date. Please check your dates.');
            return false;
        }
    }
    
    // Validate contact number format
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(data.contactNumber)) {
        showError('Please enter a valid contact number (at least 10 digits).');
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.guestEmail)) {
        showError('Please enter a valid email address.');
        return false;
    }
    
    return true;
}

// Submit to Google Sheets
async function submitToGoogleSheets(data) {
    try {
        
        // Check if Google Script URL is configured
        if (!CONFIG.GOOGLE_SCRIPT_URL || CONFIG.GOOGLE_SCRIPT_URL.includes('YOUR_GOOGLE_SCRIPT_URL')) {
            throw new Error('Google Apps Script URL not configured');
        }
        
        // Try with CORS first, fallback to no-cors if needed
        let response;
        try {
            response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addTravelDetails',
                    data: data
                })
            });
        } catch (corsError) {
            // Fallback to no-cors mode
            response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addTravelDetails',
                    data: data
                })
            });
        }
        
        
        // Handle no-cors response (opaque response)
        if (response.type === 'opaque') {
            return { success: true, message: 'Data submitted (no-cors mode)' };
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            
            // Parse error message for better user feedback
            let errorMessage = 'Failed to save your data';
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Use default error message
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        
        // Check for specific error types
        if (error.message.includes('not configured')) {
            throw new Error('System configuration error. Please contact the event organizers.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            throw new Error('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('403')) {
            throw new Error('Access denied. Please contact the event organizers.');
        } else if (error.message.includes('404')) {
            throw new Error('Service not found. Please contact the event organizers.');
        } else {
            throw new Error(`Unable to save your data: ${error.message}`);
        }
    }
}

// Send notifications
async function sendNotifications(data) {
    try {
        // Send email to host
        await sendHostNotification(data);
        
        // Send acknowledgment to guest
        await sendGuestAcknowledgment(data);
        
    } catch (error) {
        // Don't throw error as this shouldn't block form submission
    }
}

// Send notification to host
async function sendHostNotification(data) {
    const departureInfo = data.departureDate && data.departureTime 
        ? `${formatDate(data.departureDate)} at ${data.departureTime}`
        : 'Not specified yet';
    
    const message = `
🎉 New Travel Details Received!

Guest: ${data.guestName}
Number of Guests: ${data.numberOfGuests}
Arrival: ${formatDate(data.arrivalDate)} at ${data.arrivalTime}
From: ${data.arrivalLocation}
Transport: ${data.transportMode}
Departure: ${departureInfo}
Contact: ${data.contactNumber}
Email: ${data.guestEmail || 'Not provided'}
Notes: ${data.notes || 'None'}

Event: ${CONFIG.EVENT_NAME}
    `;
    
    try {
        // Send via Google Apps Script with CORS fallback
        try {
            await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'sendHostNotification',
                    email: CONFIG.ADMIN_EMAIL,
                    message: message
                })
            });
        } catch (corsError) {
            await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'sendHostNotification',
                    email: CONFIG.ADMIN_EMAIL,
                    message: message
                })
            });
        }
    } catch (error) {
    }
}

// Send acknowledgment to guest
async function sendGuestAcknowledgment(data) {
    const departureInfo = data.departureDate && data.departureTime 
        ? `• Departure: ${formatDate(data.departureDate)} at ${data.departureTime}`
        : '• Departure: To be confirmed later';
    
    const message = `
Dear ${data.guestName},

Thank you for sharing your travel details for ${CONFIG.EVENT_NAME}! 

We're so excited to celebrate this special moment with you and your ${data.numberOfGuests} guest(s).

Your Details:
• Arrival: ${formatDate(data.arrivalDate)} at ${data.arrivalTime}
• From: ${data.arrivalLocation}
• Transport: ${data.transportMode}
${departureInfo}

Event Details:
📅 Date: ${CONFIG.EVENT_DATE}
📍 Venue: ${CONFIG.EVENT_VENUE}

We can't wait to see you soon! 💖

With love,
Angel & Sharan
    `;
    
    try {
        // Send via Google Apps Script with CORS fallback
        try {
            await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'sendGuestAcknowledgment',
                    guestEmail: data.guestEmail,
                    message: message
                })
            });
        } catch (corsError) {
            await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'sendGuestAcknowledgment',
                    guestEmail: data.guestEmail,
                    message: message
                })
            });
        }
    } catch (error) {
    }
}

// Show error message with popup
function showError(message) {
    
    // Create error popup
    const errorPopup = document.createElement('div');
    errorPopup.className = 'error-popup';
    errorPopup.innerHTML = `
        <div class="error-content">
            <div class="error-icon">⚠️</div>
            <h3>Oops! Something's not right</h3>
            <p>${message}</p>
            <button onclick="closeErrorPopup()" class="error-close-btn">Got it</button>
        </div>
    `;
    
    // Add styles
    errorPopup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
    `;
    
    // Add to page
    document.body.appendChild(errorPopup);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        if (errorPopup.parentNode) {
            errorPopup.parentNode.removeChild(errorPopup);
        }
    }, 5000);
}

// Close error popup
function closeErrorPopup() {
    const errorPopup = document.querySelector('.error-popup');
    if (errorPopup) {
        errorPopup.remove();
    }
}

// Show confirmation message
function showConfirmation() {
    
    const form = document.getElementById('travelForm');
    const confirmationMessage = document.getElementById('confirmationMessage');
    
    
    if (form && confirmationMessage) {
        form.style.display = 'none';
        confirmationMessage.style.display = 'block';
        
        // Scroll to confirmation
        confirmationMessage.scrollIntoView({ behavior: 'smooth' });
    } else {
        showError('There was an issue displaying the confirmation. Please refresh the page and try again.');
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}



// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add form validation feedback
document.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '#e8d5c4';
        }
    });
    
    field.addEventListener('input', function() {
        if (this.style.borderColor === 'rgb(231, 76, 60)') {
            this.style.borderColor = '#e8d5c4';
        }
    });
});
