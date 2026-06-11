import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        guestForm: resolve(__dirname, 'guest-form.html'),
        agentLogin: resolve(__dirname, 'agent-login.html'),
        agentDashboard: resolve(__dirname, 'agent-dashboard.html'),
        agentFixedDepartures: resolve(__dirname, 'agent-fixed-departures.html'),
        agentBookings: resolve(__dirname, 'agent-bookings.html'),
        agentCosting: resolve(__dirname, 'agent-costing.html'),
        policies: resolve(__dirname, 'policies.html'),
        itinerary: resolve(__dirname, 'itinerary.html'),
        annapurnaTemplate: resolve(__dirname, 'annapurna_luxury_template.html'),
        valleyTemplate: resolve(__dirname, 'valley_of_flowers_template.html'),
      },
    },
  },
});
