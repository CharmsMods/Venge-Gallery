import os
import json
import shutil # For moving and removing directories

# Define the base directory for your media
MEDIA_BASE_DIR = 'media'

# Define the NEW primary categories and their corresponding folders
NEW_PRIMARY_CATEGORIES = {
    'wins': 'wins',
    'losses': 'losses',
    'general': 'general' # This will be the new consolidated folder
}

# Define the OLD categories whose contents will be merged into 'general'
OLD_CATEGORIES_TO_MERGE = ['funny', 'toxic', 'hackers', 'glitch_abuser', 'history']

def update_gallery_manifest():
    manifest = {}
    print("Starting gallery update...")

    # --- Step 1: Consolidate old categories into the 'general' folder ---
    general_category_path = os.path.join(MEDIA_BASE_DIR, NEW_PRIMARY_CATEGORIES['general'])
    if not os.path.exists(general_category_path):
        os.makedirs(general_category_path)
        print(f"Created new directory: {general_category_path}")

    print("\nConsolidating media into 'general' category...")
    for old_category_name in OLD_CATEGORIES_TO_MERGE:
        old_category_path = os.path.join(MEDIA_BASE_DIR, old_category_name)

        if os.path.exists(old_category_path) and os.path.isdir(old_category_path):
            print(f"  Processing old category: {old_category_name} ({old_category_path})")
            # Get all files from the old category, excluding hidden files
            files_to_move = [f for f in os.listdir(old_category_path) if os.path.isfile(os.path.join(old_category_path, f)) and not f.startswith('.')]

            for filename in files_to_move:
                old_file_path = os.path.join(old_category_path, filename)
                new_file_path = os.path.join(general_category_path, filename) # Keep original name for now, rename later

                # Handle potential conflicts if file with same name exists in 'general'
                # Append a unique ID or use shutil.move which can handle overwriting or errors
                if os.path.exists(new_file_path):
                    # Append a timestamp or counter to make it unique
                    name, ext = os.path.splitext(filename)
                    counter = 1
                    temp_new_file_path = new_file_path
                    while os.path.exists(temp_new_file_path):
                        temp_new_file_path = os.path.join(general_category_path, f"{name}_{counter}{ext}")
                        counter += 1
                    new_file_path = temp_new_file_path
                    print(f"    WARNING: '{filename}' already exists in 'general'. Moving as '{os.path.basename(new_file_path)}'.")

                try:
                    shutil.move(old_file_path, new_file_path)
                    print(f"    Moved '{filename}' to '{os.path.basename(new_file_path)}'.")
                except OSError as e:
                    print(f"    ERROR: Could not move '{filename}' from '{old_category_path}' to '{general_category_path}'. Reason: {e}")
                    print(f"    Please ensure the file is not open or in use.")
                except Exception as e:
                    print(f"    An unexpected error occurred while moving '{filename}': {e}")
            
            # Remove the old category folder if it's empty after moving
            if not os.listdir(old_category_path): # Check if directory is empty
                try:
                    os.rmdir(old_category_path)
                    print(f"  Removed empty old category folder: {old_category_path}")
                except OSError as e:
                    print(f"  ERROR: Could not remove empty folder '{old_category_path}'. Reason: {e}")
        else:
            print(f"  Old category folder '{old_category_name}' not found or is not a directory. Skipping.")

    # --- Step 2: Process new primary categories (including the now populated 'general') ---
    for category_name, folder_name in NEW_PRIMARY_CATEGORIES.items():
        category_path = os.path.join(MEDIA_BASE_DIR, folder_name)

        if not os.path.exists(category_path):
            # This should ideally not happen for general now, but good check
            os.makedirs(category_path)
            print(f"Created directory: {category_path}")

        print(f"\nProcessing new category: {category_name} ({category_path}) for sequential renaming...")

        # Get all files, sort them to ensure consistent numbering
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
                    # If rename fails, we still include its current name in manifest to prevent loss
                    new_file_list.append(filename)
                    continue
                except Exception as e:
                    print(f"  An unexpected error occurred while renaming '{filename}': {e}")
                    new_file_list.append(filename)
                    continue

            # Only append to new_file_list if renaming was successful or it was already correct
            new_file_list.append(new_name)

        manifest[category_name] = new_file_list

    # --- Step 3: Write the manifest to a JSON file ---
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