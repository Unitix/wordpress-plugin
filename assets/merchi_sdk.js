// Wait for Merchi SDK to be loaded
(function(window) {
    // Function to initialize our SDK wrapper
    function initMerchiSDK() {
        if (window.MERCHI_INIT && window.MERCHI_INIT.MERCHI_SDK) {
            // Store SDK reference
            window.MERCHI_SDK = window.MERCHI_INIT.MERCHI_SDK;

            // Verify required methods are available
            const requiredMethods = ['Product', 'Job', 'getJobQuote', 'toJson'];
            const missingMethods = requiredMethods.filter(method => !window.MERCHI_SDK[method]);
            
            if (missingMethods.length > 0) {
                console.error('Merchi SDK is missing required methods:', missingMethods);
                return;
            }

            // Add any necessary SDK configuration
            if (window.merchiConfig && window.merchiConfig.apiUrl) {
                window.MERCHI_SDK.backendUri = window.merchiConfig.apiUrl;
                console.log('Setting backendUri to:', window.merchiConfig.apiUrl);
            } else {
                console.error('Missing apiUrl in merchiConfig');
                return;
            }

            // Initialize any SDK settings if needed
            if (window.merchiConfig && window.merchiConfig.apiSecret) {
                window.MERCHI_SDK.sessionToken = window.merchiConfig.apiSecret;
            }

            console.log('Merchi SDK initialized with config:', {
                backendUri: window.MERCHI_SDK.backendUri,
                hasSessionToken: !!window.MERCHI_SDK.sessionToken,
                hasRequiredMethods: true
            });

            // Trigger an event to notify that SDK is ready
            window.dispatchEvent(new Event('merchi_sdk_ready'));
        } else {
            console.error('Merchi SDK not found in window.MERCHI_INIT');
        }
    }

    // If MERCHI_INIT is already available, initialize immediately
    if (window.MERCHI_INIT) {
        initMerchiSDK();
    } else {
        // Otherwise wait for it to be loaded
        window.addEventListener('merchi_init_ready', initMerchiSDK);
    }
})(window);
