import os
import json
import shutil # Added for robust file operations if simple rename fails

# Define the base directory for your media
MEDIA_BASE_DIR = 'media'

# Define the categories and their respective subdirectories
CATEGORIES = {
    'wins': 'wins',
    'losses': 'losses',
    'funny': 'funny',
    'toxic': 'toxic',
    'hackers': 'hackers',
    'glitch_abuser': 'glitch_abuser',
    'history': 'history'
}

def update_gallery_manifest():
    manifest = {}
    print("Starting gallery update...")

    for category_name, folder_name in CATEGORIES.items():
        category_path = os.path.join(MEDIA_BASE_DIR, folder_name)

        if not os.path.exists(category_path):
            os.makedirs(category_path)
            print(f"Created directory: {category_path}")
            manifest[category_name] = []
            continue

        print(f"\nProcessing category: {category_name} ({category_path})")

        # Get all files, sort them to ensure consistent numbering
        # and filter out hidden files/directories
        files = [f for f in os.listdir(category_path) if os.path.isfile(os.path.join(category_path, f)) and not f.startswith('.')]
        files.sort() # Sort to maintain a consistent order for renaming

        new_file_list = []
        for i, filename in enumerate(files):
            # Get original extension
            name, ext = os.path.splitext(filename)
            new_name = f"{i + 1}{ext.lower()}" # Start numbering from 1, convert ext to lowercase
            old_path = os.path.join(category_path, filename)
            new_path = os.path.join(category_path, new_name)

            if old_path == new_path:
                print(f"  File already correctly named: {new_name}")
            else:
                try:
                    os.rename(old_path, new_path)
                    print(f"  Renamed: {filename} -> {new_name}")
                except OSError as e:
                    print(f"  ERROR: Could not rename '{filename}' to '{new_name}'. Reason: {e}")
                    print(f"  Please ensure the file is not open or in use by any other program.")
                    # If rename fails, we still want to include it in the manifest with its original name
                    # or current state, to avoid losing track of it.
                    new_file_list.append(filename) # Use original name if rename failed
                    continue # Skip to next file
                except Exception as e:
                    print(f"  An unexpected error occurred while renaming '{filename}': {e}")
                    new_file_list.append(filename)
                    continue

            # Only append to new_file_list if renaming was successful or it was already correct
            new_file_list.append(new_name)

        manifest[category_name] = new_file_list

    # Write the manifest to a JSON file
    manifest_path = 'media_manifest.json'
    try:
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=4) # Use indent for readability
        print(f"\nGallery manifest updated successfully! Saved to {manifest_path}")
    except IOError as e:
        print(f"\nERROR: Could not write media_manifest.json. Reason: {e}")
        print(f"Please check file permissions or if the file is in use.")


if __name__ == "__main__":
    update_gallery_manifest()