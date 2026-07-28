import asyncio
import edge_tts

async def main():
    text = "Nobody actually knows why we get goosebumps from music."
    voice = "en-US-AndrewNeural"
    
    communicate = edge_tts.Communicate(text, voice)
    
    chunk_count = 0
    async for chunk in communicate.stream():
        chunk_count += 1
        print(f"Chunk {chunk_count}: type={chunk['type']}, keys={list(chunk.keys())}")
        if chunk['type'] != 'audio':
            print(f"  Full data: {chunk}")

asyncio.run(main())