export function getCookie(name) {
    // code might be executed during SSR
    // istanbul ignore next
    if (typeof document !== 'undefined') {
        var searchPrefix = name + '=', cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; ++i) {
            var cookie = cookies[i];
            cookie = cookie.replace(/^\s*/, '');
            if (cookie.indexOf(searchPrefix) === 0) {
                return cookie.substring(searchPrefix.length, cookie.length);
            }
        }
    }
    return undefined;
}
