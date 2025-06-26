// src/posthogClient.js
import posthog from 'posthog-js'

posthog.init('phc_OwCAqcaP8ahG4awoddGdb3FvhWkZ5gM4wFBSbbtFe65', {
    api_host: 'https://eu.i.posthog.com', // or your self-hosted domain
    capture_pageview: true,
})

export default posthog
