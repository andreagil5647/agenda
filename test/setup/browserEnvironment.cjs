const { default: JSDOMEnvironment } = require('jest-environment-jsdom');

/**
 * jsdom implements the DOM but not fetch, so the networking globals of Node
 * are exposed to the tests. That is what lets MSW intercept and answer the
 * requests the app makes.
 *
 * FormData is left as jsdom provides it: Node's cannot be built from a <form>
 * element, and the app only uses FormData to read forms, never as a body.
 */
class BrowserEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);

    // jsdom is not a browser: resolve packages to their Node builds.
    this.customExportConditions = [''];

    Object.assign(this.global, {
      fetch,
      Request,
      Response,
      Headers,
      AbortController,
      AbortSignal,
      URL,
      URLSearchParams,
      Blob,
      TextEncoder,
      TextDecoder,
      ReadableStream,
      WritableStream,
      TransformStream,
      BroadcastChannel,
      structuredClone,
    });
  }
}

module.exports = BrowserEnvironment;
