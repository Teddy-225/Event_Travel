// Google Apps Script for Roka Event Travel Details
// Deploy this script as a web app with execute permissions for "Anyone"

// Configuration - Update these values
const CONFIG = {
  SHEET_ID: '1V7esjrwW6kZ7oQyuyrtL9xGlDWIkEoeUvWBXlJbdkvQ',
  SHEET_NAME: 'Travel Details',
  ALBUM_SHEET_NAME: 'Photo Album',
  ADMIN_EMAIL: 'kapoorsharan98@gmail.com', // Replace with host email
  EVENT_NAME: 'Angel & Sharan\'s Roka Celebration',
  EVENT_DATE: '24th October 2025',
  EVENT_VENUE: 'Kapoor Villa, Udaipur',
  ALBUM_FOLDER_NAME: 'Angel & Sharan Roka Celebration Photos',
  MAX_FILE_SIZE: 100 * 1024 * 1024 // 100MB
};

// Handle GET requests (for testing and data retrieval)
function doGet(e) {
  try {
    // Check if this is a data request
    const action = e.parameter.action;
    
    let response;
    
    if (action === 'getTravelData') {
      const data = getTravelData();
      response = {
        success: true,
        data: data,
        message: 'Travel data retrieved successfully',
        timestamp: new Date().toISOString()
      };
    } else {
      // Default test response
      response = { 
        status: 'success', 
        message: 'Google Apps Script is working!',
        timestamp: new Date().toISOString()
      };
    }
    
    const contentResponse = ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Add CORS headers manually
    contentResponse.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    return contentResponse;
  } catch (error) {
    const errorResponse = ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: error.message 
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
    errorResponse.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    return errorResponse;
  }
}

// Main function to handle requests
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let response;
    
    switch (action) {
      case 'addTravelDetails':
        response = addTravelDetails(data.data);
        break;
      case 'getTravelData':
        response = getTravelData();
        break;
      case 'sendHostNotification':
        response = sendHostNotification(data.email, data.message);
        break;
      case 'sendGuestAcknowledgment':
        response = sendGuestAcknowledgment(data.guestEmail, data.message);
        break;
      case 'getOrCreateAlbum':
        response = getOrCreateAlbum(data.eventName);
        break;
      case 'uploadFile':
        response = uploadFileToDrive(data);
        break;
      default:
        throw new Error('Invalid action: ' + action);
    }
    
    const contentResponse = ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Add CORS headers manually
    contentResponse.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    return contentResponse;
      
  } catch (error) {
    const errorResponse = ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
    
    errorResponse.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    return errorResponse;
  }
}

// Add travel details to Google Sheet
function addTravelDetails(data) {
  try {
    // Validate data object
    if (!data || !data.guestName) {
      throw new Error('Missing required data');
    }
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    }
    
    // Create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Timestamp', 'Guest Name', 'Number of Guests', 'Arrival Date', 'Arrival Time',
        'Arrival Location', 'Transport Mode', 'Departure Date', 'Departure Time',
        'Contact Number', 'Email Address', 'Notes', 'Event Name'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Add new row with safe property access
    const row = [
      new Date(),
      data.guestName || 'Not provided',
      data.numberOfGuests || 'Not provided',
      data.arrivalDate || 'Not provided',
      data.arrivalTime || 'Not provided',
      data.arrivalLocation || 'Not provided',
      data.transportMode || 'Not provided',
      data.departureDate || 'Not specified',
      data.departureTime || 'Not specified',
      data.contactNumber || 'Not provided',
      data.guestEmail || 'Not provided',
      data.notes || 'No notes',
      data.eventName || CONFIG.EVENT_NAME
    ];
    
    sheet.appendRow(row);
    
    return { success: true, message: 'Travel details added successfully' };
    
  } catch (error) {
    throw new Error(`Failed to add travel details to sheet: ${error.message}`);
  }
}

// Get all travel data
function getTravelData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return [];
    }
    
    // Convert to objects (skip header row)
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map((row) => {
      const obj = {};
      headers.forEach((header, headerIndex) => {
        const key = header.toLowerCase().replace(/\s+/g, '');
        obj[key] = row[headerIndex];
      });
      return obj;
    });
    
    return result;
    
  } catch (error) {
    throw new Error('Failed to retrieve travel data: ' + error.message);
  }
}

// Send email notification to host
function sendHostNotification(email, message) {
  try {
    // Send email to host
    if (email) {
      GmailApp.sendEmail(
        email,
        `New Travel Details - ${CONFIG.EVENT_NAME}`,
        message,
        {
          name: CONFIG.EVENT_NAME
        }
      );
    }
    
    return { success: true, message: 'Host notification sent via email' };
    
  } catch (error) {
    throw new Error('Failed to send host notification');
  }
}

// Send acknowledgment to guest via email
function sendGuestAcknowledgment(guestEmail, message) {
  try {
    // Send email acknowledgment to guest
    if (guestEmail) {
      GmailApp.sendEmail(
        guestEmail,
        `Thank you for your travel details - ${CONFIG.EVENT_NAME}`,
        message,
        {
          name: CONFIG.EVENT_NAME
        }
      );
      return { success: true, message: 'Guest acknowledgment sent via email' };
    }
    
    return { success: false, message: 'No guest email provided' };
    
  } catch (error) {
    throw new Error('Failed to send guest acknowledgment');
  }
}

