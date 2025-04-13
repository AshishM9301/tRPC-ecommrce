/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    // experimental: {
    //     nodeMiddleware: true,
    // },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Client-side config if needed
            return config;
        }

        // Handle server-side externals for node: prefixes
        const nodeExternals = {
            "node:buffer": "commonjs buffer",
            "node:process": "commonjs process",
            "node:fs": "commonjs fs",
            "node:stream": "commonjs stream",
            // Add others if needed
        };

        if (Array.isArray(config.externals)) {
            config.externals.push(nodeExternals);
        } else if (typeof config.externals === 'object' && config.externals !== null) {
            config.externals = { ...config.externals, ...nodeExternals };
        } else if (typeof config.externals === 'undefined') {
            config.externals = nodeExternals;
        } else {
            // If it's a function or RegExp, we might need a more complex approach
            // For now, log a warning and don't modify it to avoid breaking it
            console.warn("[Webpack Externals] Unexpected type for config.externals:", typeof config.externals);
        }

        return config;
    },
};

export default config;
