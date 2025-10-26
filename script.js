const CONFIG = {
    GOOGLE_SHEET_ID: '1V7esjrwW6kZ7oQyuyrtL9xGlDWIkEoeUvWBXlJbdkvQ',
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby08YZbJHnIBV6pwsDe9fFHA93oeymZy1efuHo-Y7ey2biYTeBnI3ceK2MDXydkMWxgNg/exec',
    ADMIN_EMAIL: 'kapoorsharan98@gmail.com',
    ADMIN_PHONE: '+919587566699',
    EVENT_NAME: 'Angel & Sharan\'s Roka Celebration',
    EVENT_DATE: '24th October 2025',
    EVENT_VENUE: 'Kapoor Vilas, Udaipur',
    ALBUM_FOLDER_ID: '',
    MAX_FILE_SIZE: 100 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime']
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
    document.getElementById('arrivalDate').min = today;
    document.getElementById('departureDate').min = today;
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
                    action: 'submitTravelDetails',
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
            if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
                errors.push(`${file.name}: Unsupported file type`);
                return;
            }

            if (file.size > CONFIG.MAX_FILE_SIZE) {
                errors.push(`${file.name}: File too large (max 100MB)`);
                return;
            }

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
        uploadedFiles.style.display = 'block';
        
        let completed = 0;
        const total = files.length;

        for (const file of files) {
            try {
                progressText.textContent = `Uploading ${file.name}...`;
                progressFill.style.width = `${(completed / total) * 100}%`;

                const result = await uploadFile(file);
                
                if (result.success) {
                    addFileToGrid(file, result.url);
    } else {
                    showError(`Failed to upload ${file.name}: ${result.error}`);
                }
            } catch (error) {
                showError(`Upload error for ${file.name}: ${error.message}`);
            }
            
            completed++;
        }

        progressFill.style.width = '100%';
        progressText.textContent = 'Upload complete!';
        
        setTimeout(() => {
            uploadProgress.style.display = 'none';
        }, 2000);
    }

    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'uploadFile');

        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    function addFileToGrid(file, url) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const isVideo = file.type.startsWith('video/');
        const thumbnail = isVideo ? 
            `<video src="${url}" controls></video>` : 
            `<img src="${url}" alt="${file.name}">`;
        
        fileItem.innerHTML = `
            <div class="file-thumbnail">
                ${thumbnail}
            </div>
            <div class="file-info">
                <h4>${file.name}</h4>
                <p>${formatFileSize(file.size)}</p>
            </div>
        `;
        
        filesGrid.appendChild(fileItem);
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
        console.error('Failed to get album:', error);
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
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
        }
        updateMainContentMargin();
        handleDesktopHover();
    });

    // Initialize margin on page load
    updateMainContentMargin();
}

function loadAlbumContent() {
    const albumGrid = document.getElementById('albumGrid');
    if (albumGrid) {
        albumGrid.innerHTML = `
            <div class="album-placeholder">
                <i class="fas fa-images"></i>
                <h3>Loading our beautiful memories...</h3>
                <p>Photos and videos will appear here once uploaded</p>
            </div>
        `;
    }
}

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