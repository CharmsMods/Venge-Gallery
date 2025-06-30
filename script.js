document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.querySelector('.gallery-container');
    const tabButtons = document.querySelectorAll('.tab-button');
    const fullscreenModal = document.getElementById('fullscreen-modal');
    const modalContent = document.querySelector('.modal-content');
    const closeButton = document.querySelector('.close-button');
    const backToTopBtn = document.getElementById("backToTopBtn"); // Get the back to top button

    let mediaManifest = {}; // Will store the fetched manifest
    let currentMediaList = []; // Array of { category, fileName } objects currently displayed on the page
    let currentFullscreenIndex = -1; // Index of the currently viewed item in currentMediaList

    // Function to shuffle an array (Fisher-Yates algorithm)
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    };

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

        let filesToProcess = []; // Temporary array to build the list before assigning to currentMediaList
        // Define the categories to iterate for 'all' and 'videos' tabs
        const allRelevantCategories = ['wins', 'losses', 'general'];

        if (category === 'all') {
            // If 'all' tab is selected, collect all files from relevant categories
            for (const cat of allRelevantCategories) {
                if (mediaManifest[cat]) {
                    mediaManifest[cat].forEach(file => {
                        filesToProcess.push({ category: cat, fileName: file });
                    });
                }
            }
            // Shuffle the collected files for the "All" tab
            filesToProcess = shuffleArray(filesToProcess);
        } else if (category === 'videos') {
            // If 'videos' tab is selected, collect ONLY video files from all relevant categories
            for (const cat of allRelevantCategories) {
                if (mediaManifest[cat]) {
                    mediaManifest[cat].forEach(file => {
                        const fileExtension = file.split('.').pop().toLowerCase();
                        if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                            filesToProcess.push({ category: cat, fileName: file });
                        }
                    });
                }
            }
            // Videos tab will not be shuffled by default, order will be based on manifest and category iteration
        }
         else {
            // For specific categories (wins, losses, general)
            if (mediaManifest[category]) {
                mediaManifest[category].forEach(file => {
                    filesToProcess.push({ category: category, fileName: file });
                });
            }
        }

        // Assign the final processed list to currentMediaList for fullscreen navigation
        currentMediaList = filesToProcess;

        if (currentMediaList.length === 0) {
            galleryContainer.innerHTML = `<p style="font-size: 1.5em; text-align: center; margin-top: 50px;">No content yet for ${category === 'all' ? 'any category' : category}.</p>`;
            return;
        }

        currentMediaList.forEach(mediaItem => {
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

                // --- AUTOPLAY ON HOVER REMOVED HERE ---
                // item.addEventListener('mouseenter', () => video.play());
                // item.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });

                item.appendChild(video);

                // Add video icon
                const videoIcon = document.createElement('div');
                videoIcon.classList.add('video-icon');
                videoIcon.innerHTML = '<i class="fas fa-play"></i>'; // Font Awesome play icon
                item.appendChild(videoIcon);

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

        // Find the index of the opened item in the currentMediaList
        currentFullscreenIndex = currentMediaList.findIndex(item => `./media/${item.category}/${item.fileName}` === src);

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
            video.muted = false; // Unmute for fullscreen playback
            modalContent.appendChild(video);
        }

        fullscreenModal.classList.add('active'); // Show modal
        document.body.style.overflow = 'hidden'; // Prevent scrolling background
    };

    // Function to close fullscreen modal
    const closeFullscreen = () => {
        fullscreenModal.classList.remove('active'); // Hide modal
        // Stop video playback when closing modal
        const currentMedia = modalContent.querySelector('img, video');
        if (currentMedia && currentMedia.tagName === 'VIDEO') {
            currentMedia.pause();
            currentMedia.currentTime = 0;
        }
        modalContent.innerHTML = ''; // Clear content
        document.body.style.overflow = ''; // Restore scrolling
        currentFullscreenIndex = -1; // Reset index when modal is closed
    };

    // Function to navigate between fullscreen items
    const navigateFullscreen = (direction) => {
        if (currentMediaList.length === 0) return;

        let nextIndex = currentFullscreenIndex + direction;

        // Loop around if at beginning/end
        if (nextIndex < 0) {
            nextIndex = currentMediaList.length - 1;
        } else if (nextIndex >= currentMediaList.length) {
            nextIndex = 0;
        }

        const nextMediaItem = currentMediaList[nextIndex];
        const nextSrc = `./media/${nextMediaItem.category}/${nextMediaItem.fileName}`;
        const fileExtension = nextMediaItem.fileName.split('.').pop().toLowerCase();
        const nextType = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension) ? 'image' :
                         (['mp4', 'webm', 'ogg'].includes(fileExtension) ? 'video' : 'unknown');

        currentFullscreenIndex = nextIndex; // Update current index
        openFullscreen(nextSrc, nextType); // Open the next item
    };


    // Event listeners for close button and modal background click
    closeButton.addEventListener('click', closeFullscreen);
    fullscreenModal.addEventListener('click', (event) => {
        // Close if click directly on the modal background, not on the content
        if (event.target === fullscreenModal) {
            closeFullscreen();
        }
    });

    // Event listener for keyboard 'Escape' key to close modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && fullscreenModal.classList.contains('active')) {
            closeFullscreen();
        } else if (fullscreenModal.classList.contains('active') && currentFullscreenIndex !== -1) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault(); // Prevent page scrolling
                navigateFullscreen(-1); // Go to previous
            } else if (event.key === 'ArrowRight') {
                event.preventDefault(); // Prevent page scrolling
                navigateFullscreen(1); // Go to next
            }
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

    // --- Back to Top Button Logic ---
    // When the user scrolls down 20px from the top of the document, show the button
    window.onscroll = function() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };

    // When the user clicks on the button, scroll to the top of the document
    backToTopBtn.addEventListener("click", () => {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    });


    // Initial fetch of the manifest when the page loads
    fetchManifest();
});