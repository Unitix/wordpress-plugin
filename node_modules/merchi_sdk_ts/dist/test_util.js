export function setup() {
    beforeAll(function () {
        global.BACKEND_URI = 'http://example.com/';
    });
}
export function mockFetch(ok, data, status) {
    var mock = jest.fn();
    mock.mockImplementation(function () {
        return Promise.resolve({
            status: status,
            ok: ok,
            json: function () { return Promise.resolve(data); }
        });
    });
    global.fetch = mock;
    return mock;
}
