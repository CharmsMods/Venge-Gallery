document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.querySelector('.gallery-container');
    const tabButtons = document.querySelectorAll('.tab-button');
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
            // After loading, load the default category ('wins')
            loadMedia('wins');
        } catch (error) {
            console.error('Could not fetch media_manifest.json:', error);
            galleryContainer.innerHTML = `<p style="font-size: 1.5em; text-align: center; margin-top: 50px; color: red;">Error loading gallery data. Please ensure 'media_manifest.json' exists and is accessible.</p>`;
        }
    };

    // Function to load media for a given category
    const loadMedia = (category) => {
        galleryContainer.innerHTML = ''; // Clear current gallery

        const filesToLoad = mediaManifest[category];

        if (!filesToLoad || filesToLoad.length === 0) {
            galleryContainer.innerHTML = `<p style="font-size: 1.5em; text-align: center; margin-top: 50px;">No content yet for ${category}.</p>`;
            return;
        }

        filesToLoad.forEach(fileName => {
            const item = document.createElement('div');
            item.classList.add('gallery-item');

            const filePath = `./media/${category}/${fileName}`;
            const fileExtension = fileName.split('.').pop().toLowerCase();

            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension)) {
                const img = document.createElement('img');
                img.src = filePath;
                img.alt = `${category} image`;
                item.appendChild(img);
            } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                const video = document.createElement('video');
                video.src = filePath;
                video.controls = true;
                video.loop = true; // Optional: videos loop
                video.muted = true; // Optional: muted by default
                item.appendChild(video);
            } else {
                // Handle unsupported file types or add a placeholder
                console.warn(`Unsupported file type for ${fileName}`);
                const placeholder = document.createElement('p');
                placeholder.textContent = `Unsupported file: ${fileName}`;
                item.appendChild(placeholder);
            }

            const caption = document.createElement('p');
            // Remove extension and replace underscores/hyphens for a cleaner caption
            let cleanFileName = fileName.split('.')[0].replace(/[_ -]/g, ' ');
            // If the name is just a number, you might want a more descriptive default, or ensure your python script adds metadata
            if (cleanFileName.match(/^\d+$/)) {
                caption.textContent = `${category} - Item ${cleanFileName}`;
            } else {
                caption.textContent = cleanFileName;
            }
            item.appendChild(caption);

            galleryContainer.appendChild(item);
        });
    };

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