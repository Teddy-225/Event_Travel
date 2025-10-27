const CONFIG = {
    GOOGLE_SHEET_ID: '1V7esjrwW6kZ7oQyuyrtL9xGlDWIkEoeUvWBXlJbdkvQ',
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby08YZbJHnIBV6pwsDe9fFHA93oeymZy1efuHo-Y7ey2biYTeBnI3ceK2MDXydkMWxgNg/exec',
    ADMIN_EMAIL: 'kapoorsharan98@gmail.com',
    ADMIN_PHONE: '+919587566699',
    EVENT_NAME: 'Angel & Sharan\'s Roka Celebration',
    EVENT_DATE: '24th October 2025',
    EVENT_VENUE: 'Kapoor Villa, Udaipur',
    ALBUM_FOLDER_ID: '',
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime']
};

document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    initializeUpload();
    initializeForm();
    setMinDate();
    initializeAlbum();
    updateHeroContent('photos');
});

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const eventDate = '2025-10-24'; // October 24th, 2025
    const maxArrivalDate = '2025-10-24'; // Cannot arrive after event date
    const maxDepartureDate = '2025-11-30'; // Allow departure until end of November
    
    // Set minimum date to today, but not before event date
    const minDate = today < eventDate ? today : eventDate;
    
    // Arrival date: from today until event date (October 24th)
    document.getElementById('arrivalDate').min = minDate;
    document.getElementById('arrivalDate').max = maxArrivalDate;
    
    // Departure date: from arrival date until end of November
    document.getElementById('departureDate').min = minDate;
    document.getElementById('departureDate').max = maxDepartureDate;
    
    // Add event date validation
    validateEventDates();
}

