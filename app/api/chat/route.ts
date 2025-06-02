export async function POST(request: Request) {
    console.log('[NEXTJS API] Starting chat request...');

    try {
        const body = await request.json();
        console.log('[NEXTJS API] Request body parsed:', body);

        // Determine the backend URL based on environment
        const backendUrl = process.env.NODE_ENV === "development"
            ? 'http://127.0.0.1:8000/api/chat'
            : '/api/fastapi/chat';

        // Forward the request to FastAPI backend
        const fastApiResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        console.log('[NEXTJS API] FastAPI response status:', fastApiResponse.status);

        if (!fastApiResponse.ok) {
            throw new Error(`FastAPI error: ${fastApiResponse.status}`);
        }

        if (!fastApiResponse.body) {
            throw new Error('No response body from FastAPI');
        }

        console.log('[NEXTJS API] Creating stream transformer...');

        // CRITICAL: Create a ReadableStream that forwards bytes IMMEDIATELY
        const transformStream = new ReadableStream({
            start(controller) {
                console.log('[NEXTJS API] Stream started, getting FastAPI reader...');

                const reader = fastApiResponse.body!.getReader();
                let chunkCount = 0;

                // CRITICAL: This function must NOT await or buffer anything
                function pump(): Promise<void> {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            console.log('[NEXTJS API] FastAPI stream ended, closing controller');
                            controller.close();
                            return;
                        }

                        chunkCount++;
                        const timestamp = Date.now();

                        // Log the raw bytes received
                        const decoder = new TextDecoder();
                        const textContent = decoder.decode(value, { stream: true });
                        console.log(`[NEXTJS API] Chunk #${chunkCount} at ${timestamp}: ${textContent.length} bytes - "${textContent.slice(0, 50)}..."`);

                        // CRITICAL: Forward the chunk IMMEDIATELY without any processing
                        controller.enqueue(value);

                        // Continue pumping immediately
                        return pump();
                    }).catch(error => {
                        console.error('[NEXTJS API] Stream error:', error);
                        controller.error(error);
                    });
                }

                return pump();
            },
        });

        console.log('[NEXTJS API] Returning streaming response...');

        // Return the streaming response with anti-buffering headers
        return new Response(transformStream, {
            headers: {
                // CRITICAL: These headers prevent ALL forms of buffering
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
                'X-Content-Type-Options': 'nosniff',
                'Transfer-Encoding': 'chunked',
                // Ensure no proxy buffering
                'Proxy-Buffering': 'no',
                'Buffer': 'no',
            },
        });
    } catch (error) {
        console.error('[NEXTJS API ERROR]:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: String(error) }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 