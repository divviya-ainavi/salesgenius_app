# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in the required environment variables:
   - `VITE_HUBSPOT_CLIENT_ID` - Your HubSpot app client ID
   - `VITE_HUBSPOT_CLIENT_SECRET` - Your HubSpot app client secret
   - `VITE_POSTHOG_KEY` - Your PostHog project API key
   - Other variables as needed

## Security Notes

- All sensitive keys are now stored in environment variables
- Never commit the `.env` file to version control
- Use `.env.example` as a template for required variables
- The app will warn you if required environment variables are missing

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