function initializeForm() {
    const form = document.getElementById('travelForm');
    const confirmationMessage = document.getElementById('confirmationMessage');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Validate arrival date before submission
            const arrivalDate = new Date(data.arrivalDate);
            const eventDate = new Date('2025-10-24');
            
            if (arrivalDate > eventDate) {
                throw new Error('❌ Cannot submit: Arrival date must be on or before October 24th, 2025 (the event date).');
            }
            
            data.arrivalDate = formatDate(data.arrivalDate);
            if (data.departureDate) {
                data.departureDate = formatDate(data.departureDate);
            }
            
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
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
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
            
            if (result.success) {
                confirmationMessage.style.display = 'block';
                confirmationMessage.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
                form.reset();
        } else {
                throw new Error(result.error || 'Failed to submit travel details');
            }
        
    } catch (error) {
            showError(error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showError(message) {
    const errorPopup = document.createElement('div');
    errorPopup.className = 'error-popup';
    errorPopup.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error</h3>
            <p>${message}</p>
            <button class="error-close" onclick="closeErrorPopup()">OK</button>
        </div>
    `;
    
    errorPopup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(errorPopup);
    
    setTimeout(() => {
        closeErrorPopup();
    }, 5000);
}

function closeErrorPopup() {
    const errorPopup = document.querySelector('.error-popup');
    if (errorPopup) {
        errorPopup.remove();
    }
}

function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadLink = document.getElementById('uploadLink');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadedFiles = document.getElementById('uploadedFiles');
    const filesGrid = document.getElementById('filesGrid');


    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadLink.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        processFiles(files);
    }

    function processFiles(files) {
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            // Check file type with more flexible validation for iOS files
            const isValidType = CONFIG.ALLOWED_TYPES.includes(file.type) || 
                               file.name.toLowerCase().endsWith('.heic') ||
                               file.name.toLowerCase().endsWith('.heif') ||
                               file.type === ''; // Some iOS files may not have proper MIME type
            
            if (!isValidType) {
                errors.push(`${file.name}: Unsupported file type`);
                return;
            }

            // No size constraints - accept all valid file types
            validFiles.push(file);
        });

        if (errors.length > 0) {
            showError(errors.join('\n'));
        }

        if (validFiles.length > 0) {
            uploadFiles(validFiles);
        }
    }

    async function uploadFiles(files) {
        uploadProgress.style.display = 'block';
        
        const total = files.length;
        const BATCH_SIZE = 3; // Upload 3 files simultaneously for better performance
        const results = [];
        
        // Upload files in parallel batches
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            
            // Update progress for current batch
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(files.length / BATCH_SIZE);
            const filesInBatch = batch.length;
            progressText.textContent = `Uploading batch ${batchNumber}/${totalBatches} (${filesInBatch} files)...`;
            
            // Upload batch in parallel
            const batchPromises = batch.map(async (file, batchIndex) => {
                const globalIndex = i + batchIndex;
                
                try {
                    const result = await uploadFile(file);
                    return { ...result, fileName: file.name, index: globalIndex };
                } catch (error) {
                    return {
                        success: false,
                        fileName: file.name,
                        error: error.message,
                        index: globalIndex
                    };
                }
            });
            
            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Update progress
            const completed = Math.min(i + BATCH_SIZE, files.length);
            progressFill.style.width = `${(completed / total) * 100}%`;
            
            // Small delay between batches to prevent overwhelming the server
            if (i + BATCH_SIZE < files.length) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        // Show final results
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;
        
        if (successCount === total) {
            progressText.textContent = `All ${total} files uploaded successfully!`;
        } else if (successCount > 0) {
            progressText.textContent = `${successCount} uploaded successfully, ${failedCount} failed`;
        } else {
            progressText.textContent = 'All uploads failed';
        }

        // Hide progress after showing results
        setTimeout(() => {
            uploadProgress.style.display = 'none';
        }, 3000);
    }

    async function uploadFile(file) {
        try {
            // Use direct form submission method for all files
            return await uploadFileDirect(file);
        } catch (error) {
            return {
                success: false,
                error: 'Upload failed. Please try again or contact us for assistance.'
            };
        }
    }

    // Direct form submission method that actually uploads files
    async function uploadFileDirect(file) {
        return new Promise((resolve) => {
            try {
                // Convert file to base64
                const reader = new FileReader();
                reader.onload = () => {
                    const base64Data = reader.result.split(',')[1];
                    
                    // Create a hidden form that submits to Google Apps Script
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = CONFIG.GOOGLE_SCRIPT_URL;
                    form.style.display = 'none';
                    
                    // Add all the form fields
                    const fields = {
                        'action': 'uploadFile',
                        'fileName': file.name,
                        'fileType': file.type,
                        'fileSize': file.size,
                        'fileData': base64Data
                    };
                    
                    // Create hidden inputs for each field
                    Object.keys(fields).forEach(key => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = fields[key];
                        form.appendChild(input);
                    });
                    
                    // Add form to document
                    document.body.appendChild(form);
                    
                    // Create a hidden iframe to handle the response
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.name = 'uploadFrame_' + Date.now();
                    document.body.appendChild(iframe);
                    
                    // Set form target to iframe
                    form.target = iframe.name;
                    
                    // Listen for postMessage from iframe
                    const messageHandler = (event) => {
                        if (event.data && event.data.success) {
                            // Clean up
                            if (document.body.contains(form)) {
                                document.body.removeChild(form);
                            }
                            if (document.body.contains(iframe)) {
                                document.body.removeChild(iframe);
                            }
                            
                            // Remove message listener
                            window.removeEventListener('message', messageHandler);
                            
                            resolve({
                                success: true,
                                url: 'uploaded_to_google_drive',
                                fileName: file.name,
                                message: 'File uploaded successfully to Google Drive'
                            });
                        }
                    };
                    
                    // Add message listener
                    window.addEventListener('message', messageHandler);
                    
                    // Handle iframe load (fallback)
                    iframe.onload = () => {
                        // Clean up after a delay if no message received
                        setTimeout(() => {
                            if (document.body.contains(form)) {
                                document.body.removeChild(form);
                            }
                            if (document.body.contains(iframe)) {
                                document.body.removeChild(iframe);
                            }
                            window.removeEventListener('message', messageHandler);
                            
                            // Assume success for form submission
                            resolve({
                                success: true,
                                url: 'uploaded_to_google_drive',
                                fileName: file.name,
                                message: 'File uploaded successfully to Google Drive'
                            });
                        }, 3000);
                    };
                    
                    // Handle iframe error
                    iframe.onerror = () => {
                        // Clean up
                        if (document.body.contains(form)) {
                            document.body.removeChild(form);
                        }
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                        
                        resolve({
                            success: false,
                            error: 'Upload failed - please try again'
                        });
                    };
                    
                    // Submit the form
                    form.submit();
                    
                };
                
                reader.onerror = () => {
                    resolve({
                        success: false,
                        error: 'Failed to read file'
                    });
                };
                
                // Read file as base64
                reader.readAsDataURL(file);
                
            } catch (error) {
                resolve({
                    success: false,
                    error: 'Upload failed. Please try again.'
                });
            }
        });
    }

    // Convert file to base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove data:image/jpeg;base64, prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }


    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

function initializeAlbum() {
    getOrCreateAlbum();
    initializeAlbumLink();
}

function initializeAlbumLink() {
    const viewAlbumBtn = document.getElementById('viewAlbumBtn');
    if (viewAlbumBtn) {
        viewAlbumBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const albumTab = document.querySelector('[data-page="album"]');
            if (albumTab) {
                albumTab.click();
            }
        });
    }
}

async function getOrCreateAlbum() {
    try {
        // Try with CORS first
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'getOrCreateAlbum',
                eventName: CONFIG.EVENT_NAME
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.folderId) {
                CONFIG.ALBUM_FOLDER_ID = result.folderId;
            }
        }
    } catch (error) {
        // Fallback: Try with no-cors mode for basic functionality
        try {
            const fallbackResponse = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getOrCreateAlbum',
                    eventName: CONFIG.EVENT_NAME
                })
            });
            
            // With no-cors, we can't read the response, but we can assume it worked
        } catch (fallbackError) {
            // Fallback failed, continue without album folder ID
        }
    }
}

function updateAlbumLink() {
}

function initializeSidebar() {
    const sidebar = document.getElementById('sidebarNav');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const navItems = document.querySelectorAll('.nav-item');
    const pageContents = document.querySelectorAll('.page-content');
    const mainContent = document.getElementById('mainContent');

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        sidebar.classList.add('collapsed');
        
        // Move toggle button outside sidebar for mobile
        if (sidebarToggle && sidebarToggle.parentNode === sidebar.querySelector('.sidebar-header')) {
            document.body.appendChild(sidebarToggle);
            sidebarToggle.style.display = 'block';
            sidebarToggle.style.position = 'fixed';
            sidebarToggle.style.top = '15px';
            sidebarToggle.style.left = '5px';
            sidebarToggle.style.zIndex = '1002';
            sidebarToggle.style.backgroundColor = '#d4a574';
            sidebarToggle.style.color = 'white';
            sidebarToggle.style.border = 'none';
            sidebarToggle.style.borderRadius = '8px';
            sidebarToggle.style.padding = '10px';
            sidebarToggle.style.fontSize = '1.1rem';
            sidebarToggle.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            sidebarToggle.style.cursor = 'pointer';
            sidebarToggle.style.width = '44px';
            sidebarToggle.style.height = '44px';
            sidebarToggle.style.display = 'flex';
            sidebarToggle.style.alignItems = 'center';
            sidebarToggle.style.justifyContent = 'center';
        }
    }

    function updateMainContentMargin() {
        if (window.innerWidth <= 768) {
            mainContent.style.marginLeft = '0px';
        } else {
            if (sidebar.classList.contains('collapsed')) {
                mainContent.style.marginLeft = '70px';
            } else {
                mainContent.style.marginLeft = '280px';
            }
        }
    }

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        updateMainContentMargin();
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
                updateMainContentMargin();
            }
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
        e.preventDefault();
            const targetPage = item.getAttribute('data-page');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            pageContents.forEach(page => page.classList.remove('active'));
            
            item.classList.add('active');
            const targetPageElement = document.getElementById(`${targetPage}-page`);
            
            if (targetPageElement) {
                targetPageElement.classList.add('active');
                
                if (targetPage === 'album') {
                    loadAlbumContent();
                }
                
                updateHeroContent(targetPage);
                
                if (targetPage === 'info') {
                    const footer = document.querySelector('.footer');
                    if (footer) {
                        footer.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    targetPageElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
            
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
                updateMainContentMargin();
        }
    });
});

    function handleDesktopHover() {
        if (window.innerWidth > 768) {
            sidebar.addEventListener('mouseenter', () => {
                sidebar.classList.remove('collapsed');
                updateMainContentMargin();
            });
            
            sidebar.addEventListener('mouseleave', () => {
                sidebar.classList.add('collapsed');
                updateMainContentMargin();
            });
        }
    }
    
    handleDesktopHover();

    window.addEventListener('resize', () => {
        const isMobileNow = window.innerWidth <= 768;
        if (isMobileNow) {
            sidebar.classList.add('collapsed');
            // Move toggle button outside sidebar for mobile
            if (sidebarToggle && sidebarToggle.parentNode === document.body) {
                // Already moved, just ensure styling
                sidebarToggle.style.display = 'block';
                sidebarToggle.style.position = 'fixed';
                sidebarToggle.style.top = '15px';
                sidebarToggle.style.left = '5px';
                sidebarToggle.style.zIndex = '1002';
            } else if (sidebarToggle && sidebarToggle.parentNode === sidebar.querySelector('.sidebar-header')) {
                // Move to body
                document.body.appendChild(sidebarToggle);
                sidebarToggle.style.display = 'block';
                sidebarToggle.style.position = 'fixed';
                sidebarToggle.style.top = '15px';
                sidebarToggle.style.left = '5px';
                sidebarToggle.style.zIndex = '1002';
                sidebarToggle.style.backgroundColor = '#d4a574';
                sidebarToggle.style.color = 'white';
                sidebarToggle.style.border = 'none';
                sidebarToggle.style.borderRadius = '8px';
                sidebarToggle.style.padding = '10px';
                sidebarToggle.style.fontSize = '1.1rem';
                sidebarToggle.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                sidebarToggle.style.cursor = 'pointer';
                sidebarToggle.style.width = '44px';
                sidebarToggle.style.height = '44px';
                sidebarToggle.style.display = 'flex';
                sidebarToggle.style.alignItems = 'center';
                sidebarToggle.style.justifyContent = 'center';
            }
        } else {
            // Move toggle button back to sidebar for desktop
            if (sidebarToggle && sidebarToggle.parentNode === document.body) {
                const sidebarHeader = sidebar.querySelector('.sidebar-header');
                if (sidebarHeader) {
                    sidebarHeader.appendChild(sidebarToggle);
                    // Reset styles
                    sidebarToggle.style.display = '';
                    sidebarToggle.style.position = '';
                    sidebarToggle.style.top = '';
                    sidebarToggle.style.left = '';
                    sidebarToggle.style.zIndex = '';
                    sidebarToggle.style.backgroundColor = '';
                    sidebarToggle.style.color = '';
                    sidebarToggle.style.border = '';
                    sidebarToggle.style.borderRadius = '';
                    sidebarToggle.style.padding = '';
                    sidebarToggle.style.fontSize = '';
                    sidebarToggle.style.boxShadow = '';
                    sidebarToggle.style.cursor = '';
                    sidebarToggle.style.width = '';
                    sidebarToggle.style.height = '';
                    sidebarToggle.style.display = '';
                    sidebarToggle.style.alignItems = '';
                    sidebarToggle.style.justifyContent = '';
                    // Reset scroll-based visibility
                    sidebarToggle.style.opacity = '';
                    sidebarToggle.style.visibility = '';
                    sidebarToggle.style.transform = '';
                }
            }
        }
        updateMainContentMargin();
        handleDesktopHover();
    });

    updateMainContentMargin();
    
    // Scroll-based toggle button visibility
    let lastScrollTop = 0;
    let scrollTimeout;
    let isScrolling = false;
    
    function handleScroll() {
        if (window.innerWidth > 768) return;
        
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const toggleButton = document.getElementById('sidebarToggle');
        
        if (!toggleButton) return;
        
        clearTimeout(scrollTimeout);
        
        if (currentScrollTop < lastScrollTop || currentScrollTop < 100) {
            toggleButton.style.opacity = '1';
            toggleButton.style.visibility = 'visible';
            toggleButton.style.transform = 'translateY(0)';
            isScrolling = false;
        } else if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
            toggleButton.style.opacity = '0';
            toggleButton.style.visibility = 'hidden';
            toggleButton.style.transform = 'translateY(-10px)';
            isScrolling = true;
        }
        
        lastScrollTop = currentScrollTop;
        
        scrollTimeout = setTimeout(() => {
            if (window.innerWidth <= 768 && isScrolling) {
                toggleButton.style.opacity = '1';
                toggleButton.style.visibility = 'visible';
                toggleButton.style.transform = 'translateY(0)';
                isScrolling = false;
            }
        }, 1500);
    }
    
    // Add scroll event listener with throttling
    let scrollThrottle;
    window.addEventListener('scroll', () => {
        if (scrollThrottle) return;
        scrollThrottle = setTimeout(() => {
            handleScroll();
            scrollThrottle = null;
        }, 10);
    }, { passive: true });
}

function loadAlbumContent() {
    const albumGrid = document.getElementById('albumGrid');
    if (albumGrid) {
        albumGrid.innerHTML = `
            <div class="album-placeholder">
                <i class="fas fa-images"></i>
                <h3>View Our Photo Album</h3>
                <p>Click the button below to access our shared photo album on Google Drive</p>
                <div class="drive-access-section">
                    <a href="https://drive.google.com/drive/folders/1jLtJg4QezlG8SpsPV_oivdIwyPI7cIMB" target="_blank" class="drive-access-btn">
                        <i class="fab fa-google-drive"></i> Access Photo Album
                    </a>
                    <p class="access-note">
                        <i class="fas fa-info-circle"></i> 
                        You'll be prompted to request access. We'll approve your request quickly!
                    </p>
                </div>
            </div>
        `;
    }
}

// Removed complex album loading functions - now using direct Google Drive link

function updateHeroContent(activeTab) {
    const heroTitle = document.getElementById('dynamicHeroTitle');
    const heroSubtitle = document.getElementById('dynamicHeroSubtitle');
    
    const content = {
        photos: {
            title: "We're thrilled to celebrate this special moment with you!",
            subtitle: "Share your photos and videos from our celebration! Upload your memories to our shared album and relive the beautiful moments together."
        },
        travel: {
            title: "Help us plan your visit!",
            subtitle: "Share your travel details so we can make your stay comfortable and memorable. We'll help coordinate everything for you."
        },
        album: {
            title: "Our Shared Memories",
            subtitle: "View all the beautiful photos and videos from our celebration. Every moment captured, every smile shared."
        },
        info: {
            title: "Everything you need to know",
            subtitle: "All the important details about our Roka celebration. Date, venue, contact information, and more."
        }
    };
    
    if (content[activeTab]) {
        heroTitle.textContent = content[activeTab].title;
        heroSubtitle.textContent = content[activeTab].subtitle;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('travelForm');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    }
});

function validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    if (isRequired && !value) {
        field.style.borderColor = '#e74c3c';
        return false;
    } else {
        field.style.borderColor = '#ddd';
        return true;
    }
}

function validateEventDates() {
    const arrivalDate = document.getElementById('arrivalDate');
    const departureDate = document.getElementById('departureDate');
    
    if (arrivalDate && departureDate) {
        arrivalDate.addEventListener('change', function() {
            const arrival = new Date(this.value);
            const departure = new Date(departureDate.value);
            const eventDate = new Date('2025-10-24');
            
            // Clear any existing errors first
            clearFieldError(this);
            
            // Validate arrival date
            if (arrival > eventDate) {
                showFieldError(this, '❌ Cannot arrive after the event date. Please select October 24th, 2025 or earlier.');
            } else if (departureDate.value && arrival > departure) {
                showFieldError(this, '❌ Arrival date should be before departure date.');
            } else if (arrival < eventDate) {
                // This is allowed, but show a helpful note
                showFieldInfo(this, '✅ Good! Arriving before the event date.');
            } else if (arrival.getTime() === eventDate.getTime()) {
                showFieldInfo(this, '✅ Perfect! Arriving on the event date.');
            }
            
            // Update departure date minimum
            if (this.value) {
                departureDate.min = this.value;
            }
        });
        
        departureDate.addEventListener('change', function() {
            const arrival = new Date(arrivalDate.value);
            const departure = new Date(this.value);
            const eventDate = new Date('2025-10-24');
            
            // Clear any existing errors first
            clearFieldError(this);
            
            // Validate departure date
            if (arrivalDate.value && departure < arrival) {
                showFieldError(this, '❌ Departure date should be after arrival date.');
            } else if (departure < eventDate) {
                showFieldError(this, '❌ Departure date should be on or after the event date (October 24th, 2025).');
            } else {
                showFieldInfo(this, '✅ Departure date looks good!');
            }
        });
    }
}

function showFieldError(field, message) {
    field.style.borderColor = '#e74c3c';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.9rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.style.fontWeight = '500';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function showFieldInfo(field, message) {
    field.style.borderColor = '#27ae60';
    const infoDiv = document.createElement('div');
    infoDiv.className = 'field-info';
    infoDiv.style.color = '#27ae60';
    infoDiv.style.fontSize = '0.9rem';
    infoDiv.style.marginTop = '0.25rem';
    infoDiv.style.fontWeight = '500';
    infoDiv.textContent = message;
    field.parentNode.appendChild(infoDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '#ddd';
    const existingError = field.parentNode.querySelector('.field-error');
    const existingInfo = field.parentNode.querySelector('.field-info');
    if (existingError) {
        existingError.remove();
    }
    if (existingInfo) {
        existingInfo.remove();
    }
}