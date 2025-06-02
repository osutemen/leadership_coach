import asyncio
import yt_dlp
import whisper
import os
import tempfile
import json
import re
import glob
from dotenv import load_dotenv
from openai import OpenAI
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import shutil

# Load environment variables
load_dotenv()

router = APIRouter()


class YouTubeProcessRequest(BaseModel):
    playlist_url: str = (
        "https://www.youtube.com/playlist?list=PLCi3Q_-uGtdlCsFXHLDDHBSLyq4BkQ6gZ"
    )
    max_videos: Optional[int] = None
    max_chunk_size_tokens: int = 800
    chunk_overlap_tokens: int = 400
    output_folder: str = (
        "/Users/ozgunsutemen/Ozgun/leadership_coach/api/youtube_list_text"
    )


class YouTubeProcessResponse(BaseModel):
    success: bool
    message: str
    vector_store_id: Optional[str] = None
    processed_videos: int = 0
    transcription_files: list = []


def download_audio(url, index):
    """Downloads audio from YouTube video temporarily."""
    temp_dir = tempfile.mkdtemp()
    temp_audio_file = os.path.join(temp_dir, f"audio_{index}")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": temp_audio_file + ".%(ext)s",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
        "quiet": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Find the downloaded file
        final_audio_file = temp_audio_file + ".mp3"

        # Check if the file exists
        if os.path.exists(final_audio_file):
            return final_audio_file
        else:
            # If .mp3 file doesn't exist, check files in temp_dir
            for file in os.listdir(temp_dir):
                if file.startswith(f"audio_{index}"):
                    return os.path.join(temp_dir, file)
            return None

    except Exception as e:
        print(f"Audio download error (Video {index}): {e}")
        return None


def transcribe_audio(audio_path):
    """Converts audio file to text."""
    temp_dir = None
    try:
        if not os.path.exists(audio_path):
            print(f"Audio file not found: {audio_path}")
            return None

        temp_dir = os.path.dirname(audio_path)
        print(f"Audio file found: {audio_path}")

        model = whisper.load_model("small")
        result = model.transcribe(audio_path, language="tr")
        return result["text"]
    except Exception as e:
        print(f"Transcription error: {e}")
        return None
    finally:
        # Delete temporary file and folder
        try:
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)
                print(f"Audio file deleted: {audio_path}")
            if temp_dir and os.path.exists(temp_dir):
                # Check if there are other files in the folder
                if not os.listdir(temp_dir):
                    os.rmdir(temp_dir)
                    print(f"Temporary folder deleted: {temp_dir}")
        except Exception as cleanup_error:
            print(f"Cleanup error: {cleanup_error}")


