import '@testing-library/jest-dom'

// jsdom does not implement scrollIntoView — provide a no-op so components that call
// element.scrollIntoView() don't crash during tests.
window.HTMLElement.prototype.scrollIntoView = function () {}