// Create the Google Sheet with proper headers
function createSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    }
    
    // Set headers
    const headers = [
      'Timestamp', 'Guest Name', 'Number of Guests', 'Arrival Date', 'Arrival Time',
      'Arrival Location', 'Transport Mode', 'Departure Date', 'Departure Time',
      'Contact Number', 'WhatsApp Number', 'Notes', 'Event Name'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#d4a574');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    return { success: true, message: 'Sheet created successfully' };
    
  } catch (error) {
    throw new Error('Failed to create sheet');
  }
}

// Test function to verify setup
function testSetup() {
  try {
    // Test sheet access
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    
    // Test email sending (uncomment when ready)
    // GmailApp.sendEmail(CONFIG.ADMIN_EMAIL, 'Test Email', 'This is a test email from the Roka event system.');
    
    return { success: true, message: 'Setup test completed' };
    
  } catch (error) {
    throw new Error('Setup test failed: ' + error.message);
  }
}

// Utility function to format dates
function formatDate(dateString) {
  const date = new Date(dateString);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd MMM yyyy');
}


// ==================== PHOTO/VIDEO ALBUM FUNCTIONALITY ====================

// Get or create album folder
function getOrCreateAlbum(eventName) {
  try {
    // First, try to find existing folder
    const existingFolder = findAlbumFolder(CONFIG.ALBUM_FOLDER_NAME);
    if (existingFolder) {
      return {
        success: true,
        folderId: existingFolder.getId(),
        webViewLink: existingFolder.getUrl(),
        message: 'Album folder found'
      };
    }
    
    // Create new folder if not found
    const newFolder = createAlbumFolder(CONFIG.ALBUM_FOLDER_NAME);
    
    // Create album tracking sheet
    createAlbumSheet();
    
    return {
      success: true,
      folderId: newFolder.getId(),
      webViewLink: newFolder.getUrl(),
      message: 'Album folder created successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Find existing album folder
function findAlbumFolder(folderName) {
  try {
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    return null;
  } catch (error) {
    console.error('Error finding folder:', error);
    return null;
  }
}

// Create new album folder
function createAlbumFolder(folderName) {
  try {
    const folder = DriveApp.createFolder(folderName);
    
    // Set folder permissions to allow anyone with link to view
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return folder;
  } catch (error) {
    throw new Error('Failed to create album folder: ' + error.message);
  }
}

// Create album tracking sheet
function createAlbumSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.ALBUM_SHEET_NAME);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.ALBUM_SHEET_NAME);
    }
    
    // Create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Timestamp', 'File Name', 'File ID', 'File Type', 'File Size', 
        'Uploader', 'Web View Link', 'Event Name'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#d4a574');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }
    
    return { success: true, message: 'Album sheet created' };
    
  } catch (error) {
    throw new Error('Failed to create album sheet: ' + error.message);
  }
}

// Upload file to Google Drive
function uploadFileToDrive(data) {
  try {
    // This function will be called from the web app with file data
    // For now, return a mock response - actual implementation would handle file upload
    return {
      success: true,
      fileId: 'mock_file_id_' + Date.now(),
      webViewLink: 'https://drive.google.com/file/d/mock_file_id/view',
      message: 'File upload functionality needs to be implemented with proper file handling'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Add file to album tracking
function addFileToAlbum(fileData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.ALBUM_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Album sheet not found');
    }
    
    const row = [
      new Date(),
      fileData.fileName || 'Unknown',
      fileData.fileId || 'Unknown',
      fileData.fileType || 'Unknown',
      fileData.fileSize || 0,
      fileData.uploader || 'Anonymous',
      fileData.webViewLink || 'Unknown',
      fileData.eventName || CONFIG.EVENT_NAME
    ];
    
    sheet.appendRow(row);
    
    return { success: true, message: 'File added to album tracking' };
    
  } catch (error) {
    throw new Error('Failed to add file to album: ' + error.message);
  }
}

// Get album files
function getAlbumFiles() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.ALBUM_SHEET_NAME);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return [];
    }
    
    // Convert to objects (skip header row)
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map((row) => {
      const obj = {};
      headers.forEach((header, headerIndex) => {
        const key = header.toLowerCase().replace(/\s+/g, '');
        obj[key] = row[headerIndex];
      });
      return obj;
    });
    
    return result;
    
  } catch (error) {
    throw new Error('Failed to get album files: ' + error.message);
  }
}

// Setup instructions for deployment:
/*
1. Create a new Google Sheet and copy its ID from the URL
2. Update CONFIG.SHEET_ID with your sheet ID
3. Update CONFIG.ADMIN_EMAIL and CONFIG.ADMIN_PHONE with your details
4. Deploy this script as a web app:
   - Go to Deploy > New Deployment
   - Choose "Web app" as type
   - Set execute permissions to "Anyone"
   - Copy the web app URL
5. Update the GOOGLE_SCRIPT_URL in your JavaScript file with the web app URL
6. Test the setup using the testSetup() function

IMPORTANT: For file uploads to work properly, you'll need to:
1. Enable the Drive API in Google Cloud Console
2. Add proper file handling in the uploadFileToDrive function
3. Consider using a different approach for large file uploads (like direct Drive API calls)
*/
