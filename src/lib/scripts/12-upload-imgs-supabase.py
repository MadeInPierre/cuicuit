import os
import json
import unicodedata  # Added for slug normalization
from supabase import create_client, Client
from dotenv import load_dotenv
from rich import print

# Load environment variables from .env file
load_dotenv()

# --- Supabase Configuration ---
SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL and Key must be set in the .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Storage Bucket Name ---
STORAGE_BUCKET_NAME = "ingredients"  # IMPORTANT: Make sure this bucket exists in your Supabase project!

# --- Path to your images folder ---
IMAGES_FOLDER = "data/ingredients/marmiton"


def normalize_slug(text: str) -> str:
    """
    Normalizes a string to be used as a slug, removing accents and non-alphanumeric chars.
    Matches the typical slug generation (a-z0-9-).
    """
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = text.lower()
    text = "-".join(text.split())  # Replace spaces with hyphens
    text = "".join(char for char in text if char.isalnum() or char == "-")  # Keep only alphanumeric and hyphens
    text = text.strip("-")  # Remove leading/trailing hyphens
    return text


def fetch_ingredient_slug_to_uuid_map():
    """
    Fetches all ingredient slugs and their UUIDs from the 'ingredients' table.
    Returns a dictionary mapping slug to UUID.
    """
    print("Fetching ingredient slugs and UUIDs from Supabase...")
    slug_to_uuid_map = {}
    try:
        all_data = []
        page_size = 1000
        current_offset = 0

        while True:
            response = (
                supabase.table("ingredients")
                .select("id, slug")
                .range(current_offset, current_offset + page_size - 1)
                .execute()
            )

            if not response.data:
                break

            all_data.extend(response.data)

            if len(response.data) < page_size:
                break

            current_offset += page_size

        response.data = all_data
        if response.data:
            for row in response.data:
                slug_to_uuid_map[row["slug"]] = row["id"]
            print(f"Fetched {len(slug_to_uuid_map)} ingredient slug-UUID mappings.")
        else:
            print(
                "No ingredients found in the 'ingredients' table. Please ensure your 'ingredients' table is populated."
            )
        return slug_to_uuid_map
    except Exception as e:
        print(f"Error fetching ingredient data: {e}")
        return {}


def upload_images_to_storage():
    """
    Uploads images from the local 'images' folder to Supabase Storage,
    renaming them to their corresponding ingredient UUIDs.
    """
    if not os.path.exists(IMAGES_FOLDER):
        print(f"Error: The folder '{IMAGES_FOLDER}' does not exist.")
        print("Please ensure your ingredient image files are located in this folder.")
        return

    slug_to_uuid = fetch_ingredient_slug_to_uuid_map()
    if not slug_to_uuid:
        print("Cannot proceed with image upload: No ingredient UUIDs found.")
        return


    # Filter for common image extensions
    image_files = [
        f for f in os.listdir(IMAGES_FOLDER) if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp"))
    ]
    if not image_files:
        print(f"No image files found in '{IMAGES_FOLDER}'. Supported formats: .png, .jpg, .jpeg, .gif, .webp.")
        return

    print(f"\n--- Starting image upload to Supabase Storage bucket '{STORAGE_BUCKET_NAME}' ---")
    print(f"Found {len(image_files)} image files to process.")

    uploaded_count = 0
    skipped_count = 0
    error_count = 0

    for i, filename in enumerate(image_files):
        file_path = os.path.join(IMAGES_FOLDER, filename)

        # Extract slug from filename and normalize it
        slug_from_filename_raw = os.path.splitext(filename)[0]
        slug_from_filename_normalized = normalize_slug(slug_from_filename_raw)

        ingredient_uuid = slug_to_uuid.get(slug_from_filename_normalized)

        if not ingredient_uuid:
            print(
                f"Skipping '{filename}': No matching ingredient UUID found for normalized slug '{slug_from_filename_normalized}'."
            )
            skipped_count += 1
            continue

        # Determine the file extension to keep it consistent
        file_extension = os.path.splitext(filename)[1].lower()  # e.g., '.jpg'
        storage_path = f"images-marmiton/{ingredient_uuid}{file_extension}"

        try:
            with open(file_path, "rb") as f:
                print(f"Uploading '{filename}' (normalized: '{slug_from_filename_normalized}') to '{storage_path}'...")
                # Set content type based on file extension
                content_type = "image/jpeg" if file_extension in [".jpg", ".jpeg"] else f"image/{file_extension[1:]}"
                # Ensure content_type is always a string
                response = supabase.storage.from_(STORAGE_BUCKET_NAME).upload(
                    storage_path, f.read(), {"content-type": str(content_type)}
                )

                if response.path:
                    public_url = supabase.storage.from_(STORAGE_BUCKET_NAME).get_public_url(storage_path)
                    print(
                        f"[blue]Uploaded '{filename}' (normalized to '{slug_from_filename_normalized}') as '{storage_path}'. Public URL: {public_url}"
                    )
                    uploaded_count += 1
                else:
                    print(f"Failed to upload '{filename}' as '{storage_path}': {response.full_path}")
                    error_count += 1

        except FileNotFoundError:
            print(f"Error: File '{file_path}' not found. Skipping.")
            error_count += 1
        except Exception as e:
            print(
                f"An unexpected error occurred uploading '{filename}' (normalized: '{slug_from_filename_normalized}'): {e}"
            )
            error_count += 1

        if (i + 1) % 50 == 0:
            print(f"Processed {i + 1} of {len(image_files)} images.")
        
        # exit(0) 

    print("\n--- Image upload process completed ---")
    print(f"Total images processed: {len(image_files)}")
    print(f"Successfully uploaded: {uploaded_count}")
    print(f"Skipped (no matching ingredient): {skipped_count}")
    print(f"Errors during upload: {error_count}")


if __name__ == "__main__":
    upload_images_to_storage()
