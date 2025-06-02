import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('[NEXTJS] Received chat request, proxying to FastAPI...');

        const body = await request.json();
        console.log('[NEXTJS] Request body:', body);

        // Proxy the request to FastAPI backend
        const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
        const response = await fetch(`${fastApiUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
            },
            body: JSON.stringify(body),
        });

        console.log('[NEXTJS] FastAPI response status:', response.status);

        if (!response.ok) {
            throw new Error(`FastAPI error: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('No response body available');
        }

        // Create a streaming response
        const stream = new ReadableStream({
            start(controller) {
                const reader = response.body!.getReader();
                const decoder = new TextDecoder();

                function pump(): Promise<void> {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            console.log('[NEXTJS] Stream complete');
                            controller.close();
                            return;
                        }

                        // Decode and forward the chunk
                        const chunk = decoder.decode(value, { stream: true });
                        console.log('[NEXTJS] Forwarding chunk:', chunk.slice(0, 100));

                        controller.enqueue(value);
                        return pump();
                    }).catch((error) => {
                        console.error('[NEXTJS] Stream error:', error);
                        controller.error(error);
                    });
                }

                pump();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });

    } catch (error) {
        console.error('[NEXTJS] Error in chat proxy:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to process chat request' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
} 