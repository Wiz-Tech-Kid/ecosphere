import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Import the react plugin

export default defineConfig({
    base: './', // Ensure assets like favicon are resolved correctly
    define: {
        'process.env.VITE_APP_TITLE': JSON.stringify('Eco-sphere'),
    },
    plugins: [react()], // Use the react plugin
});