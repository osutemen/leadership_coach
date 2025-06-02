export async function POST() {
    try {
        // In production, handle the reset logic directly
        if (process.env.NODE_ENV !== "development") {
            const { resetChat } = await import('../../../services/chat');
            const result = resetChat();
            return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // In development, forward to FastAPI backend
        const response = await fetch('http://127.0.0.1:8000/api/chat/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`FastAPI error: ${response.status}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in chat reset API route:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 