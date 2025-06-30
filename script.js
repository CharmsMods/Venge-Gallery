document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.querySelector('.gallery-container');
    const tabButtons = document.querySelectorAll('.tab-button');
    const fullscreenModal = document.getElementById('fullscreen-modal');
    const modalContent = document.querySelector('.modal-content');
    const closeButton = document.querySelector('.close-button');

    let mediaManifest = {}; // Will store the fetched manifest

    // Function to fetch the media manifest
    const fetchManifest = async () => {
        try {
            const response = await fetch('media_manifest.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            mediaManifest = await response.json();
            console.log('Media manifest loaded:', mediaManifest);
            // After loading, load the default category ('all')
            loadMedia('all');
        } catch (error) {
            console.error('Could not fetch media_manifest.json:', error);
            galleryContainer.innerHTML = `<p style="font-size: 1.5em; text-align: center; margin-top: 50px; color: red;">Error loading gallery data. Please ensure 'media_manifest.json' exists and is accessible.</p>`;
        }
    };

    // Function to load media for a given category
    const loadMedia = (category) => {
        galleryContainer.innerHTML = ''; // Clear current gallery

        let filesToLoad = [];

        if (category === 'all') {
            // If 'all' tab is selected, collect files from all categories
            for (const cat of Object.keys(mediaManifest)) {
                if (mediaManifest[cat]) {
                    // Add category path to each file for full path construction
                    mediaManifest[cat].forEach(file => {
                        filesToLoad.push({ category: cat, fileName: file });
                    });
                }
            }
        } else {
            // For specific categories, get files directly from the manifest
            if (mediaManifest[category]) {
                mediaManifest[category].forEach(file => {
                    filesToLoad.push({ category: category, fileName: file });
                });
            }
        }

        if (filesToLoad.length === 0) {
            galleryContainer.innerHTML = `<p style="font-size: 1.5em; text-align: center; margin-top: 50px;">No content yet for ${category === 'all' ? 'any category' : category}.</p>`;
            return;
        }

        filesToLoad.forEach(mediaItem => {
            const item = document.createElement('div');
            item.classList.add('gallery-item');
            // Store full path and type on the item for fullscreen view
            item.dataset.fullPath = `./media/${mediaItem.category}/${mediaItem.fileName}`;
            const fileExtension = mediaItem.fileName.split('.').pop().toLowerCase();
            item.dataset.mediaType = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension) ? 'image' :
                                      (['mp4', 'webm', 'ogg'].includes(fileExtension) ? 'video' : 'unknown');


            if (item.dataset.mediaType === 'image') {
                const img = document.createElement('img');
                img.src = item.dataset.fullPath;
                img.alt = `${mediaItem.category} image`;
                item.appendChild(img);
            } else if (item.dataset.mediaType === 'video') {
                const video = document.createElement('video');
                video.src = item.dataset.fullPath;
                video.muted = true; // Muted by default for preview
                video.loop = true; // Loop for preview
                // Play on hover
                item.addEventListener('mouseenter', () => video.play());
                item.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
                item.appendChild(video);
            } else {
                console.warn(`Unsupported file type for ${mediaItem.fileName}`);
                const placeholder = document.createElement('div');
                placeholder.textContent = `Unsupported: ${mediaItem.fileName}`;
                placeholder.style.textAlign = 'center';
                placeholder.style.fontSize = '1.2em';
                item.appendChild(placeholder);
            }

            // Add click listener for fullscreen
            item.addEventListener('click', () => openFullscreen(item.dataset.fullPath, item.dataset.mediaType));

            galleryContainer.appendChild(item);
        });
    };

    // Function to open fullscreen modal
    const openFullscreen = (src, type) => {
        modalContent.innerHTML = ''; // Clear previous content

        if (type === 'image') {
            const img = document.createElement('img');
            img.src = src;
            modalContent.appendChild(img);
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = src;
            video.controls = true; // Enable controls for fullscreen
            video.autoplay = true; // Autoplay when fullscreen
            video.loop = true; // Loop in fullscreen
            modalContent.appendChild(video);
        }

        fullscreenModal.classList.add('active'); // Show modal
        document.body.style.overflow = 'hidden'; // Prevent scrolling background
    };

    // Function to close fullscreen modal
    const closeFullscreen = () => {
        fullscreenModal.classList.remove('active'); // Hide modal
        modalContent.innerHTML = ''; // Clear content
        document.body.style.overflow = ''; // Restore scrolling
    };

    // Event listeners for close button and modal background click
    closeButton.addEventListener('click', closeFullscreen);
    fullscreenModal.addEventListener('click', (event) => {
        // Close if click directly on the modal background, not on the content
        if (event.target === fullscreenModal) {
            closeFullscreen();
        }
    });

    // Event listeners for tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            loadMedia(category);
        });
    });

    // Initial fetch of the manifest when the page loads
    fetchManifest();
});