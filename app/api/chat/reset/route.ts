import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('[NEXTJS] Received reset request, proxying to FastAPI...');

        // Proxy the request to FastAPI backend
        const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
        const response = await fetch(`${fastApiUrl}/api/chat/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('[NEXTJS] FastAPI reset response status:', response.status);

        if (!response.ok) {
            throw new Error(`FastAPI error: ${response.status}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[NEXTJS] Error in reset proxy:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to reset chat' }),
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