def get_playlist_videos(playlist_url):
    """Gets video URLs from YouTube playlist."""
    ydl_opts = {
        "extract_flat": True,
        "quiet": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(playlist_url, download=False)
            return [(entry["url"], entry["title"]) for entry in info["entries"]]
    except Exception as e:
        print(f"Playlist extraction error: {e}")
        return []


def extract_speaker_name(video_title):
    """Extracts speaker name from video title."""
    title = video_title.strip()

    # Remove common program prefixes and date suffixes
    title = re.sub(r"^[^-]+-\s*", "", title)

    # Remove various date patterns at the end
    title = re.sub(r"\s*[|\-]\s*\d{1,2}[./\-]\d{1,2}[./\-]\d{4}.*$", "", title)
    title = re.sub(r"\s*[|\-]\s*\d{4}[./\-]\d{1,2}[./\-]\d{1,2}.*$", "", title)
    title = re.sub(r"\s*[|\-]\s*\d{4}.*$", "", title)

    # Remove month patterns
    title = re.sub(
        r"\s*[|\-]\s*\d{1,2}?\s*(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s*\d{4}.*$",
        "",
        title,
        flags=re.IGNORECASE,
    )
    title = re.sub(
        r"\s*[|\-]\s*\d{1,2}?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{4}.*$",
        "",
        title,
        flags=re.IGNORECASE,
    )

    # Remove other date patterns
    title = re.sub(r"\s*[|\-]\s*\d{1,2}[./]\d{1,2}.*$", "", title)
    title = re.sub(r"\s*\(\d{4}\).*$", "", title)
    title = re.sub(r"\s*\(\d{1,2}[./\-]\d{1,2}[./\-]\d{4}\).*$", "", title)
    title = re.sub(r"\s*\[\d{4}\].*$", "", title)
    title = re.sub(r"\s*\[\d{1,2}[./\-]\d{1,2}[./\-]\d{4}\].*$", "", title)

    # Remove episode numbers
    title = re.sub(
        r"\s*[|\-]\s*(Bölüm|Episode|Ep|#)\s*\d+.*$", "", title, flags=re.IGNORECASE
    )
    title = re.sub(r"\s*[|\-]\s*S\d+E\d+.*$", "", title, flags=re.IGNORECASE)
    title = re.sub(r"\s*[|\-]\s*Season\s*\d+.*$", "", title, flags=re.IGNORECASE)
    title = re.sub(r"\s*[|\-]\s*Sezon\s*\d+.*$", "", title, flags=re.IGNORECASE)

    # Clean up extra whitespace and punctuation
    title = re.sub(r"\s*[|\-]\s*$", "", title)
    title = title.strip()

    # Extract speaker name patterns
    patterns = [
        r"^([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+\s+[A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)",
        r"([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+\s+[A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)",
        r"^([^-|:]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, title)
        if match:
            name = match.group(1).strip()
            return name.replace(" ", "_")

    # If no pattern matches, take the first two words of cleaned title
    words = title.split()[:2]
    if len(words) >= 2:
        return "_".join(words).replace(" ", "_")
    elif len(words) == 1:
        return words[0]

    return "Unknown_Speaker"


def sanitize_filename(filename):
    """Makes filename safe for file system."""
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, "_")
    return filename


def playlist_to_text(playlist_url, output_folder="speakers", max_videos=None):
    """Converts YouTube playlist videos to text and creates separate Markdown files for each speaker."""
    # Ensure speakers folder exists
    os.makedirs(output_folder, exist_ok=True)

    videos = get_playlist_videos(playlist_url)
    if not videos:
        return []

    # Limit video count
    if max_videos is not None:
        videos = videos[:max_videos]
        print(f"First {len(videos)} videos will be processed.")

    transcriptions = []
    for index, (video_url, video_title) in enumerate(videos, 1):
        print(f"\nProcessing: {video_title} ({index}/{len(videos)})")

        # Extract speaker name
        speaker_name = extract_speaker_name(video_title)
        safe_speaker_name = sanitize_filename(speaker_name)

        print(f"Speaker: {speaker_name}")
        print("Downloading audio...")

        audio_path = download_audio(video_url, index)
        if not audio_path:
            transcription_text = "Audio could not be downloaded."
        else:
            print("Converting to text...")
            transcription_text = transcribe_audio(audio_path)
            if not transcription_text:
                transcription_text = "Text conversion failed."

        # Create separate file for each speaker
        output_file = os.path.join(output_folder, f"{safe_speaker_name}.md")

        # Prepare file content
        content = f"# {speaker_name.replace('_', ' ')}\n\n"
        content += f"{transcription_text}\n\n"

        # Write file (if same speaker has multiple videos, append content)
        mode = "a" if os.path.exists(output_file) else "w"
        with open(output_file, mode, encoding="utf-8") as f:
            if mode == "a":
                f.write("---\n\n")  # Separator for new content
            f.write(content)

        print(f"Transcription saved to '{output_file}'.")

        transcriptions.append(
            {
                "video_title": video_title,
                "video_url": video_url,
                "speaker_name": speaker_name,
                "transcription": transcription_text,
                "output_file": output_file,
            }
        )

    print(f"\nAll transcription files saved to '{output_folder}' folder.")
    return transcriptions


def create_vector_store_and_upload(
    speakers_dir="speakers", max_chunk_size_tokens=800, chunk_overlap_tokens=400
):
    """Creates a vector store and uploads all files from speakers directory."""
    print("\n=== Creating Vector Store and Uploading Files ===")

    # Initialize OpenAI client
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    except Exception as e:
        print(f"Error initializing OpenAI client: {e}")
        print("Make sure you have a valid OPENAI_API_KEY in your .env file")
        return None

    # Create vector store
    try:
        vector_store = client.vector_stores.create(
            name="Speaker",
            chunking_strategy={
                "type": "static",
                "static": {
                    "max_chunk_size_tokens": max_chunk_size_tokens,
                    "chunk_overlap_tokens": chunk_overlap_tokens,
                },
            },
        )
        print(f"Vector store created successfully!")
    except Exception as e:
        print(f"Error creating vector store: {e}")
        return None

    # Get all files in the speakers directory
    if not os.path.exists(speakers_dir):
        print(f"Speakers directory '{speakers_dir}' does not exist!")
        return None

    file_paths = glob.glob(os.path.join(speakers_dir, "*.md"))
    if not file_paths:
        print(f"No markdown files found in '{speakers_dir}' directory!")
        return None

    print(
        f"Found {len(file_paths)} files to upload: {[os.path.basename(f) for f in file_paths]}"
    )

    try:
        file_streams = [open(path, "rb") for path in file_paths]

        # Upload files to vector store
        print("Uploading files to vector store...")
        file_batch = client.vector_stores.file_batches.upload_and_poll(
            vector_store_id=vector_store.id, files=file_streams
        )

        # Close file streams
        for stream in file_streams:
            stream.close()

        # Print the status and the file counts of the batch
        print(f"Upload Status: {file_batch.status}")
        print(f"File Counts: {file_batch.file_counts}")
        print(f"Vector Store ID: {vector_store.id}")

        return vector_store.id

    except Exception as e:
        print(f"Error uploading files to vector store: {e}")
        return None


async def process_youtube_playlist(request: YouTubeProcessRequest):
    """Main processing function that runs the complete pipeline."""
    try:
        print("=== YouTube to RAG Pipeline ===\n")
        print(f"Playlist URL: {request.playlist_url}")
        print(
            f"Max videos to process: {request.max_videos if request.max_videos else 'All'}"
        )
        print(f"Output folder: {request.output_folder}")
        print(f"Chunk size: {request.max_chunk_size_tokens}")
        print(f"Chunk overlap: {request.chunk_overlap_tokens}")

        # Step 1: Process YouTube playlist and create transcriptions
        print("\n=== Step 1: Processing YouTube Playlist ===")
        transcriptions = playlist_to_text(
            request.playlist_url, request.output_folder, max_videos=request.max_videos
        )

        if not transcriptions:
            return YouTubeProcessResponse(
                success=False,
                message="No transcriptions were created",
                processed_videos=0,
            )

        # Step 2: Create vector store and upload files
        print("\n=== Step 2: Creating Vector Store ===")
        vector_store_id = create_vector_store_and_upload(
            request.output_folder,
            request.max_chunk_size_tokens,
            request.chunk_overlap_tokens,
        )

        if vector_store_id:
            # Get list of created files
            transcription_files = [entry["output_file"] for entry in transcriptions]

            return YouTubeProcessResponse(
                success=True,
                message="Pipeline completed successfully!",
                vector_store_id=vector_store_id,
                processed_videos=len(transcriptions),
                transcription_files=transcription_files,
            )
        else:
            return YouTubeProcessResponse(
                success=False,
                message="Pipeline partially completed - transcriptions created but vector store upload failed",
                processed_videos=len(transcriptions),
                transcription_files=[entry["output_file"] for entry in transcriptions],
            )

    except Exception as e:
        print(f"Error in processing pipeline: {e}")
        return YouTubeProcessResponse(
            success=False, message=f"Error occurred: {str(e)}", processed_videos=0
        )


@router.post("/process", response_model=YouTubeProcessResponse)
async def process_youtube_playlist_endpoint(request: YouTubeProcessRequest):
    """
    Process YouTube playlist and create vector store.

    This endpoint downloads audio from YouTube videos, transcribes them,
    and creates a vector store for RAG applications.
    """
    try:
        result = await process_youtube_playlist(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing playlist: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for YouTube processor."""
    return {"status": "healthy", "service": "youtube_processor"}
